/* Require dependencies */
var app = require('http').createServer(handler)
, fs = require('fs')
, io = require('socket.io').listen(app);
 
/* creating the server ( localhost:8000 ) */
app.listen(8000);
 
/* on server started we can load our client.html page */
function handler(req, res) {
    fs.readFile(__dirname + '/client.html', function(err, data) {
		if(err) {
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading client.html');
		}
		res.writeHead(200);
		res.end(data);
    });
}
 
/* creating a new websocket to keep the content updated without any AJAX request */
io.sockets.on('connection', function(socket) {
 
    socket.on('set username', function(username) {
    /* Save a variable 'username' */
	socket.set('username', username, function() {
	    console.log('Connect', username);
	    var connected_msg = '<b>' + username + ' is now connected.</b>';
 
	    io.sockets.volatile.emit('broadcast_msg', connected_msg);
	});
    });

    socket.on('emit_msg', function (msg) {
		/* Get the variable 'username' */
		socket.get('username', function (err, username) {
			console.log('Chat message by', username);
			io.sockets.volatile.emit( 'broadcast_msg' , username + ': ' + msg );
		});
    });
 
  /* Handle disconnection of clients */
    socket.on('disconnect', function () {
		socket.get('username', function (err, username) {
			console.log('Disconnect', username);
		  var disconnected_msg = '<b>' + username + ' has disconnected.</b>'
	 
		  // Broadcast to all users the disconnection message
			io.sockets.volatile.emit( 'broadcast_msg' , disconnected_msg);
		});
    });
});
