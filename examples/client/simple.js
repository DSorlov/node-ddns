const ddns = require('../..');
const dns = new ddns();

dns.ResolveA('www.google.com').then((result)=>{
    console.log(result.answers);
}).catch((error)=>{
    console.log(error);
});