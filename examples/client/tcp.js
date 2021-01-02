
const ddns = require('../..');
const server = "8.8.8.8";

ddns.TCPClient.Query(server,[{type: 'A', name: 'google.com', class:'IN'}]).then((result)=>{
    console.log(result);
})