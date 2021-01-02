
const ddns = require('../..');
const server = "1.1.1.1";

ddns.UDPClient.Query(server,[{type: 'A', name: 'google.com', class:'IN'}]).then((result)=>{
    console.log(result);
})