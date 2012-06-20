/*
 * This can eventually be parceled out to other storage mechanisms
 * Eventually this will be the interface to our uuid tree storage mechanism
 */
var Uuids = function(){
	this.ids = {};
};
Uuids.prototype.add = function( uuid, socket )
{
    this.ids[uuid] = socket;
};
Uuids.prototype.remove = function( uuid )
{
    delete this.ids[uuid];
};
Uuids.prototype.find = function( uuids )
{
    var sockets = [];
    var ids = this.ids;
    uuids.forEach(function(uuid){
    	var temp = ids[uuid];
        if(temp) sockets.push( temp );
    });
    return sockets;
};



/**
 * Module dependencies.
 */

var express = require('express');
var sio = require('socket.io');

/*
 * GLOBAL STORAGE
 */
 
var uuids = new Uuids();

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
	if( req.query.uuid ) uuids.add( req.query.uuid );
  	res.sendfile('/index.html');
  	res.socket.query = req.query;
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

io.sockets.on('connection', function (socket) {
	console.log( 'new connection' );
	socket.on('disconnect', function () {
		console.log( 'disconnected' );
  	});
});
