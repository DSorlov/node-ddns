# node-ddns 

![NPM version](https://img.shields.io/npm/v/node-ddns.svg?style=flat)
![stability-stable](https://img.shields.io/badge/stability-stable-green.svg)
![version](https://img.shields.io/badge/version-1.0.1-red.svg)
![maintained](https://img.shields.io/maintenance/yes/2021.svg)
[![maintainer](https://img.shields.io/badge/maintainer-daniel%20sörlöv-blue.svg)](https://github.com/DSorlov)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://img.shields.io/github/license/DSorlov/node-ddns)

> A DNS Client, Server and DDNS Implementation in Pure JavaScript, only dependant on [dns-packet](https://github.com/mafintosh/dns-packet) and [node-ip](https://github.com/indutny/node-ip). Huge thanks to [dns2](https://github.com/song940/node-dns) for inspiration and lots of smart code.

### Features

+ UDPClient, TCPClient, TLSClient, DOHClient
+ UDPServer, TCPServer, TLSServer, DOHServer
+ Support a massive amount of record types and DNSSEC
+ Extremely lightweight and simple to use using uncomplicated structure
+ Many detailed samples to get you started with almost any usecase
+ Supports Dyndns2 updating using DOHClient or DOHServer
+ Basic json-zone-file handing built in (it's beyond limited but it atleast exists)

### Installation

```
npm install node-ddns
```

### Example Client

Most simple lookup the A-record for the domain `google.com`.

```js
const ddns = require('node-ddns');
const dns = new ddns();

dns.ResolveA('www.google.com').then((result)=>{
    console.log(result.answers);
}).catch((error)=>{
    console.log(error);
});
```

### Example Server

```js
const ddns = require('../..');
const server = new ddns.UDPServer({port:53});

server.listen().then(()=>{
    console.log(`Listening on ${server.address}:${server.port}`);
})

server.on('request', (request, response, rinfo) => {
    request.questions.forEach(function (question) {
        var answers = [{
            "name":question.name,
            "type":"A",
            "ttl":300,
            "data":"192.168.100.55"}];
        response(ddns.ServerUtilities.createSuccessResponseFromRequest(request,answers));
    });
});
```

Then you can test your DNS server:

```bash
$ dig @127.0.0.1 test.com
```
```bat
c:\> nslookup test.com 127.0.0.1
```

Note that when implementing your own lookups, the contents of the query
will be found in `request.questions[0].name`.

### Examples
```
npm run example-client-simple
npm run example-client-udp
npm run example-client-tcp
npm run example-client-tls
npm run example-client-doh
npm run example-client-dyndns2
npm run example-server-udp
npm run example-server-tcp
npm run example-server-tls
npm run example-server-doh
npm run example-server-ddns
npm run example-server-recursive
```