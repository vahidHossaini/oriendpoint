module.exports={
	UserInterface:{
        struct:{
			userid:{type:"string"},
			name:{type:"string",nullable:true,array:true},
			tag:{type:"number",array:true},
			isClose:{type:"boolean"},
		}
	}, 
	
}