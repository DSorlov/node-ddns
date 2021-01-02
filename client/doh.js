const https = require('https')
const dnsPacket = require('dns-packet')

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function rawQuery(server,queries,flags=dnsPacket.RECURSION_DESIRED,port=443) {
    return new Promise((resolve, reject) => {

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
                resolve(dnsPacket.decode(d));
            })
        })

        request.on('error', (e) => {
            reject(Error(e));
        })

        request.write(buf);
        request.end();
    });
}


module.exports = {
    rawQuery: rawQuery
}