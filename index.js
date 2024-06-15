const express = require('express');
const app = express();


app.get('/', function(req, res){
	res.send("Good Bye App1, See you later!!");
});

app.listen(8080,function(){
	console.log('app is running in port 8080');
})


