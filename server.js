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

io.on('connection', function (socket) {

	socket.on('initialize', function () {
		connections.push(socket);
		console.log('Peers connected %s', connections.length);

		if (webRtcIds.length === 0) {
			socket.emit('webrtc_init', {
				initiator: webRtcIds.length === 0
			});
		} else {
			socket.emit('webrtc_init', {
				initiator: webRtcIds.length === 0,
				signal: webRtcIds[0]
			});
		};

		
		socket.on('first_id_webrtc', function (data) {
			webRtcIds.push(data.peerId);
			console.log('webRtcIds %s', webRtcIds.length);
		});

		socket.on('second_id_webrtc', function (data) {
			webRtcIds.push(data.peerId);
			console.log('webRtcIds %s', webRtcIds.length);
			socket.emit('peers_ready', [
				{ peerId: webRtcIds[1] },
				{ peerId: webRtcIds[0] }
				]);
		});

		socket.on('disconnect', function () {});

	});
});

server.listen(port);
console.log('Listening to port %s', port);