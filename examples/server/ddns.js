const ddns = require('../..');
const path = require('path');
const fs = require('fs');

// Initialization
console.log('*** NODE-DDNS Example - Complete DDNS Server Example ***');
const cert = fs.readFileSync(path.join(__dirname,"server.crt"));
const key = fs.readFileSync(path.join(__dirname,"secret.key"));

// Load the zone data
const zoneData = JSON.parse(fs.readFileSync(path.join(__dirname,'./zones.json')));
console.log(`Loaded ${Object.keys(zoneData).length} zones from zones.json`)

// Setup all listeners
const tcpServer = new ddns.TCPServer({port:53});
const udpServer = new ddns.UDPServer({port:53});
const tlsServer = new ddns.TLSServer({port:853,cert:cert,key:key});
const dohServer = new ddns.DOHServer({sslport:443,port:80,cert:cert,key:key,dyndns2:true});

// Log all listen returns to console
tcpServer.listen().then(()=>{
    console.log(`TCP Listening on ${tcpServer.address}:${tcpServer.port}`);
});
udpServer.listen().then(()=>{
    console.log(`UDP Listening on ${udpServer.address}:${udpServer.port}`);
});
tlsServer.listen().then(()=>{
    console.log(`TLS Listening on ${tlsServer.address}:${tlsServer.port}`);
});
dohServer.listen().then(()=>{
    if (dohServer.port!=0) console.log(`HTTP Listening on ${dohServer.address}:${dohServer.port}`);
    if (dohServer.sslport!=0) console.log(`HTTPS Listening on ${dohServer.address}:${dohServer.sslport}`);
});

// Setup handlers on requests
tcpServer.on('request', handleRequest);
udpServer.on('request', handleRequest);
tlsServer.on('request', handleRequest);
dohServer.on('request', handleRequest);
dohServer.on('dyndns2', handleDyndns2Update);

// Handle dns queries
function handleRequest(request, response, rinfo) {

    request.questions.forEach(function (question) {

        var answers = ddns.ServerUtilities.objectZoneLookup(zoneData,question);
        if (answers.length==0) {
            console.log(`Query for ${question.type} records of '${question.name}': responded NXDOMAIN` )
            response(ddns.ServerUtilities.createNXDomainResponseFromRequest(request));
        } else {
            console.log(`Query for ${question.type} records of '${question.name}': responded '${JSON.stringify(answers)}'` )
            response(ddns.ServerUtilities.createSuccessResponseFromRequest(request,answers));
        }
    });
};

// Handle update queries
function handleDyndns2Update(update, response, rinfo) {
    var type = update.ip.includes(":") ? "AAAA" : "A";
    var records = ddns.ServerUtilities.objectZoneLookup(zoneData,{type:type, name:update.hostname},false);
    
    if (records.length==0) {
        response(404,"404 Not found");
        return;
    }

    if (records[0].username!=update.username||records[0].password!=update.password) {
        response(403,"403 Access Denied")
        return;
    }
        
    var indexLocation = zoneData[records[0].zone].findIndex(record => record.name === records[0].name && record.type === type);
    zoneData[records[0].zone][indexLocation].data = update.ip;

    var soarecords = ddns.ServerUtilities.objectZoneLookup(zoneData,{type:"SOA", name:records[0].zone});
    if (soarecords.length==1)
    {
        var soaLocation = zoneData[records[0].zone].findIndex(record => record.name === "@" && record.type === "SOA");
        zoneData[records[0].zone][soaLocation].data.serial = parseInt(zoneData[records[0].zone][soaLocation].data.serial+1);            
    }

    fs.writeFileSync(path.join(__dirname,'./zones.json'), JSON.stringify(zoneData,null,2));

    console.log(`Dyndns2 updated ${type}-record for ${records[0].name} in ${records[0].zone} to ${update.ip}`);
    response(200,"OK");
};