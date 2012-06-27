/**
 * Module dependencies.
 */

//var express = require('express');
var http = require('http');
var fs = require('fs');
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
Storage.prototype.add = function( uuid, value )
{
    this.data[uuid] = value;
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
        	if(that[uuid]) data.push({id:uuid,value:that[uuid]});
   	 	});
    	return data;
    }
    else
    	throw new TypeError( 'parameter uuids should be an array of uuid strings' );
};

/**
 * App.
 */
var app = http.createServer(handler);

function handler (req, res) {
	fs.readFile(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.min.js',
	function( err, data) {
		if (err) {
      		res.writeHead(500);
      		return res.end('Error loading socket');
    	}
		var data1 = data;
  		fs.readFile(__dirname + '/public/socket.js',
  		function (err, data) {
  			var data2 = data;
    		if (err) {
      			res.writeHead(500);
      			return res.end('Error loading socket');
    		}
    		var dataFin = data1 + "\nvar chatHost = "http:\/\/127.0.0.1:8000" + "');\n" + data2;
    		res.writeHead(200, {
  				'Content-Length': dataFin.length,
  				'Content-Type': 'text/javascript' });
    		res.end( dataFin );
  		});
  	});
}

app.listen(8000);

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
var Chat = function( user_ids ){
	// Static pointer to the users
	Chat.users = users;
	this.user_ids = user_ids;
	// This will fetch all the necessary sockets
	this.users = Chat.users.find( user_ids );
	this.id = uuidgen.v1();
};
Chat.prototype.message = function( sender_id, data )
{
	this.users.forEach(function( user ){
		// user.data is a socket in this case, while
		// the parameter 'data' is whatever the client sent
    	if(user.id != sender_id) user.value.emit( 'message', data );
	});
};
Chat.prototype.emit = function( event, sender_id, data )
{
	this.users.forEach(function( user ){
		// user.data is a socket in this case, while
		// the parameter 'data' is whatever the client sent
    	if(user.id != sender_id) user.value.emit( event, data );
	});
};


var io = sio.listen(app);

io.sockets.on('connection', function( socket ){
	console.log( 'new connection' );
	socket.chat_ids = [];
	socket.on( 'start', function( data ){
		if( data.my_id && data.their_ids ) 
		{
			var chat = new Chat( data.their_ids.concat(data.my_id) );
			// Add user and chat uuid to socket for reverse lookup on disconnect
			socket.user_id = data.my_id;
			socket.chat_ids.push( chat.id );
			// Add uuid and socket to global storage for other users to lookup
			users.add( data.my_id, socket );
			chats.add( chat.id, chat );	
			// Create Chat Session
			chat.emit( 'new', { 'user_id' : socket.user_id, 'chat_id' : chat.id } );
		}
	});
	socket.on( 'data', function( data ){
		var chat = chats.find( data.chat_id ).value;
		chat.message( data.my_id, data.message );
	});
	socket.on( 'disconnect', function () {
		console.log( 'disconnected' );
  	});
});
