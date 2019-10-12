
TOKEN = null;
FETCHMAX = 500;

WHITESPACE = " \n\r\t";
QUOTES = "'"+'"';
BRAKETS = "{[";

str = function(obj) {
	return JSON.stringify(obj);
} 

editor_message = function(text) {
    editor.insert('\n'+text);     
}

ajaxcall = function(url,method,jsondata,cb) {
    $.ajax({
        url:url,
        type:method,
        data:jsondata,
        complete:cb
    });    
}

parse_symbol = function(s) {
    var word = ""
    while (s.length>0 && (WHITESPACE+QUOTES).indexOf(s[0])<0) {
        word += s[0];
        s = s.substr(1);
    }
    return [word,s];
}

parse_string = function(s) {
    var word = "";
    var delimiter = s[0];
    s = s.substr(1);
    while (s.length>0 && s[0]!=delimiter) {
        word += s[0];
        s = s.substr(1);
    }
    if (s.length>0 && s[0]==delimiter) {
        s = s.substr(1);
    }
    return [word,s];
}

parse_json = function(s) {
    var word = s[0];
    var openbracket = s[0];
    var closebracket = "[";
    if (openbracket=="{") closebracket = "}";
    var count = 1;
    s = s.substr(1);
    while (s.length>0 && count>0) {
        if (s[0]==openbracket) count++;
        if (s[0]==closebracket) count--;
        word += s[0];
        s = s.substr(1);        
    }
    return [word,s];
}

parse_command = function(s) {
    var r = [];
    while (s.length>0) {
        if (QUOTES.indexOf(s[0])>=0) {
            var l = parse_string(s);
            if (l[0].length>0) {
                r.push(l[0].trim());
            }
            s = l[1];
        } else if (WHITESPACE.indexOf(s[0])>=0) {
            s = s.substr(1);
        } else if (BRAKETS.indexOf(s[0])>=0) {
            var l = parse_json(s);
            if (l[0].length>0) {
                r.push(l[0].trim());
            }
            s = l[1];
        } else {
            var l = parse_symbol(s);
            if (l[0].length>0) {
                r.push(l[0].trim());
            }
            s = l[1];
        }
    }
    return r;
}

// --------------------

api_general = function(method,path,json) {
    ajaxcall(path,method,json,function(xhr) {
        editor_message(xhr.responseText);        
    });
}

api_get_conn = function() {
    api_general('get','api/conn',null);
}

api_post_conn = function(conn,desc) {
    var d = {"conn":conn,"desc":desc};
    api_general('post','api/conn',str(d));
}

api_get_conn_token = function(token) {
    api_general('get','api/conn/'+token,null);
}

api_post_conn_token = function(token,sql) {
    var d = {"sql":sql,"fetchmax":FETCHMAX}
    api_general('post','api/conn/'+token,str(d));
}

api_delete_conn_token = function(token) {
    api_general('delete','api/conn/'+token,null);
}




// ---------------------


execute_command = function(text) {
    var p = parse_command(text);
    if (p[0] && p[0][0]=='.') {
        if (p[0] && p[0].toUpperCase()=='.LIST') {
            if (p.length==1) {
                api_get_conn();    
            } else {
                editor_message("ERROR: Wrong number of arguments for .LIST");
            }
            return;
        } 
        if (p[0] && p[0].toUpperCase()=='.OPEN') {
            if (p.length==2) {
                api_post_conn(p[1],'');            
            } else if (p.length==4 && p[2].toUpperCase()=='DESC') {
                api_post_conn(p[1],p[3]);
            } else {
                editor_message("ERROR: Wrong number of arguments for .OPEN");
            } 
            return;
        } 
        if (p[0] && p[0].toUpperCase()=='.CLOSE') {
            if (p.length==2) {
                api_delete_conn_token(p[1]);
            } else {
                editor_message("ERROR: Wrong number of arguments for .CLOSE");
            }
            return;
        } 
        if (p[0] && p[0].toUpperCase()=='.USE') {
            if (p.length==2) {
                TOKEN = p[1];
                api_get_conn_token(TOKEN)
            } else if (p.length==1) {
                api_get_conn_token(TOKEN)
            } else {
                editor_message("ERROR: Wrong number of arguments for .USE");
            }
            return;
        } 
        if (p[0] && p[0].toUpperCase()=='.FETCHMAX') {
            if (p.length==2) {
                FETCHMAX = p[1];
                editor_message("Max rows to fetch: "+FETCHMAX);
            } else if (p.length==1) {
                editor_message("Max rows to fetch: "+FETCHMAX);        
            } else {
                editor_message("ERROR: Wrong number of arguments for .FETCHMAX");
            }
            return;
        } 
        if (p[0] && p[0].toUpperCase()=='.API') {
            if (p.length==1) {
                api_general('get','/api',null);                
            } else if (p.length==3) {
                api_general(p[1],p[2],null);                
            } else if (p.length==4) {
                api_general(p[1],p[2],p[3]);
            } else {
                editor_message("ERROR: Wrong number of arguments for .API");
            }
            return;
        }
        if (p[0] && p[0].toUpperCase()=='.HELP') {
            if (p.length==1) {
                editor_message('-------------------------------------------------------------------------------------------------');
                editor_message('List of commands:');
                editor_message('-------------------------------------------------------------------------------------------------');
                editor_message('.LIST                                          - Get list of all conections');
                editor_message('.OPEN <connection string> [DESC <description>] - Open new connection');
                editor_message('.CLOSE <token>                                 - Close connection identified by <token>');
                editor_message('.USE [<token>]                                 - Use <token> in SQL / show current token');
                editor_message('.FETCHMAX [<number of rows>]                   - Set/show max number of rows to fetch');
                editor_message('.API [<method> <url> [<json>]]                 - Show api / Call api by <method> <url> and <json>');
                editor_message('.HELP                                          - This help');
                editor_message('<PL/SQL statement>                             - Execute PL/SQL statement with current token');
                editor_message('-------------------------------------------------------------------------------------------------');
                editor_message('');
            } else {
                editor_message("ERROR: Wrong number of arguments for .HELP");
            }
            return;
        }
        editor_message("ERROR: Invalid command "+str(p));
        return;
    }
    if (TOKEN) {
        api_post_conn_token(TOKEN,text);
    } else {
        editor_message("ERROR: No token in use");   
    }
}

