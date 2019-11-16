Config
	{
		connections:[
			name:'',
			type:'',	//values : [express,socket]
			authz:{domain:''},//authorization microservice
			sessionManager:"",//session manager context
			protocol:
			{
				type:'', //values :[http,https]
				port:,
				// if https
				key:"",//path of file
				crt:"",//path of file
				//if socket
				socketProtocol:'', //values :[echo-protocol,]
			}
			
			//if express
			public:[],	//list of public pathes
			CrossDomain:'', //list of cros origin domain if "*" then all of domains valid
			bodyLimit:,//double , mb
			urlLimit:,//double , mb
			decodeUrl:{	//optional
				algorithm:"",
				passwpord:""
			}
			
			//if socket
		]
	}