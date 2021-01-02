const ddns = require('../..');

ddns.DOHClient.UpdateDyndns2("localhost","username","password","testing.com").then(()=>{
    console.log("Update successfull")
}).catch((error)=>{
    console.log(error);
});