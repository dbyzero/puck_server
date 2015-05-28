var Promise = require('promise');
var DockerManager = require('./game/DockerManager');

var GameServer = new Object();
var containers = [];
var availablePorts = [40000,40001,40002,40003,40004];
var usedPorts = [];
var instanceByPorts = {};
var sendMessage = null;

var configServer = require('../../config');


GameServer.start = function(callbackSendMessage) {
	sendMessage = callbackSendMessage;
	this.updateInstanceList();
	console.log('Game Server '+'started'.green);
}

GameServer.createInstance = function() {
	if(availablePorts.length <= usedPorts.length) {
		console.error('All port used')
	} else {
		var port = null;
		for (var i = 0; i < availablePorts.length; i++) {
			if(usedPorts.indexOf(availablePorts[i]) === -1) {
				port = availablePorts[i];
				break;
			}
		};
		usedPorts.push(port);
		DockerManager.createDocker(port)
			.then(function(){
				return GameServer.updateInstanceList();
			})
			.then(function(){
				console.log('game started');
				sendMessage(null,'game.serverList', containers);
			})
			.catch(function(err){
				console.log('error:'+err);
			});
	}
}

GameServer.startInstance = function(serverName) {
	return DockerManager.startDockerContainer(serverName)
		.then(function(data){
			return GameServer.updateInstanceList();
		})
		.then(function(containers){
			sendMessage(null,'game.serverList', containers);
		})
		.catch(function(err){
			console.log('error:'+err);
		});
}

GameServer.stopInstance = function(serverName) {
	return DockerManager.stopDockerContainer(serverName)
		.then(function(data){
			return GameServer.updateInstanceList();
		})
		.then(function(containers){
			sendMessage(null,'game.serverList', containers);
		})
		.catch(function(err){
			console.log('error:'+err);
		});
}

GameServer.destroyInstance = function(serverName) {
	return DockerManager.destroyDockerContainer(serverName)
		.then(function(data){
			return GameServer.updateInstanceList();
		})
		.then(function(containers){
			sendMessage(null,'game.serverList', containers);
		})
		.catch(function(err){
			console.log('error:'+err);
		});
}

GameServer.updateInstanceList = function() {
	return DockerManager.getActiveDockerContainer()
		.then(function(data){
			containers = {};
			usedPorts = [];
			var keys = Object.keys(data);
			for (var i = 0; i < keys.length; i++) {
				var container = data[keys[i]];
				if(container.image === configServer.dockerImageName) {
					containers[container.id] = container;
					var nameSplitted = container.name.split('_');
					usedPorts.push(parseInt(nameSplitted[nameSplitted.length - 1]));
				}
			};
			return containers;
		})
		.catch(function(err){
			console.log('error:'+err);
		});
}

//callbacks

GameServer.onConnection = function(socket,username) {
	//send channel infos
	socket.emit('game.serverList', containers);
	console.log([username.grey, ' connected to game server list'].join(''));
}

GameServer.onDisconnection = function(username) {
	console.log(username.grey + ' disconnect from Game Server');
}

module.exports = GameServer;