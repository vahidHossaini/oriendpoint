var fs = require('fs');
var uuid = require('uuid'); 
var WebSocketServer = require('websocket').server;
module.exports = class oriSocket
{
    constructor(config,dist)
	{
		this.config=config;
		this.sm=config.sessionManager;
		var pr = config.protocol;
        var mode=require(pr.type);
        var server = mode.createServer((request, response)=> {
            response.writeHead(404);
            response.end();        
        server.listen(pr.port, ()=> {
            console.log(  'Socket Server is listening on port '+pr.port+' '+pr.type);
        });    
        this.server=server
        var wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false
        });
        wsServer.on('request', (request)=> {
            var connection ={} 
            try{
                connection = request.accept(pr.socketProtocol, request.origin); 
                if(pr.socketProtocol=='echo-protocol')
                {
                    connection.on('message', (message)=> {
                        this.echoProtocolMessage(message,connection,request.key,dist)
                    })
                }               
                connection.on("close",()=>{          
                    this.echoClose(connection,request.key)
                })
                
            }catch(exp){
                console.log('Error>>>',exp)
            }
        })
	}
    async echoProtocolMessage(message,connection,key,dist)
	{
        if (message.type !== 'utf8')
            return this.response({message:'not support'},{},connection,key)
		var data={}
		try{
			data=JSON.parse(message.utf8Data)
		}catch(exp)
		{
			this.response({message:'Json Support'},{},connection,key)  
			return;
		}
		if(!data.domain || !data.service)
			return this.response({message:"wrong service"},{id:data.id},connection)
		var session= await this.getSession(data,self);
		var body={ 
			data:data.param
		}
		if(!body.data)
			body.data={}
		if(session)
		{
			body.session=session
		}
		if(this.config.authz)
		{
			var dt =await dist.run(this.config.authz.domain,'checkRole',{data:{domain:data.domain,service:data.service},session:session.session})
			if(!dt.i)
			return connection.sendUTF(JSON.stringify({m:'glb002'}));
		}
		 
		dist.run(data.domain,data.service,body,(ee,dd)=>{ 
			this.response(ee,dd,connection,key,data.id)
		})
	}
	async getSession(data,self)
	{
		return await global.sessionManager.get(self.sm,data.authorization);
	}
	async setSession(key,values)
    {
        // if(!key)
            // return {}
		
		var d= await  global.sessionManager.get(this.sm,key)
		let obj={}
		if(d)
			obj=d
		for(let a of values)
		{
			if(a.value==null)
				delete obj[a.name]
			else
				obj[a.name]=a.value
		}
		var resp= await global.sessionManager.set(this.sm,key,obj)
		return resp;
        
    }
    async response(err,data,connection,key,id)
    { 
		var resp={};		
        if(data &&  data.session)
        {  
            var t= await  this.setSession(data.authorization,data.session ) 
			if(t)resp.token=t;
        }
        if(data)
            delete data.session 
        var obj={
            error:err,
            data:data,
			session:resp
        }
        if(id)
            obj.id=id
      
	echoClose(connection,key)
	{
	}
}