
const ddns = require('../..');
const server = "getdnsapi.net";

ddns.TLSClient.rawQuery(server,[{type: 'A', name: 'google.com', class:'IN'}]).then((result)=>{
    console.log(result);
})