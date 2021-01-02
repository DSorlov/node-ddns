const { TCPClient, UDPClient, DOHClient, TLSClient } = require('./client');
const { TCPServer, UDPServer, DOHServer, TLSServer, ServerUtilities } = require('./server');
const { EventEmitter } = require('events');

class DDNS extends EventEmitter {
  constructor(options) {
    super();
    Object.assign(this, {
      port: 53,
      retries: 3,
      timeout: 3,
      nameServers: [
        '8.8.8.8',
        '114.114.114.114',
      ],
      rootServers: [
        'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm'
      ].map(x => `${x}.root-servers.net`)
    }, options);
  }
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