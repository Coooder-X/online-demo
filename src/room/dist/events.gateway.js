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
var EventGateway = /** @class */ (function () {
    function EventGateway() {
    }
    EventGateway.prototype.handleConnect = function (client, data) {
        console.log('new client connected.');
    };
    EventGateway.prototype.handleCreateRoom = function (client, data) {
        console.log('createRoom');
        console.log(client.rooms);
        // client.broadcast.emit('event', {str:'afdsafda'});
        client.join(data.roomName);
        this.server.to(data.roomName).emit('broadcast', { str: 'afdsafda' });
        console.log(client.rooms);
        return data;
    };
    EventGateway.prototype.handleJoinRoom = function (client, data) {
        console.log('joinRoom');
        var roomIds = this.server.adapter.rooms;
        console.log(roomIds.keys());
        // console.log('in room', this.server.in('room'));
        // console.log(this.server._nsps);
        // console.log(nsp, (this.server.adapter as any).rooms.nsp);
        // console.log(roomIds.get(data.roomId));
        // console.log('size', this.server.of('/room').adapter.rooms.size);
        // console.log('server', this.server.server);
        var io = this.server.server;
        console.log('of', io.of('/room').adapter.rooms); //  of下namespace的rooms
        // return this.server;
        console.log('size', roomIds.size);
        // const io = this.server as Server;
        // console.log('nsp', io.of('/'));
        if (roomIds.get(data.roomId) === undefined) { //  if incoming room_id not in exist rooms, return null
            console.log('no has');
            return null;
        }
        else if (roomIds.size >= 4 + 1) { // room 人数超过4, 拒绝加入(+1是计入初始的一个房间, 这里没找到namespace的api，先这样写)
            return { msg: '当前房间人数已满' };
        }
        client.join(data.roomId);
        return { roomId: data.roomId }; //  if exist, return room info
    };
    EventGateway.prototype.handleLeaveRoom = function (client, data) {
        console.log('leaveRoom');
        return data;
    };
    EventGateway.prototype.handleEvent = function (data) {
        console.log('call event');
        return data;
    };
    EventGateway.prototype.func = function (data) {
        console.log('func');
        this.server.on('connection', function (socket) {
            // console.log(socket);
            socket.emit('message');
        });
        return data;
    };
    /**
     * 断开链接
     */
    EventGateway.prototype.handleDisconnect = function (client) {
        // this.allNum -= 1
        // this.ws.emit('leave', { name: this.users[client.id], allNum: this.allNum, connectCounts: this.connectCounts });
    };
    __decorate([
        websockets_1.WebSocketServer()
    ], EventGateway.prototype, "server");
    __decorate([
        websockets_1.SubscribeMessage('connect-server'),
        __param(0, websockets_1.ConnectedSocket()), __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleConnect");
    __decorate([
        websockets_1.SubscribeMessage('createRoom'),
        __param(0, websockets_1.ConnectedSocket()), __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleCreateRoom");
    __decorate([
        websockets_1.SubscribeMessage('joinRoom'),
        __param(0, websockets_1.ConnectedSocket()), __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleJoinRoom");
    __decorate([
        websockets_1.SubscribeMessage('leaveRoom'),
        __param(0, websockets_1.ConnectedSocket()), __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleLeaveRoom");
    __decorate([
        websockets_1.SubscribeMessage('event'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleEvent");
    __decorate([
        websockets_1.SubscribeMessage('func'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "func");
    EventGateway = __decorate([
        websockets_1.WebSocketGateway({ namespace: 'room', cors: true })
    ], EventGateway);
    return EventGateway;
}());
exports.EventGateway = EventGateway;
