var express = require('express');
var routes  = require('./routes');

var app     = express();
var server  = require('http').createServer(app);
var io      = require('socket.io')(server);
var port    = process.env.PORT || 3000;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(routes);

// Singleton variables
var connections = [];
var webRtcIds   = [];

io.on('connection', function (socket){

	socket.on('initialize', function (){
		connections.push(socket);
		console.log('%s connected', connections.length);

		if (webRtcIds.length === 0){
			socket.emit('webrtc_init', {
				initiator: true
			});
		} else if (webRtcIds.length === 1){
			socket.emit('webrtc_init', {
				initiator: false,
				signal: webRtcIds[0]
			});
		};
		
		socket.on('getting_id_1', function (data){
			webRtcIds.push(data);
			console.log('%s webRtcId created', webRtcIds.length);
			socket.emit('setting_id_1', {signal: webRtcIds[1]});
		});

		socket.on('getting_id_2', function (data){
			webRtcIds.push(data);
			console.log('%s webRtcId created', webRtcIds.length);
			socket.emit('setting_id_2', {signal: webRtcIds[0]});
		});

		socket.on('disconnect', function () {});

	});
});

server.listen(port);
console.log('Listening to port %s', port);