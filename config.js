module.exports = class endpointConfig
{
    constructor(config)
    { 
         this.config=config
    }
    getPackages()
    {
		var pgs={};
		pgs["uuid"]={name:"uuid",version:"3.3.3"};
		for(var a of this.config.connections)
		{
			if(a.type=="socket")
			{
				pgs["websocket"]={name:"websocket",version:"1.0.30"};
			}
			if(a.type=="express")
			{
				pgs["express"]={name:"express",version:"4.17.1"};
				pgs["body-parser"]={name:"body-parser",version:"1.19.0"};
				pgs["formidable"]={name:"formidable",version:"1.2.1"};
				pgs["url"]={name:"url",version:"0.11.0"};
			}
		}
		var allPackages=[];
		for(var a in pgs)
		{
			allPackages.push(pgs[a]);
		}
        return allPackages;
    }
    getMessage()
	{
		return{
			endpoint001:"structure is wrong", 
		}
	}
    getVersionedPackages()
    { 
      return []
    }
    getDefaultConfig()
    {
      return   {
		connections: [
		{
			name: 'PublicSite',
			'type': 'express',
			sessionManager: 'sessionRedis',
			protocol: {
				type: 'http',
				port: 9101
			},
			public: ['./public']
		}]
      }
    }
}