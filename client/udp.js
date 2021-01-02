const dgram = require('dgram')
const dnsPacket = require('dns-packet')

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function rawQuery(server,queries,flags=dnsPacket.RECURSION_DESIRED,port=53,ipv=4) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp'+ipv)
        const buf = dnsPacket.encode({
            type: 'query',
            id: getRandomInt(1, 65534),
            flags: flags,
            questions: queries
        })

        socket.on('message', message => {
            socket.close();
            resolve(dnsPacket.decode(message));
        });
        
        socket.on('error', e => {
            reject(e);
        });
        
        socket.send(buf, 0, buf.length, port, server);
    });
}

module.exports = {
    rawQuery: rawQuery
}