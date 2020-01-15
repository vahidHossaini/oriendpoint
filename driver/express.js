
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path'); 
var fs=require('fs')
var formidable= require('formidable') ;
module.exports = class oriExpress
{
	constructor(config,dist)
	{
        var self=this
        self.config=config
        var app = express();
        app.set('trust proxy', 1);
		this.setPublic(app,config);
		this.setCrossDomain(app,config);
		this.setSessionManager(app,config);
		this.setUrlParser(app,config);
		this.runServer(app,config);
		
        app.use(async(req, res, next)=> {
            var data = this.reqToDomain(config,req,self,res) 
            if(!data)
                return
			var session =req.session;
			
            if(config.authz)
            { 
				let isAuthz = false;
				try{
					isAuthz =await self.checkAuthz(session,data,dist,config.authz)
					
				}catch(exp)
				{
					console.log('----',exp)
				}
                if(!isAuthz) 
                    return self.sendData(self,res,200,{m:'endpoint002'}) 
            }
			var upload=await this.checkUpload(req,data,self)
			if(!upload)
				return self.sendData(self,res,200,{m:'endpoint004'})
			try{
                var dd=await dist.run(data.domain,data.service,data.body)
				var token= await this.setSession(req,dd,self);

                if(dd && dd.redirect) 
                    return res.redirect(dd.redirect) 
				
                if(dd && dd.directText)
                    return self.sendData(self,res,200,dd.directText)
                
                if(dd && dd.directFileDownload)
                {
                    fs.readFile(dd.directFileDownload,function(err, data1){ 
                        if(dd.type)
                        {
                            res.set( 'Content-Type', dd.type  );
                        }
                        return  self.sendData(self,res,200,data1)
                    })
                    return
                }
                if(dd && dd.streamFileDownload)
                {
                    this.getStream(dd.streamFileDownload,dd.type,res,req)
                    return
                } 
				var resp={isDone:true,data:dd}
				if(token)
					resp.token=token;
              return self.sendData(self,res,200,resp)
			}
			catch(exp)
			{
				console.log(exp)
                return self.sendData(self,res,200,{m:"internal server error"})
			}
		});
	}
	async setSession(req,data,self)
	{
		if(!global.sessionManager)
			return
		var token = req.header('authorization') 
		var dtx=req.session
		
		if(data.session)
		{
            if(!dtx)
                dtx={}  
            for(var ses of data.session)
            {
                if(ses.value==null)
                    delete dtx[ses.name]
                else {
                    dtx[ses.name]=ses.value
                }
            }
            delete data.session
			var key= await global.sessionManager.set(self.config.sessionManager,token,dtx) 
			return key;
		}
		return "";
	}
	async checkUpload(req,data,self)
	{
		if(global.upload && global.upload[data.domain] && global.upload[data.domain][data.service])
		{
			var up = global.upload[data.domain][data.service];
			try{ 
				data.body.$uploadedFile = await self.getUploadFile(req,up)
				console.log('---------------------------------',data.body.$uploadedFile)
			}
			catch(exp){ 
				console.log(exp)
				return false;
			}
		}
		return true;
	}
	async getUploadFile(req,data)
	{
        return new Promise(async(res,rej)=>{    
			var form = new formidable.IncomingForm();
			//console.log('3-----',form)
			if(data.max)
				form.maxFileSize =data.max
			form.parse(req, function (err, fields, files) {
			//console.log('3-----',files.path)
			//console.log('3-----',files)
			//form.maxFieldsSize
				
				if(err )
					return  rej(err)
				if(files.media &&  files.media.path)
				{
					return res(
					{
						path:files.media.path,
						type:files.media.type,
						name:files.media.name,
						size:files.media.size
					})
				}
				if( !files.filetoupload)
					return rej({})
				res(
				{
					path:files.filetoupload.path,
					type:files.filetoupload.type,
					name:files.filetoupload.name,
					size:files.filetoupload.size
				}
				)
			});
		})
	}
    sendData(self,res,status,data)
    {
        var config=self.config
        if( config.decodeUrl)
        {
            var mykey = crypto.createCipher(config.decodeUrl.algorithm, config.decodeUrl.passwpord);
            var mystr = mykey.update(JSON.stringify(data), 'utf8', 'hex')
            mystr += mykey.final('hex');
            return res.status(status).send(mystr)
        }
        else
        {
            return res.status(status).send(data)
            
        }
    }
	async checkAuthz(session,dt,dist,authz)
    { 
        return new Promise( async(res,rej)=>{            
            if(session && session.superadmin)
                return res(true)
            
            dist.run(authz.domain,'checkRole',{data:{domain:dt.domain,service:dt.service},session:session},(ee,dd)=>{
                if(ee)
                    return res(false)
                return res(dd)
            })
        })
    }
	reqToDomain(config,req,self,res)
    {
        var url_parts = url.parse(req.url, true); 
        var seperate = url_parts.pathname.split('/')
        if(!seperate || seperate.length!=3)
        {
            self.sendData(self,res,200,{m:'endpoint001'})
            return
        }  
        var rt={
            domain:seperate[1],
            service:seperate[2]
        }
        var session = req.session;
        var body={
            session:session,
        }
        if(req.method=='GET')
        {
            body.data = {};
			for(var a in url_parts.query)
				body.data[a]=url_parts.query[a]
			
            if(req.body)
                for(var a in req.body){
                    body.data[a]=req.body[a] 
            }
        }
        else
        { 
            body.data=req.body 
            var bx = url_parts.query; 
            for(var a in bx)
            {
                body.data[a]=bx[a]
            } 
        }
        rt.body=body
        return rt
    }
	runServer(app,config)
    {
		var pr=config.protocol
        if(pr.type=="http")
        {
            var http = require('http');
            var server = http.createServer(app);
            server.listen(pr.port);
            console.log(global.consoleColor.green,'http run at port '+ pr.port)
            this.server=server
        }
        if(pr.type=="https")
        {
            var http = require('https');
            var privateKey  = fs.readFileSync(pr.key, 'utf8');
            var certificate = fs.readFileSync(pr.crt, 'utf8');
            var credentials = {key: privateKey, cert: certificate};
            var server = http.createServer(credentials,app);
            server.listen(pr.port);
            console.log(global.consoleColor.green,'http run at port '+ pr.port)
            this.server=server
        }
    }
	setUrlParser(app,config)
    {
        if(config.decodeUrl)
        {
            crypto= require('crypto');
            app.use(function (req, res, next){
                var url_parts = url.parse(req.url, true); 
                var path=url_parts.pathname.substr(1)
                try{
                    var mykey = crypto.createCipher(config.decodeUrl.algorithm, config.decodeUrl.passwpord);
                    let mystr = mykey.update(path, 'hex','utf8' )
                    mystr += mykey.final('utf8');
                    let obj=JSON.parse(mystr)
                    req.url='/'+obj.d+'/'+obj.s
                    req.body=obj
                    next()
                }catch(exp){
                    return res.status(200).send(Getrand(30))
                }
            })
            
        }
        else{
            if(config.bodyLimit)
                app.use(bodyParser.json({limit: config.bodyLimit*1026*1024}));
            else    
                app.use(bodyParser.json());
                
            if(config.urlLimit)
                app.use(bodyParser.urlencoded({limit: config.urlLimit*1026*1024,extended: true}));
            else 
                app.use(bodyParser.urlencoded({extended: true}));
            
        }
    }
	setPublic(app,config)
    {
        var pb=config['public']
        if(!Array.isArray(pb))
        {
            pb=[pb]
        }
        for(var a of pb)
        {
            if(typeof(a)=="string")
            {
                app.use(express.static(path.join(global.path,a)));
            }
        }
    }
	setSessionManager(app,config)
	{ 
		if(!global.sessionManager)
			return; 
		app.use(function (req, res, next){
            var token = req.header('authorization')
			global.sessionManager.get(config.sessionManager,token).then((data)=>{ 
				req.session=data;
				next();
			}).catch(()=>{
				next()
			});
		})
	}
    setCrossDomain(app,config)
    { 
        if(config.CrossDomain)
            app.use(function (req, res, next) {
            if ('OPTIONS' == req.method) {
                if(config.CrossDomain=='*')
                    res.header('Access-Control-Allow-Origin', req.headers.origin);
                else
                    res.header('Access-Control-Allow-Origin', config.CrossDomain);
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
                res.setHeader('Access-Control-Allow-Credentials', true);
                res.status(200).send('OK');
            }
            else
            {
                if(config.CrossDomain=='*')
                    res.header('Access-Control-Allow-Origin', req.headers.origin);
                else
                    res.header('Access-Control-Allow-Origin', config.CrossDomain);
                    res.setHeader('Access-Control-Allow-Credentials', true);
                next()
            }
            });
    }
}