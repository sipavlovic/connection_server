from flask import Flask, request, jsonify, url_for
import db
import traceback


app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False


@app.errorhandler(Exception)
def exception_handler(error):
    tracelist = str(traceback.format_exc()).split('\n')
    return jsonify({"message":"Internal server error","trace":tracelist}),500

def message(message,code):
    return jsonify({"message":message}),code


@app.route("/",methods=["GET","POST"])
def root():
    "HTML client"
    if request.method=="GET":
        return app.send_static_file('index.html')
    elif request.method=="POST":
        j = request.get_json(force=True)
        q = request.args
        return jsonify({"json":j,"query":q})


@app.route("/swagger",methods=["GET"])
def swagger():
    "Swagger client"
    return app.send_static_file('swagger.html')




@app.route("/api",methods=["GET"])
def api_list():
    "List API endpoints"
    apilist = []
    for rule in app.url_map.iter_rules():
        url = str(rule)
        apilist.append({"url":url,"methods":list(rule.methods),"desc":app.view_functions[rule.endpoint].__doc__})
    return jsonify({"api":apilist})


@app.route("/api/conn",methods=["GET","POST"])
def conn():
    "Get list of open connections, open new connection"
    if request.method=="GET":
        l = [{"token":token,"desc":db.conndict[token].desc} for token in db.conndict.keys()]
        return jsonify(l)
    elif request.method=="POST":
        json = request.get_json(force=True)
        connstr = json.get("conn",None);
        if connstr is None:
            connstr = 'scott/oracle@orcl'
        desc = json.get("desc","")
        token = db.open_connection(connstr,desc)
        return jsonify({"token":token,"desc":desc}),201


@app.route("/api/conn/<token>",methods=["GET","POST","DELETE"])
def conn_id(token):
    "Execute code within connection specified by token, close connection"
    if request.method=="GET":
        if token in db.conndict.keys():
            c = db.conndict[token]
            return jsonify({"desc":c.desc,"token":token})
        else:
            return message("token %s not found"%token,404)
    elif request.method=="DELETE":
        t = db.close_connection(token)
        if t is None:
            return message("token %s not found"%token,404)
        return message("token %s deleted"%token,200)
    elif request.method=="POST":
        conn = db.get_connection(token)
        if conn is None:
            return message("token %s not found"%token,404)
        cur = conn.cursor()
        json = request.get_json(force=True)
        sql = json.get("sql",None);
        if sql is None:
            return message("sql key not in json data",400)
        invars = json.get("invars",{})
        outvars = json.get("outvars",{})
        fetchmax = json.get("fetchmax",500)
        try:
            if fetchmax is None:
                fetchmax = 500
            else:
                fetchmax = int(fetchmax)
        except ValueError:
            return message("invalid fetchmax key format",400)
        if fetchmax<1:
            return message("number of rows to fetch should be greater than 0",400)    
        desc,data = db.execute_sql(cur,sql,fetchmax,invars,outvars)
        cur.close()
        return jsonify({"desc":desc,"data":data,"sql":sql,"fetchmax":fetchmax,"invars":invars,"outvars":outvars})


db.open_connection('scott/oracle@orcl','First connection')
db.open_connection('scott/oracle@orcl','Second connection')


if __name__=="__main__":
    app.run(host='0.0.0.0',port=8000, debug=True)
