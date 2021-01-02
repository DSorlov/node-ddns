
const ddns = require('../..');
const server = "1.1.1.1";

ddns.UDPClient.rawQuery(server,[{type: 'A', name: 'google.com', class:'IN'}]).then((result)=>{
    console.log(result);
})