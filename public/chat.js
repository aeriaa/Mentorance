$(function() {

  var FADE_TIME           = 600;
  var TYPING_TIMER_LENGTH = 400;
  var COLORS              = [
    '#9b59b6', '#3498db', '#2ecc71', '#1abc9c',
    '#f1c40f', '#2980b9', '#27ae60', '#16a085',
    '#c0392b', '#f39c12', '#e74c3c', '#82E0FF'
  ];

  // Read simplepeer.js
  var SimplePeer    = window.SimplePeer;
  var peerConnected = false;
  var peer;

  // Initialize variables
  var socket         = io();
  var $title         = $('.title');
  var $brand         = $('.brand');
  var $usernameInput = $('.usernameInput');
  var $messages      = $('.messages');
  var $inputMessage  = $('.inputMessage');
  var $loginPage     = $('.login.page');
  var $chatPage      = $('.chat.page');
  var $helpPage      = $('.help.page');
  var $videoPage     = $('.video.page');
  var $blackPage     = $('.black.page');
  var $errorInput    = $('.title#error');

  // Prompt for setting a user name
  var username;
  var connected      = false;
  var typing         = false;
  var $currentInput  = $usernameInput.focus();
  var lastTypingTime;

  function pumpingFade (target) {
    target.fadeOut(3000, function(){
      target.fadeIn(2700, pumpingFade(target));
    });
  } 
  //On initialization
  function displayLogin () {
    $brand.fadeIn(1800, pumpingFade($brand));
    $title.fadeIn(2700);
    $usernameInput.hide().fadeIn(3600);
    $errorInput.hide();
  };

  displayLogin();

  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    // If the user name is valid
    if (username) {
      $loginPage.fadeOut(600);
      $chatPage.fadeIn(3000);
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      // $ added after the name has been written to prevent empty names.
      username      = "$" + username;
      // Tell the server your user name
      socket.emit('add user', username);
      // If the user name is empty
    } else {
      $errorInput.fadeIn(300, function (){
        $errorInput.fadeOut(1200);
      });
    }
  }

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "<strong>1</strong> user connected";
    } else {
      message += "<strong>" + data.numUsers + "</strong> users connected";
    }
    log(message);
  }

  function sendMessage() {
    // Prevent markup from being injected into the message
    var message = cleanInput($inputMessage.val());
    var action  = getActionFromMessage(message);
    var target  = getTargetFromMessage(message);
    var actionF = actions[action] || actions.message;
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      actionF(username, message, target);
    }
  }

  var actions = {
    message: function(username, message) {
      socket.emit('new message', message);
      addChatMessage({
        message: message,
        username: username,
      });
    },

    call: function(username, message, target) {
      if (username !== target) {
        navigator.webkitGetUserMedia({ video: true, audio: true }, 
          function(stream) {
            peer = new SimplePeer({
              initiator: true,
              trickle:   false,
              stream:    stream,
            });

            peer.on('signal', function (data) {
              console.log('You are calling %s...', target);
              socket.emit('call', {
                signal: data,
                target: target,
              });
            });
            peer.on('stream', onPeerStream);
            peer.on('error', onPeerError);
          }, 
          function (err) {
            console.error(err);
          }
        );
      } else {
        addChatMessage({
          message: "No need to call yourself",
          username: "Mentorance",
        });
      }
    },

    quit: function(username) {
      $blackPage.fadeIn(900, function(){
        $usernameInput.hide();
        location.reload();
      });
    },

    video: function() {
      if (peerConnected) {
        displayVideo();
      } else {
        addChatMessage({
          message: "No video connections. Use '.call' on the user's '$username' to call them",
          username: "Mentorance",
        });
      }
    },

    end: function() {
      if (peerConnected) {
        videoOff();
        addChatMessage({
          message: "Ending call...",
          username: "Mentorance",
        });
      } else {
        addChatMessage({
          message: "You don't have a '$call' to '.end'. Use '.call' on the user's '$username' to call them",
          username: "Mentorance",
        });
      }
    },

  };

  function onPeerError(error) {
    console.error('Peer error', error);
  }

  // TODO Use regex to do this
  function getActionFromMessage(message) {
    try {
      if (message.split('$')[1] === 'quit') {
        return 'quit';
      }
      if (message.split('$')[1] === 'video') {
        return 'video';
      }
      if (message.split('$')[1] === 'call.end') {
        return 'end';
      }
      return message.split('.')[1].split('(')[0];
    }
    catch (err) {
      return err;
    }
  }

  function getTargetFromMessage(message) {
    return message.split('.')[0] || false;
  }

  // TODO - Check if user exists and is connected.

  // Log a message
  function log(message, options) {
    var $el = $('<li>').addClass('log').html(message);
    addMessageElement($el, options);
  }

  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv    = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing...';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing...' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

// Keyboard events
  $(window).keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    } else if (event.keyCode === 27 && !peerConnected){
      displayChat();
      addChatMessage({
        message: "To exit Mentorance, call '$quit'",
        username: "Mentorance",
      });
    }
  });

  //On typing...
  $inputMessage.on('input', function() {
    updateTyping();
  });

// Click events
  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

// Socket events
  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "<span class='lead'>Mentorance" ;
    log(message, { prepend: true });
    addParticipantsMessage(data);
    addChatMessage({
      message: ("Welcome " + data.username),
      username: "Mentorance",
    });
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log("<strong>" + data.username + '</strong> has joined.');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log("<strong>" + data.username + '</strong> has left.');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });


//Video events
  function onPeerStream(stream) {
    $chatPage.fadeOut(600);
    $videoPage.fadeIn(3000);

    peerConnected   = true;
    window.stream   = stream;
    var video       = document.querySelector('video');
    video.src       = window.URL.createObjectURL(stream);
    video.play();

    $(window).keyup(function (event) {
    //Audio connection will still be ON, going to chat
    // Pressing 'ESC' exist the video window
      if (event.keyCode === 27 && peerConnected){
        displayChat();
        addChatMessage({
          message: "Call '$video' to go back || '$call.end' to end call",
          username: "Mentorance",
        });
      }
    });
  }

// Disconnecting CALL
  function videoOff() {
    displayChat();
    peer.stream.stop();
    peerConnected = false;
  }

  function displayChat() {
    $currentInput = $inputMessage.focus();
    $chatPage.fadeIn(3000);
    $videoPage.fadeOut(600);
    $inputMessage.val('');
  }

  function displayVideo() {
    $videoPage.fadeIn(1800);
    $chatPage.fadeOut(900);
  }

  function displayHelp () {
    $currentInput = $usernameInput.focus();
    $helpPage.fadeIn(3000);
  }

// TODO - Allow private messaging

//Peer been called initiator: false,
  socket.on('calling', function (data) {
    navigator.webkitGetUserMedia({ video: true, audio: true }, 
      function(stream) {
        peer = new SimplePeer({
          initiator: false,
          trickle:   false,
          stream:    stream,
        });
      //This gives the second peer the signal to emit
        peer.signal(data.signal);

        peer.on('signal', function (signal) {
          console.log("%s's call accepted", data.initiator);
          socket.emit('call_accepted', {
            signal:   signal,
            username: data.initiator,
          });
        });

        peer.on('stream', onPeerStream);
        peer.on('error', onPeerError);

      },

    function(err) {
      console.error(err);
    });

  });

  socket.on('call_connected', function (data) {
    console.log('Connection established with', data.username);
    peer.signal(data.signal);
  });

});