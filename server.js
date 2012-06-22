/**
 * Module dependencies.
 */

var express = require('express');
var sio = require('socket.io');
var uuidgen = require('node-uuid');
var util = require('util');

/*
 * Class: Storage
 *
 * This can eventually be parceled out to other storage mechanisms
 * Eventually this will be the interface to our uuid tree storage mechanism
 * Or possibly a cool asynchronous c implementation of a tree to boost performance
 * even more.
 */
var Storage = function(){
	this.data = {};
};
Storage.prototype.add = function( uuid, datum )
{
    this.data[uuid] = datum;
};
Storage.prototype.remove = function( uuid )
{
   	delete this.data[uuid];
};
Storage.prototype.find = function( uuids )
{
	if( util.isArray(uuids) )
	{
    	var data = [];
    	var that = this.data;
    	uuids.forEach(function( uuid ){
        	if(that[uuid]) data.push({id:uuid,data:that[uuid]});
   	 	});
    	return data;
    }
    else
    	throw new TypeError( 'parameter uuids should be an array of uuid strings' );
};

/**
 * App.
 */
var app = express.createServer();

/**
 * App configuration.
 */
app.configure(function () {
	app.use(app.router);
  	app.use(express.static(__dirname + '/public'));
});


/**
 * App routes.
 */
app.get('/', function (req, res) {
  	res.sendfile('/index.html');
});


/**
 * App listen.
 */
app.listen(8000, function () {
  var addr = app.address();
  console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

/**
 * Socket.IO server (single process only)
 */
 
/*
 * GLOBAL STORAGE
 */
 
var users = new Storage();
var chats = new Storage();
 
/*
 * Class: Chat
 */
var Chat = function( uuids ){
	// Static pointer to the users
	Chat.users = users;
	// This will fetch all the necessary sockets
	this.users = Chat.users.find( uuids );
	this.id = uuidgen.v1();
};
Chat.prototype.message = function( sender_id, data )
{
	this.users.forEach(function( user ){
		// user.data is a socket in this case, while
		// the parameter data is whatever the client sent
    	if(user.id != sender_id) user.data.send( data );
	});
};



var io = sio.listen(app);

io.sockets.on('connection', function( socket ){
	console.log( 'new connection' );
	socket.chat_ids = [];
	socket.on( 'startChat', function( data ){
		if( data.my_id && data.their_ids ) 
		{
			var chat = new Chat( users
			// Add user and chat uuid to socket for reverse lookup on disconnect
			socket.user_id = data.my_id;
			socket.chat_ids.push
			// Add uuid and socket to global storage for other users to lookup
			users.add( data.my_id, socket );	
			// Create Chat Session
			socket.emit( 'chatReady' );
		}		
	});
	socket.on( 'message', function( data ){
		var chat = chats.find( data.chat_id );
		chat.message( data.my_id, data.message );
	});
	socket.on( 'disconnect', function () {
		console.log( 'disconnected' );
  	});
});
