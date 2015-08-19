(function(io, SimplePeer) {
	var socket = io();

	socket.emit('initialize', {});

	socket.on('webrtc_init', function(data) {
		console.log("initiator", data);

		navigator.webkitGetUserMedia({ video: true, audio: true }, function (stream) {
			var peer = new SimplePeer({
				initiator: data.initiator,
				trickle: false,
				stream: stream
			});
			
			socket.on('initiator_ready', function(data) {
				peer.signal(data.rtcId);
			});

			peer.on('signal', function(data) {
				socket.emit('set_webrtc_id', {
					rtcId: JSON.stringify(data)
				});
			});

			peer.on('stream', function(stream){
				console.log("VIDEO");
		    var video = document.createElement('video');
		    document.body.appendChild(video);

		    video.src = window.URL.createObjectURL(stream);
		    video.play();
		  });

		  peer.on('error', function(err) {
		  	console.log('EEEEERROR!!');
		  	console.log(err);
		  });
		
		}, function (err) {
		  console.error(err);
		});
	});

})(io, SimplePeer);
