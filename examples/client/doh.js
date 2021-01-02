
const ddns = require('../..');
const server = "dns.google";

ddns.DOHClient.rawQuery(server,[{type: 'A', name: 'google.com', class:'IN'}]).then((result)=>{
    console.log(result);
})