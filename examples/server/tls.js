const ddns = require('../..');
const path = require('path');
const fs = require('fs');


console.log('*** NODE-DDNS Example - TLS Server ***');
const cert = fs.readFileSync(path.join(__dirname,"server.crt"));
const key = fs.readFileSync(path.join(__dirname,"secret.key"));
const server = new ddns.TLSServer({port:853,cert:cert,key:key});
const zoneData = JSON.parse(fs.readFileSync(path.join(__dirname,'./zones.json')));

console.log(`Loaded ${Object.keys(zoneData).length} zones from zones.json`)

server.listen().then(()=>{
    console.log(`Listening on ${server.address}:${server.port}`);
})


server.on('request', (request, response, rinfo) => {

    request.questions.forEach(function (question) {

        var answers = ddns.ServerUtilities.objectZoneLookup(zoneData,question);
        if (answers.length==0) {
            console.log(`Query for ${question.type} records of '${question.name}': responded NXDOMAIN` )
            response(ddns.ServerUtilities.createNXDomainResponseFromRequest(request));
        } else {
            console.log(`Query for ${question.type} records of '${question.name}': responded '${JSON.stringify(answers[0].data)}'` )
            response(ddns.ServerUtilities.createSuccessResponseFromRequest(request,answers));
        }
    });

});