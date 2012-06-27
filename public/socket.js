// socket.io specific code
//var socket = io.connect('http://127.0.0.1:8000');

var Chat = function( chatServer, ready ){
	if( chatServer )
		this.socket = io.connect( chatServer );
	else
		this.socket = io.connect( chatHost );
	this.socket.on( 'connect', ready );
};
Chat.prototype.create = function( my_id, their_ids, callback )
{
	this.socket.emit( 'start', { 'my_id' : my_id, 'their_ids' : their_ids } );
    this.socket.on( 'new' , function(data){
    	callback(data.chat_id);
    });
};
Chat.prototype.destroy = function( chat_id )
{
	this.socket.emit( 'destroy', { 'chat_id' : chat_id } );
};
Chat.prototype.send = function( chat_id, data )
{
	this.socket.emit( 'data', { 'chat_id' : chat_id, 'data' : data } );
};
Chat.prototype.receive = function( callback )
{
	this.socket.on( 'message', function( data ){
		callback( data.chat_id );
	});
};