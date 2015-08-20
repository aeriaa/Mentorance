(function (io, SimplePeer){
	var socket = io();

	socket.emit('initialize', {});

	socket.on('webrtc_init', function (data){
		console.log("Initiator", data.initiator ? 'Yes' : 'No');

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
					peer.signal(JSON.parse(data.signal));
				}

				peer.on('signal', function (data){
					var id = JSON.stringify(data);
					if (peer.initiator) {
						console.log("Peer 1");
						socket.emit('first_id_webrtc', { peerId: id });
					} else {
						console.log("Peer 2");
						socket.emit('second_id_webrtc', { peerId: id });
					}
				});

				socket.on('peers_ready', function (data){
					if (!peer.initiator){
						console.log('Initiator id', data[0].id);
						peer.signal(data[0].id);
					}	else {
						console.log('Peer id', data[1].id);
						peer.signal(data[1].id);
					}				
				});

				peer.on('stream', function (stream){
					console.log('Stream ready', stream);
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