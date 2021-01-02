const dnsPacket = require('dns-packet');
const EventEmitter = require('events');
const tls = require('tls');

class TLSServer extends EventEmitter {
    constructor(options) {
        super();
        this.type = options.type ? options.type : 'ipv4';
        this.wildcard = this.type=='ipv4' ? '0.0.0.0' : '::';
        this.port = options.port ? options.port : 53;
        this.address = options.address ? options.address : this.wildcard;
        this.cert = options.cert ? options.cert : '';
        this.key = options.key ? options.key : '';
        this.rejectUnauthorized = options.rejectUnauthorized ? options.rejectUnauthorized : false;

        if (this.cert=='') this.cert = fs.readFileSync(path.join(__dirname,"server.crt"));
        if (this.key=='') this.key = fs.readFileSync(path.join(__dirname,"secret.key"));

        this.socket = tls.createServer({
          key: this.key,
          cert: this.cert,
          rejectUnauthorized: this.rejectUnauthorized
        });

        if (options.onRequest && typeof options.onRequest === 'function')
            this.socket.on('request', options.onRequest);

        this.socket.on('connection', this.#handle.bind(this));
    };
    #handle = async function(client) {
        const data = await this.#readStream(client);
        const packet = dnsPacket.decode(data);
        this.emit('request', packet, this.#send.bind(this, client), client);   
    };
    #send = function(client, message) {
        const buf = dnsPacket.encode(message);
        const len = Buffer.alloc(2);
        len.writeUInt16BE(buf.length);
        client.end(Buffer.concat([len, buf]));
    };
    listen() {
        return new Promise(resolve =>
          this.socket.listen(this.port, this.address, () => {
            resolve();
          })
        );
    }  
    #readStream = async function(socket) {
        let chunks = [];
        let chunklen = 0;
        let received = false;
        let expected = false;
        return new Promise((resolve, reject) => {
          const processMessage = () => {
            if (received) return;
            received = true;
            const buffer = Buffer.concat(chunks, chunklen);
            resolve(buffer.slice(2));
          };
          socket.on('end', processMessage);
          socket.on('error', reject);
          socket.on('readable', () => {
            let chunk;
            while ((chunk = socket.read()) !== null) {
              chunks.push(chunk);
              chunklen += chunk.length;
            }
            if (!expected && chunklen >= 2) {
              if (chunks.length > 1) {
                chunks = [Buffer.concat(chunks, chunklen)];
              }
              expected = chunks[0].readUInt16BE(0);
            }
      
            if (chunklen >= 2 + expected) {
              processMessage();
            }
          });
        });
      };    
}

module.exports = TLSServer;