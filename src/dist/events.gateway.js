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
    EventGateway.prototype.handleMessage = function (client, data) {
        console.log('rec msg');
        return data;
    };
    EventGateway.prototype.handleEvent = function (data) {
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
        websockets_1.SubscribeMessage('message'),
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleMessage");
    __decorate([
        websockets_1.SubscribeMessage('event'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleEvent");
    EventGateway = __decorate([
        websockets_1.WebSocketGateway({ namespace: 'room', cors: true })
    ], EventGateway);
    return EventGateway;
}());
exports.EventGateway = EventGateway;
