(function (SimplePeer){
	// Initialize variables
  var socket 				 = io();
  var $chatPage  		 = $('.chat.page');
  var $videoPage 		 = $('.video.page');
  var $inputMessage  = $('.inputMessage');
  var $currentInput  = $('.currentInput');
  var $usernameInput = $('.usernameInput');

  // SimplePeer
  socket.on('start_call', function (data) {
		navigator.webkitGetUserMedia({video: true, audio: true},
			function (stream) {
				var peer 		= new SimplePeer({
					initiator: 	data.initiator,
					trickle: 		false,
					stream: 		stream
				});
				console.log(peer.initiator ? 'Initiator' : 'Second Peer');
			}, function (err){console.error(err)}
		);

		peer.on('signal', function (data) {
			socket.emit('getting_signal', data);
			console.log('getting signal', data);
		});

		socket.on('setting_signal', function (signal) {
			peer.signal(signal);
			console.log('setting_signal');
		});

		peer.on('stream', function (stream) {
			var video = document.querySelector('video');
			video.src = window.URL.createObjectURL(stream);
			video.play();
			console.log('Video Streaming');
		});

		peer.on('error', function (err) {
			console.log('ERROR', err);
		});
  });

  //Getting the call action

})(SimplePeer);