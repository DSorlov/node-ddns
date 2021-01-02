
const ddns = require('../..');
const server = "dns.google";

ddns.DOHClient.Query(server,[{type: 'A', name: 'google.com', class:'IN'}]).then((result)=>{
    console.log(result);
})