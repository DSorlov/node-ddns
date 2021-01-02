const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const EventEmitter = require("events");
const dnsPacket = require('dns-packet');

class DOHServer extends EventEmitter {
    constructor(options) {
        super();

        // Set defaults and then check what the cat brought in
        this.type = options.type ? options.type : 'ipv4';
        this.wildcard = this.type=='ipv4' ? '0.0.0.0' : '::';
        this.port = options.port ? options.port : 80;
        this.sslport = options.sslport ? options.sslport : 443;
        this.cert = options.cert ? options.cert : '';
        this.key = options.key ? options.key : '';
        this.address = options.address ? options.address : this.wildcard;
        this.dyndns2 = options.dyndns2 ? true : false;

        //If no cert or key specified make a futile atempt of reading default names
        if (this.cert=='') this.cert = fs.readFileSync(path.join(__dirname,"server.crt"));
        if (this.key=='') this.key = fs.readFileSync(path.join(__dirname,"secret.key"));

        // if http port is specified create http server. However DoH needs SSL so a proxy must be infront.
        if (this.port!=0)
            this.httpOptions = {};
            this.httpServer = http.createServer(this.httpOptions);
            this.httpServer.on("request", this.#handleRequest.bind(this)) 

        // if SSL-port, key and cert is specified then create an SSL endpoint
        if (this.sslport!=0&&this.key!=''&&this.cert!='')
            this.httpsOptions = {
                key: this.key,
                cert: this.cert
            };
            this.httpsServer = https.createServer(this.httpsOptions);   
            this.httpsServer.on("request", this.#handleRequest.bind(this)) 
    };

    #errorOut = function(res,code,text,headers={}) {
        res.writeHead(code, Object.assign(headers,{"Content-Type": "text/plain"}));
        res.write(`${code} ${text}\n`);
        res.end();
    }

    #handleRequest = function(req,res) {
        const method = req.method;            
        const uri = url.parse(req.url).pathname;
        const contentType = req.headers['accept'];
        const queryObject = url.parse(req.url,true).query;

        if (method=="GET"&&uri=="/nic/update"&&this.dyndns2) {
            const authHeader = req.headers["authorization"] || '';       // get the auth header
            if (!authHeader) {
                this.#errorOut(res,401,"Unauthorized", {"WWW-Authenticate": "Basic realm=\"ddns\""});
                return;
            }
            const hostname=queryObject["hostname"];
            const myip=queryObject["myip"];
            if (!hostname||!myip) {
                this.#errorOut(res,400,"Bad Request: Arguments missing");
                return;    
            }

            const authToken = authHeader.split(/\s+/).pop() || '';        // and the encoded auth token
            const authString = Buffer.from(authToken, 'base64').toString(); // convert from base64
            const authParts = authString.split(/:/);                        // split on colon
            const username = authParts.shift();                       // username is first
            const password = authParts.join(':');                     // everything else is the password

            //Raise event
            this.emit('dyndns2', {
                hostname: hostname,
                ip: myip,
                username: username,
                password: password,
            }, this.#plainResponse.bind(this, res), req);            

            return;
        }

        // We are only handling get and post as reqired by rfc
        if ((method!="GET" && method!="POST")) {
            this.#errorOut(res,405,"Method not allowed");
            return;
        }
    
        // Check so the uri is correct
        if (uri!="/dns-query") {
            this.#errorOut(res,404,"Not Found");
            return;
        }
        
        // Make sure the requestee is requesting the correct content type
        if (contentType!="application/dns-message") {
            this.#errorOut(res,400,"Bad Request: Illegal content type");
            return;
        }
    
        var queryData = {};
    
        if (method == 'GET') {
            //Parse query string for the request data
            if (!queryObject.dns) {
                this.#errorOut(res,400,"Bad Request: No query defined");
                return;
            }
            
            //Decode from Base64Url Encoding
            var queryData = queryObject.dns.replace(/-/g, '+').replace(/_/g, '/');
            var pad = queryData.length % 4;
            if(pad) {
                if(pad === 1) {
                    this.#errorOut(res,400,"Bad Request: Invalid query data");
                    return;
                }
                queryData += new Array(5-pad).join('=');
            }

            //Decode Base64 to buffer
            queryData = Buffer.from(queryData, 'base64');
            const message = Packet.parse(queryData);
    
            //Raise event
            this.emit('request', message, this.#messageResponse.bind(this, res), req);
    
        } else {
    
            // Collect request from client and..
            this.#collectRequestData.then((request)=>{
                const message = Packet.parse(request);
    
                //then raise the event
                this.emit('request', message, this.#messageResponse.bind(this, res), req);    
            });
        }
        
    }; 

    // Send of the response to the client
    #messageResponse = function(res, message) {
        res.setHeader('Content-Type', 'application/dns-message');
        res.writeHead(200);
        res.end(message.toBuffer());
    };
    #plainResponse = function(res, status, message) {
        res.setHeader('Content-Type', 'text/plain');
        res.writeHead(status);
        res.end(message);
    };

    // Wait for the request body to be received
    #collectRequestData = async function(request) {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
        });
        request.on('end', () => {
            callback(body);
        });
    };

    listen() {

        const httpsPromise = new Promise((resolve) => {
            if (!this.httpsServer) resolve();
            this.httpsServer.listen(this.sslport, this.address, resolve);
        });

        const httpPromise = new Promise((resolve) => {
            if (!this.httpServer) resolve();
            this.httpServer.listen(this.port, this.address, resolve);
        });

        return new Promise(resolve =>
            Promise.all([httpPromise, httpsPromise]).then(() => {
                resolve();
            })
        );
          
    };      

}

module.exports = DOHServer;