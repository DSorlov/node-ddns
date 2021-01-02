const net = require('net')
const dnsPacket = require('dns-packet')

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function rawQuery(server,queries,flags=dnsPacket.RECURSION_DESIRED,port=53) {
  return new Promise((resolve, reject) => {
    const buf = dnsPacket.streamEncode({
        type: 'query',
        id: getRandomInt(1, 65534),
        flags: flags,
        questions: queries
    });
    const client = new net.Socket()

    client.connect(port, server, function () {
      client.write(buf)
    })

    var response = null
    var expectedLength = 0
    client.on('data', function (data) {
        if (response == null) {
          if (data.byteLength > 1) {
            const plen = data.readUInt16BE(0)
            expectedLength = plen
            if (plen < 12) {
              throw new Error('Below DNS minimum packet length')
            }
            response = Buffer.from(data)
          }
        } else {
          response = Buffer.concat([response, data])
        }
      
        if (response.byteLength >= expectedLength) {
          resolve(dnsPacket.streamDecode(response));
          client.destroy()
        }
      })
      
      client.on('close', function () {
        reject('Remote server closed socket');
      })    
    });
}

module.exports = {
    rawQuery: rawQuery
}