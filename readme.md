Connection Server for Oracle Database
=====================================


This experiment is an attempt to solve database transaction problem in microservice architecture. The idea is to have one (or more) rest api servers that holds dedicated database connections, each one with it's own token, and to be able to execute PL/SQL code within choosen transaction, regardless of microservice from which request is sent.

In typical scenario, let's assume that there are two microservices (A and B), that needs to execute PL/SQL statements within same transaction. Simple example is following:

* Microservice A sends request to open connection to connection server, and receives connection token
* Microservice A executes PL/SQL by reffering to connection token
* Microservice A sends token to microservice B
* Microservice B executes PL/SQL by reffering to token
* Microservice B executes COMMIT by reffering to token
* Microservice B close connection


Requirements
------------

Server is written in Python 3.6 using Flask and cx_Oracle:
* Python: https://www.python.org/
* Flask: https://palletsprojects.com/p/flask/
* cx_Oracle: https://github.com/oracle/python-cx_Oracle/blob/master/doc/src/index.rst

Client web page (handy, but not necessary for usage) is written in javascript, using ACE editor and JQuery:
* Ace Editor: https://ace.c9.io/
* JQuery: https://jquery.com/


License
-------

Written by Sinisa Pavlovic, sipavlovic@gmail.com

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.



