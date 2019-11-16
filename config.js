module.exports = class endpointConfig
{
    constructor(config)
    { 
         
    }
    getPackages()
    {
       return []
    }
    getMessage()
	{
		return{
			default001:"user not exist", 
		}
	}
    getVersionedPackages()
    { 
      return []
    }
    getDefaultConfig()
    {
      return 
	  {
		context:"",  
		attach:{  },
		 
      }
    }
}