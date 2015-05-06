var Promise = require('promise');
var ConfigServer = require('../config/server.js');
var socketio = require('socket.io');
var ChatServer = require('./websocket/ChatServer');
var GameServer = require('./websocket/GameServer');
var Generator = require('../tools/Generator');

var userList = [];
var socketIdToUsername = {};
var WebsocketServer = new Object();
var websocketConnection = null;


WebsocketServer.init = function(httpServer) {
	websocketConnection = socketio(httpServer);
	ChatServer.init(sendMessage);
	GameServer.init(sendMessage);

	//message routes
	websocketConnection.on('connection', function (socket) {

		var username = Generator.generateName();
		console.log(['Client ', socket.handshake.address.yellow, ' ('+username.grey+' - '+socket.id.toString().grey, ')', ' connected'.green].join(''));
		socketIdToUsername[socket.id] = username;

		GameServer.onConnection(socket,username);
		ChatServer.onConnection(socket,username);

		socket.on('chat.message',	onChatMessage.bind(socket));
		socket.on('disconnect',	onDisconnection.bind(socket));
	});
}

var sendMessage = function(channel, key, mess) {
	websocketConnection.to(channel).emit(key,mess);
}

var onDisconnection = function() {
	var username = socketIdToUsername[this.id.toString()];
	console.log('Client '+this.handshake.address.yellow+' ('+this.id.toString().grey+')'+' disconnect'.red);
	delete socketIdToUsername[this.id.toString()];

	GameServer.onDisconnection.call(this,username);
	ChatServer.onDisconnection.call(this,username);
}

var onChatMessage = function(message) {
	var username = socketIdToUsername[this.id.toString()];
	ChatServer.onMessage.call(this,username,message);
}

module.exports = WebsocketServer;