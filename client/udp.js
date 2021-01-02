const dgram = require('dgram')
const dnsPacket = require('dns-packet')

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function Query(server,queries,flags=dnsPacket.RECURSION_DESIRED,port=53,ipv=4,timeout=2) {
    return new Promise((resolve, reject) => {
        var timer=setTimeout(()=>{socket.close();clearTimeout(timer);reject('timeout');}, (timeout*1000));
        const socket = dgram.createSocket('udp'+ipv)
        const buf = dnsPacket.encode({
            type: 'query',
            id: getRandomInt(1, 65534),
            flags: flags,
            questions: queries
        })

        socket.on('message', message => {
            socket.close();
            clearTimeout(timer);
            resolve(dnsPacket.decode(message));
        });
        
        socket.on('error', e => {
            clearTimeout(timer);
            reject(e);
        });
        
        socket.send(buf, 0, buf.length, port, server);
    });
}

module.exports = {
    Query: Query
}