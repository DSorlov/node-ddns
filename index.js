const { TCPClient, UDPClient, DOHClient, TLSClient } = require('./client');
const { TCPServer, UDPServer, DOHServer, TLSServer, ServerUtilities } = require('./server');
const { EventEmitter } = require('events');
const dnsPacket = require('dns-packet');

class DDNS extends EventEmitter {
  constructor(options) {
    super();
    Object.assign(this, {
      client: UDPClient,
      port: 53,
      protocol: 4,
      timeout: 1,
      nameServers: [
        '8.8.8.8',
        '1.1.1.1'
      ],
      rootServers: [
        'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm'
      ].map(x => `${x}.root-servers.net`)
    }, options);
  };

  #query = function(name, type, cls) {
    const { port, nameServers, client, protocol, timeout } = this;
    return Promise.race(nameServers.map(address => {
      return new Promise((resolve,reject) => {
        client.Query(address,[{type: type, name: name, class:cls}],dnsPacket.RECURSION_DESIRED,port,protocol,timeout).then((result)=>{
          resolve(result);
        }).catch((error)=>{
          reject("error: "+error);
        })
      });
    }));
  };

  Resolve = function(name, type = 'ANY', cls = 'IN') {
    return this.#query(name, type, cls);
  };

  ResolveA = function(name) {
    return this.#query(name, 'A', 'IN');
  };

  ResolveAAAA = function(name) {
    return this.#query(name, 'AAAA', 'IN');
  };

  ResolveMX = function(name) {
    return this.#query(name, 'MX', 'IN');
  };

  ResolveCNAME = function(name) {
    return this.#query(name, 'CNAME', 'IN');
  };
}

DDNS.TCPClient = TCPClient;
DDNS.UDPClient = UDPClient;
DDNS.DOHClient = DOHClient;
DDNS.TLSClient = TLSClient;

DDNS.UDPServer = UDPServer;
DDNS.TCPServer = TCPServer;
DDNS.DOHServer = DOHServer;
DDNS.TLSServer = TLSServer;
DDNS.ServerUtilities = ServerUtilities;

module.exports = DDNS;