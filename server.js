/**
 * Module dependencies.
 */

var express = require('express');
var sio = require('socket.io');
var uuidgen = require('node-uuid');
var util = require('util');

/*
 * This can eventually be parceled out to other storage mechanisms
 * Eventually this will be the interface to our uuid tree storage mechanism
 *
 * Class: Storage
 */
var Storage = function(){
	this.ids = {};
};
Storage.prototype.add = function( uuid, data )
{
    this.ids[uuid] = data;
};
Storage.prototype.remove = function( uuid )
{
   	delete this.ids[uuid];
};
Storage.prototype.find = function( uuids )
{
	if( util.isArray(uuids) )
	{
    	var datum = [];
    	var ids = this.ids;
    	uuids.forEach(function( uuid ){
    		var temp = ids[uuid];
        	if(temp) datum.push(temp);
   	 	});
    	return datum;
    }
    else
    	throw new TypeError( 'parameter uuids should be an array of uuid strings' );
};

/*
 * GLOBAL STORAGE
 */
 
var uuids = new Storage();
var chats = new Storage();

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

var io = sio.listen(app);

io.sockets.on('connection', function( socket ){
	console.log( 'new connection' );
	socket.on( 'startChat', function( data ){
		if( data.my_uuid && data.their_uuids ) 
		{
			// Add user uuid to socket for reverse lookup
			socket.uuid = data.my_uuid;
			// Add uuid and socket to global storage for other users to lookup
			uuids.add( data.my_uuid, socket );	
			// Create Chat Session
			var chatId = uuidgen.v1();
			
		}		
		socket.emit( 'chatReady' );
	});
	socket.on( 'message', function( message ){
		
	});
	socket.on( 'disconnect', function () {
		console.log( 'disconnected' );
  	});
});
