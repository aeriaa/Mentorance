var express = require('express');
var routes  = require('./routes');

var app     = express();
var server 	= require('http').createServer(app);
var io      = require('socket.io')(server);
var port  	= process.env.PORT || 3000;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(routes);

// Singleton variables
var usernames 	= {};
var numUsers		= 0;

io.on('connection', function (socket) {
// Chat Sockets
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

// This will help to get the users connected SimplePeer
  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
    console.log(socket.username + " connected");
  });

  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
      console.log(socket.username + ' disconnected');
    }
  });
// End of Chat Sockets


// Example

// io.on('connection', function(socket){
//     socket.on('set nickname', function (name) {
//         sockets[name] = socket;
//     });
//     socket.on('send message', function (message, to) {
//         sockets[to].emit(message);
//     });
// });

//Video Sockets
  socket.on('set_as_initiator', function (username) {
    socket[username].emit('start_call', {
      initiator: true
    });
    console.log('Setting as initiator');
  });

  socket.on('signal', function (signal) {
    socket.broadcast.emit('start_call', {
      signal: signal
    });
  });

  socket.on('', function (signal){
    socket.broadcast.emit('', {
      username: socket.username,
      signal: socket.signal
    });
  });

  socket.on('getting_signal', function (data){

  });
//End of Video Sockets

});

server.listen(port);
console.log('Listening to port %s', port);