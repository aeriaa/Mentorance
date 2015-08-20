(function (io, SimplePeer){
	var socket = io();

	socket.emit('initialize', {});

	socket.on('webrtc_init', function (data){
		console.log(data.initiator ? 'Initiator' : 'Second Peer');

		navigator.webkitGetUserMedia({video: true, audio: true},
			function (stream){
				if (data.initiator) {
					var peer = new SimplePeer({
						initiator: data.initiator,
						trickle: false,
						stream: stream
					});
				} else {
					var peer = new SimplePeer({
						initiator: data.initiator,
						trickle: false,
						stream: stream
					});
					peer.signal(data.signal);
				}

				//Do what Alex told you, send the id 'on('signal')' through 
				//socket.on and get it back through socket.emit

				peer.on('signal', function (data){
					if (peer.initiator) {
						socket.emit('getting_id_1', data);
					} else {
						socket.emit('getting_id_2', data);
					}
					console.log(
						peer.initiator ? 'Getting id 1' : 'Getting id 2');
				});


				socket.on('peer_ready', function (data){
					if (peer.initiator){
						peer.signal(data.signal));
						console.log('Establishing signal connection');
					} else {
						peer.signal(JSON.parse(data.signal));
						console.log('Peer signal established');
					}
				});

				// peer.on('connect', function (data){
				// });

				// peer2.on('data', function (data){
				// 	console.log('got a message from peer1: ' + data)
				// });

				peer.on('stream', function (stream){
					console.log('Stream Ready!');
					var video = document.querySelector('video');
					video.src = window.URL.createObjectURL(stream);
					video.play();
				});

				peer.on('error', function (err){
					console.log('EEEEERROR!!');
					console.log(err);
				});

			}, function (err){console.error(err)}
			);
});
})(io, SimplePeer);