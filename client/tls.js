const tls = require('tls');
const dnsPacket = require('dns-packet')

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function rawQuery(server,queries,flags=dnsPacket.RECURSION_DESIRED,port=853) {
    return new Promise((resolve, reject) => {
        const buf = dnsPacket.streamEncode({
            type: 'query',
            id: getRandomInt(1, 65534),
            flags: flags,
            questions: queries
        });
     
        const context = tls.createSecureContext({
            secureProtocol: 'TLSv1_2_method'
        })
        
        const options = {
            port: port,
            host: server,
            secureContext: context
        }
        
        const client = tls.connect(options, () => {
            client.write(buf);
        })

        var response = null;
        var expectedLength = 0;
        
        client.on('data', function (data) {
            if (response == null) {
                if (data.byteLength > 1) {
                    const plen = data.readUInt16BE(0);
                    expectedLength = plen;
                    if (plen < 12) {
                        reject('Below DNS minimum packet length');
                    }
                    response = Buffer.from(data);
                }
            } else {
                response = Buffer.concat([response, data]);
            }
        
            if (response.byteLength >= expectedLength) {
                resolve(dnsPacket.streamDecode(response));
                client.destroy();
            }
        });
        
        client.on('end', () => {
            reject(Error('Remote server closed socket'));
        })
    });
}

module.exports = {
    rawQuery: rawQuery
}