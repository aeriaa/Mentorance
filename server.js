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
var usernames   = {};
var numUsers    = 0;
var sockets     = {};

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

  socket.on('call', function(data) {
    sockets[data.target].emit('called', {
      username: socket.username,
      signal: data.signal,
    });
  });

  socket.on('call_responded', function(data) {
    console.log('Emito call start hacia ', data.username);
    sockets[data.username].emit('call_start', {
      signal: data.signal,
      username: socket.username,
    });
  });

  socket.on('add user', function (username) {
  // we store the username in the socket session for this client
    socket.username = username;
  // we store the socket info the socket session for this client
    sockets[username] = socket;
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

//Video Sockets
  socket.on('set_as_initiator', function (username) {
    sockets[username].emit('start_call', {
      initiator: true
    });
    console.log('Setting as initiator');
  });

  socket.on('signal', function (signal) {
    socket.broadcast.emit('start_call', {
      signal: signal
    });
  });

});

server.listen(port);
console.log('Listening to port %s', port);