"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
exports.EventGateway = void 0;
var websockets_1 = require("@nestjs/websockets");
var constant_1 = require("src/constant");
var EventGateway = /** @class */ (function () {
    function EventGateway() {
        this.limitClientNum = 4;
        this.globalGameRoom = new Map();
        this.updateRoom = function (newRoom, clientId, playerName) {
            var newPlayer = {
                id: playerName,
                socketId: clientId
            };
            newRoom.playerMap.set(clientId, newPlayer);
        };
    }
    EventGateway.prototype.handleConnect = function (client, data) {
        console.log('new client connected.');
    };
    EventGateway.prototype.handleCreateRoom = function (client, data) {
        console.log('createRoom');
        console.log(client.rooms);
        // client.broadcast.emit('event', {str:'afdsafda'});
        if (this.server.of('/').adapter.rooms.has(data.roomName)) {
            return constant_1.CREATE_ROOM_EXIST;
        }
        client.join(data.roomName); //  创建时自动加入房间
        var newRoom = {
            name: data.roomName,
            started: false,
            message: new Map(),
            playerMap: new Map()
        };
        this.updateRoom(newRoom, client.id, client.id);
        this.globalGameRoom.set(data.roomName, newRoom);
        console.log(client.rooms);
        console.log(this.globalGameRoom);
        return {
            success: true,
            room: newRoom,
            msg: '创建成功!'
        };
    };
    EventGateway.prototype.handleJoinRoom = function (client, roomName) {
        console.log('joinRoom');
        var roomsMap = this.server.of('/').adapter.rooms;
        console.log('of room', roomsMap);
        console.log('set room', roomName, roomsMap.get(roomName));
        if (roomsMap.get(roomName) === undefined) {
            //  if incoming room_id not in exist rooms, return null
            console.log('no has');
            return constant_1.JOIN_ROOM_EXIST;
        }
        else if (roomsMap.get(roomName).size >= this.limitClientNum + 1) {
            // room 人数超过4, 拒绝加入(+1是计入初始的一个房间, 这里没找到namespace的api，先这样写)
            console.log('size', roomsMap.get(roomName).size);
            return constant_1.ROOM_FULL;
        }
        else if (this.globalGameRoom.get(roomName).started) {
            return constant_1.ROOM_PLAYING;
        }
        else if (this.server.of('/').adapter.rooms.get(roomName).has(client.id)) {
            return constant_1.REPEAT_JOIN;
        }
        client.join(roomName);
        this.updateRoom(this.globalGameRoom.get(roomName), client.id, client.id);
        this.server
            .to(roomName)
            .except(client.id)
            .emit('broadcast', { msg: client.id + "\u5DF2\u8FDB\u5165\u623F\u95F4" }); //  给当前房间除了自己的人广播消息
        return {
            msg: "\u5DF2\u52A0\u5165\u623F\u95F4\uFF1A" + roomName,
            success: true,
            room: this.globalGameRoom.get(roomName)
        }; //  if exist, return room info
    };
    EventGateway.prototype.handleLeaveRoom = function (client, data) {
        console.log('leaveRoom');
        return data;
    };
    EventGateway.prototype.handleEvent = function (data) {
        console.log('call event');
        return data;
    };
    EventGateway.prototype.handleStart = function (client, data) {
        console.log('handleStart');
        // this.globalGameRoom.get(data.roomName)
        if (this.server.of('/').adapter.rooms.get(data.roomName).size < 2) {
            return constant_1.PLAYER_TOO_LESS;
        }
        return constant_1.GAME_START;
    };
    /**
     * 断开链接
     */
    EventGateway.prototype.handleDisconnect = function (client) {
        console.log('disconnect');
        // this.allNum -= 1
        // this.ws.emit('leave', { name: this.users[client.id], allNum: this.allNum, connectCounts: this.connectCounts });
    };
    __decorate([
        websockets_1.WebSocketServer()
    ], EventGateway.prototype, "server");
    __decorate([
        websockets_1.SubscribeMessage('connect-server'),
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleConnect");
    __decorate([
        websockets_1.SubscribeMessage('createRoom'),
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleCreateRoom");
    __decorate([
        websockets_1.SubscribeMessage('joinRoom'),
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleJoinRoom");
    __decorate([
        websockets_1.SubscribeMessage('leaveRoom'),
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleLeaveRoom");
    __decorate([
        websockets_1.SubscribeMessage('event'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleEvent");
    __decorate([
        websockets_1.SubscribeMessage('handleStart'),
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleStart");
    EventGateway = __decorate([
        websockets_1.WebSocketGateway({ cors: true })
    ], EventGateway);
    return EventGateway;
}());
exports.EventGateway = EventGateway;
