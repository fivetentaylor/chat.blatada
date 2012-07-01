// socket.io specific code
//var socket = io.connect('http://127.0.0.1:8000');

var Chat = function( ready ){
	this.socket = io.connect( chatHost );
	this.socket.on( 'connect', ready );
};
Chat.prototype.create = function( my_id, their_ids, callback )
{
	this.socket.emit( 'start', { 'my_id' : my_id, 'their_ids' : their_ids } );
    this.socket.on( 'new' , function(data){
    	callback({'id' : data.chat_id});
    });
};
var 

var Chat_Handle = function( chat_id ){
	this.chat_id = chat_id;
};
Chat_Handle.prototype.destroy = function()
{
	this.socket.emit( 'destroy', { 'chat_id' : this.chat_id } );
};
Chat_Handle.prototype.message = function( data )
{
	this.socket.emit( 'data', { 'chat_id' : this.chat_id, 'data' : data } );
};
Chat_Handle.prototype.receive = function( callback )
{
	this.socket.on( 'message', function( data ){
		callback(data);
	});
};