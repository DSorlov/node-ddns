const dgram = require('dgram')
const dnsPacket = require('dns-packet');
const EventEmitter = require('events');

class UDPServer extends EventEmitter {
    constructor(options) {
        super();
        this.type = options.type ? options.type : 'udp4';
        this.wildcard = this.type=='udp4' ? '0.0.0.0' : '::';
        this.port = options.port ? options.port : 53;
        this.address = options.address ? options.address : this.wildcard;

        this.socket = dgram.createSocket(this.type);
        this.socket.on('message', this.#handle.bind(this));
    };
    #handle = function(message, rinfo) {
        const packet = dnsPacket.decode(message);
        this.emit('request', packet, this.#send.bind(this, rinfo), rinfo);        
    };    
    #send = function(rinfo, message) {  
        const buf = dnsPacket.encode(message);
        this.socket.send(buf, rinfo.port, rinfo.address, err => {
        });
    };
    listen() {
        return new Promise(resolve =>
          this.socket.bind(this.port, this.address, resolve));
    }    
};
 
module.exports = UDPServer;