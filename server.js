var express = require('express');
var routes  = require('./routes');

var app     = express();
var server  = require('http').createServer(app);
var io      = require('socket.io')(server);
var port    = process.env.PORT || 3000;

// Singleton variables
var connections = [];
var webRtcIds   = [];

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(routes);

io.on('connection', function (socket){
	var initialized = false;

	socket.on('initialize', function (){
		connections.push(socket);
		initialized = true;
		console.log(socket);

		socket.emit('webrtc_init', {
			initiator: webRtcIds.length === 0
		});

		if (connections.length === 0) {
			socket.emit('initiator_ready', {
				rtcId: webRtcIds[0]
			})
		}
	});

	socket.on('set_webrtc_id', function (data){
		console.log("Register id");
		webRtcIds.push(data.rtcId);
	});

	socket.on('disconnect', function (){
	});
});

server.listen(port);
console.log('Listening to port %s', port);