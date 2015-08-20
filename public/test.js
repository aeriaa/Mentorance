(function (io, SimplePeer){
	var socket = io();

	socket.emit('initialize', {});

	socket.on('webrtc_init', function (data){
		console.log("initiator", data);

		navigator.webkitGetUserMedia({video: true, audio: true},
			function (stream){
				if (data.initiator) {
					var peer = new SimplePeer({
						initiator: data.initiator,
						trickle: false,
						stream: stream
					});
					console.log("Initiator", peer.initiator);
				} else {
					var peer = new SimplePeer({
						initiator: data.initiator,
						trickle: false,
						stream: stream
					});
					peer.signal(JSON.parse(data.signal));
					console.log("Initiator", peer.signal);
				}

				peer.on('signal', function (data){
					if (peer.initiator) {
						socket.emit('first_id_webrtc', {
							peerId: JSON.stringify(data)
						});
					} else {
						console.log("funciaon");
						socket.emit('second_id_webrtc', {
							peerId: JSON.stringify(data)
						});
					}
				});

				socket.on('peers_ready', function (data){
					if (peer.initiator) {
						peer.signal(data[0].peerId);
					}	else {
						peer.signal(data[1].peerId);
					}				
				});

				peer.on('stream', function (stream){
					console.log("VIDEO");
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