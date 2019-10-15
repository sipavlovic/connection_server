from cx_Oracle import Connection
from cx_Oracle import STRING, NUMBER, DATETIME
import secrets


id = 1
conndict = {}

class Conn:
    def __init__(self,conn,desc=''):
        self.conn = conn
        self.desc = desc


vartypes = {
   "STRING": STRING,
   "NUMBER": NUMBER,
   "DATETIME": DATETIME
}



def get_token():
    global id
    token = "%s%x"%(secrets.token_hex(8),id)
    id += 1
    return token


def open_connection(connstr,desc=''):
    global conndict
    conn = Connection(connstr,encoding="UTF-8")
    token = get_token()    
    conndict[token] = Conn(conn,desc)
    return token


def close_connection(token):
    global conndict
    if token in conndict.keys():
        conndict[token].conn.close()
        del conndict[token]
        return token
    return None


def get_connection(token):
    global conndict
    if token in conndict.keys():
        return conndict[token].conn
    return None


def execute_sql(cur,sql,fetchmax,invars={},outvars={}):   
    data = []
    desc = []
    # binds
    vardict = {}
    for name in outvars.keys():
        vardict[name]=cur.var(vartypes[outvars[name]])
        if name in invars.keys():
            vardict[name].setvalue(0, invars[name])
    for name in invars.keys():
        if name not in vardict.keys():
            vardict[name]=invars[name]
    #execution
    cur2 = cur.execute(sql,**vardict)
    #results
    if cur2 is not None:
        # select results
        l = cur.fetchmany(fetchmax)
        desc=[{"name":x[0],"type":str(x[1])} for x in cur.description]
        if len(l)>0:
            for r in l:
                dd = {}
                for i in range(len(r)):
                    dd[desc[i]["name"]]=r[i]
                data.append(dd)
    else:
        # non-select results
        ddata = {}
        for name in outvars.keys():
            if name in vardict.keys():
                ddata[name]=vardict[name].getvalue()
                desc.append({"name":name,"type":str(vardict[name])})
        data = [ddata]
    return desc,data                




    
