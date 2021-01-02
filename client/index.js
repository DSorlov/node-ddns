const UDPClient = require('./udp');
const TCPClient = require('./tcp');
const TLSClient = require('./tls');
const DOHClient = require('./doh');

module.exports = {
  UDPClient,
  TCPClient,
  TLSClient,
  DOHClient
};