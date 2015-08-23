(function (io, SimplePeer){
	var socket = io();
	console.log('initializing.');

	socket.emit('initialize', {});
	console.log('initializing..');

	socket.on('webrtc_init', function (data){
		console.log('initializing...');

		// navigator.webkitGetUserMedia({video: true, audio: true},
		// 	function (stream){
		// 		var peer 		= new SimplePeer({
		// 			initiator: 	data.initiator,
		// 			trickle: 		false,
		// 			stream: 		stream
		// 		});
		// 		console.log(peer.initiator ? 'Initiator' : 'Second Peer');

		// 		peer.on('signal', function (data){
		// 			socket.emit('getting_signal', data);
		// 			console.log('getting signal');
		// 		});

		// 		socket.on('setting_signal_2', function (data){
		// 			peer.signal(data);
		// 			console.log('Peer 2 ready');
		// 		});

		// 		socket.on('setting_signal_1', function (data){
		// 			peer.signal(data);
		// 			console.log('Peer 1 ready');
		// 		});

		// 		peer.on('stream', function (stream){
		// 			var video = document.querySelector('video');
		// 			video.src = window.URL.createObjectURL(stream);
		// 			video.play();
		// 			console.log('Video Streaming');
		// 		});

		// 		peer.on('error', function (err){
		// 			console.log('EEEEERROR!!');
		// 			console.log(err);
		// 		});

		// 	}, function (err){console.error(err)}
		// 	);
});
})(io, SimplePeer);