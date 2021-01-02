const dnsPacket = require('dns-packet');

class ServerUtilities {
    constructor() {
    };

    static createSuccessResponseFromRequest(request,answers,flags=dnsPacket.AUTHORITATIVE_ANSWER) {
      const response = {};
      response.id = request.id;
      response.type = 'response';
      response.flags = (response.flags || 0) | flags;
      response.answers =  answers;
      return response;
    };
      
    static createNotFoundResponseFromRequest(request) {
      const response = {};
      response.id = request.id;
      response.type = 'response';
      response.flags = 387;
      response.rcode = 3;
      return response;
    };

    static getDomainComponents(domain) {
      if (domain.endsWith(".")) domain = domain.substr(0,domain.length-1);
      var domainComponents = domain.split(".").reverse();
  
      var zones = [];
      var zoneDomains = domain.split(".");
      for(var i=0;i<domainComponents.length;i++) {
        var zoneName = zoneDomains.slice(i).join(".");
        var hostName = domain.substring(0,domain.length-(zoneName.length+1));
        if (hostName=='') hostName = "@";
        zones.push({
          zone: zoneName,
          host: hostName
        });
      }
  
     return {
          tld: domainComponents.length>1 ? domainComponents[0] : '',
          domain: domainComponents.length>1 ? domainComponents[1] : '',
          subdomain: domainComponents.length>2 ? domainComponents.slice(2).reverse().join('.') : '',
          sld: domainComponents.length==1 ? domainComponents[0] : '',
          isSLD: domainComponents.length==1 ? true : false,
          zones: zones
      };
    };

    static objectZoneLookup(objectZone,query,redact=true) {
      var questionComponents = ServerUtilities.getDomainComponents(query.name);
      var results = [];
  
      // Loop all possible zone files
      questionComponents.zones.forEach(function(zoneLookup) {
        
        //If the zonefile exists check further
        if (objectZone[zoneLookup.zone]) {
  
              // Search in the zone for a matching record, match the type and create a response if needed
              var zoneSearchResult = objectZone[zoneLookup.zone].filter(record => record.name === zoneLookup.host);
              zoneSearchResult.forEach((searchResult)=>{
                    if (searchResult.host=="@") searchResult.name = zoneLookup.zone;
                    if (query.type=="ANY"||query.type==searchResult.type)
                    {
                      var result = Object.assign({},searchResult, {zone: zoneLookup.zone});
                      if (redact) {
                        result.name = query.name;
                        if (result.username) delete result.username;
                        if (result.password) delete result.password;
                        if (result.zone) delete result.zone;
                      }
                      results.push(result);
                    }
              })
          }
      });
  
      return results;
    };    
  
}

module.exports = ServerUtilities