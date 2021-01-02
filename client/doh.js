const https = require('https')
const http = require('http');
const fs = require('fs');
const path = require('path');
const dnsPacket = require('dns-packet')

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function Query(server,queries,flags=dnsPacket.RECURSION_DESIRED,port=443,timeout=2) {
    return new Promise((resolve, reject) => {
        var timer=setTimeout(()=>{clearTimeout(timer);reject('timeout');}, (timeout*1000));

        var packet = {
            type: 'query',
            id: getRandomInt(1, 65534),
            flags: flags,
            questions: queries
        };
        const buf = dnsPacket.encode(packet);

        const options = {
            hostname: server,
            port: port,
            path: '/dns-query',
            method: 'POST',
            headers: {
                'Content-Type': 'application/dns-message',
                'Content-Length': Buffer.byteLength(buf)
            }
        }

        const request = https.request(options, (response) => {
            response.on('data', (d) => {
                clearTimeout(timer);
                resolve(dnsPacket.decode(d));
            })
        })

        request.on('error', (e) => {
            clearTimeout(timer);
            reject(Error(e));
        })

        request.write(buf);
        request.end();
    });
}

function getExternalIP(ipv) {
    const version = process.env.npm_package_version ? process.env.npm_package_version : JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).version;
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: `ipv${ipv}.ipadress.se`,
            port: 443,
            path: "/",
            method: 'GET',
            headers: {
                'User-Agent': `node-ddns/${version}`  
              }
        }, (res)=>{
            if (res.statusCode!==200)
                reject(new Error("HTTP response code " + res.statusCode + " while determining real ip."));

            res.on('data', data => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error("Parser error '" + error + "' while determining real ip."));
                }
            })        
        });
        req.on('error', error => {
                reject(error);
        })
        req.end()
    });    
};

function internalUpdateDyndns2(server,username,password,hostname,ip,port,protocol,uri) {
    const version = process.env.npm_package_version ? process.env.npm_package_version : JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).version;
    const authData = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
    const options = {
        hostname: server,
        port: port,
        path: uri + `?hostname=${hostname}&myip=${ip}`,
        method: 'GET',
        headers: {
            'Authorization': authData,
            'User-Agent': `node-ddns/${version}`  
          }
    }

    return new Promise((resolve, reject) => {
        const req = (protocol == 'https' ? https : http).request(options, (res)=>{
            if (res.statusCode===200)
                resolve();
            else
                reject(new Error("HTTP response code " + res.statusCode + " when updating."));    
        });
        req.on('error', error => {
            reject(error);
        })
        req.end();
    });
}

function UpdateDyndns2(server,username,password,hostname,ip="",ipv=4,port=443,protocol="https",uri="/nic/update") {
    return new Promise((resolve, reject) => {
        if (ip=="") {
            getExternalIP(ipv).then((lookup)=>{
                internalUpdateDyndns2(server,username,password,hostname,lookup.query,port,protocol,uri).then(resolve,reject);
            }).catch((error)=> {
                reject(error);
            });
        } else {
            internalUpdateDyndns2(server,username,password,hostname,ip,port,protocol,uri).then(resolve,reject);
        }
    });
}

module.exports = {
    Query,
    UpdateDyndns2
}