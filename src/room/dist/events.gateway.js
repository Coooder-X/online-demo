"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
        var _this = this;
        this.limitClientNum = 4;
        this.globalGameRoom = new Map();
        this.broadcast2Others = function (roomName, clientId, msg) {
            _this.server
                .to(roomName)
                .except(clientId)
                .emit('broadcast', { msg: msg }); //  给当前房间除了自己的人广播消息
        };
        this.updateRoom = function (newRoom, player) {
            // const newPlayer: Player = {
            //   name: playerName,
            //   id: playerName, //  找机会改成使用传入的player用户名
            //   socketId: clientId,
            // };
            newRoom.playerMap.set(player.id, player);
        };
        this.updateRoomList = function () {
            var roomList = [];
            for (var _i = 0, _a = _this.globalGameRoom; _i < _a.length; _i++) {
                var room = _a[_i];
                roomList.push(room[1]);
            }
            roomList = roomList.map(function (room) {
                return __assign(__assign({}, room), { playerNum: room.playerMap.size, playerLst: Array.from(room.playerMap.values()), owner: room.owner }); //  验证正确后去掉 playerMap 属性
            });
            return roomList;
        };
    }
    EventGateway.prototype.handleConnect = function (client, data) {
        console.log('new client connected.', client.id);
        return this.updateRoomList(); //  每个客户端接入时，自动获取一次房间列表
    };
    EventGateway.prototype.handleUpdateRoomList = function () {
        console.log('update.');
        this.server.sockets.emit('get-new-room-list', this.updateRoomList()); //  通知所有客户端获取新房间列表
        // this.server.of('/').emit('get-new-room-list', this.updateRoomList()); 
    };
    EventGateway.prototype.handleCreateRoom = function (client, data) {
        console.log('createRoom');
        console.log(client.rooms);
        // client.broadcast.emit('event', {str:'afdsafda'});
        if (this.server.of('/').adapter.rooms.has(data.roomName)) {
            return constant_1.CREATE_ROOM_EXIST;
        }
        client.join(data.roomName); //  创建时自动加入房间
        var newPlayer = data.owner;
        // { //  房主在创建时更新进入 globalGameRoom
        //   name: client.id,
        //   id: client.id, //  找机会改成使用传入的player用户名
        //   socketId: client.id,
        // };
        var newRoom = {
            name: data.roomName,
            owner: newPlayer,
            started: false,
            readyNum: 1,
            message: new Array(),
            playerMap: new Map()
        };
        newRoom.playerMap.set(newPlayer.id, newPlayer);
        this.globalGameRoom.set(data.roomName, newRoom);
        console.log(client.rooms);
        console.log(this.globalGameRoom);
        return {
            success: true,
            room: newRoom,
            msg: '创建成功!'
        };
    };
    EventGateway.prototype.handleJoinRoom = function (client, joinRoomReq) {
        var roomName = joinRoomReq.roomName, player = joinRoomReq.player;
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
        else if (this.server.of('/').adapter.rooms.get(roomName).has(player.id)) {
            return constant_1.REPEAT_JOIN;
        }
        client.join(roomName);
        this.updateRoom(this.globalGameRoom.get(roomName), player);
        this.broadcast2Others(roomName, client.id, player.name + "\u5DF2\u8FDB\u5165\u623F\u95F4"); //  给当前房间除了自己的人广播消息
        return {
            msg: "\u5DF2\u52A0\u5165\u623F\u95F4\uFF1A" + roomName,
            success: true,
            room: this.globalGameRoom.get(roomName)
        }; //  if exist, return room info
    };
    EventGateway.prototype.handleLeaveRoom = function (client, leaveRoomReq) {
        console.log('leaveRoom');
        var rooms = this.globalGameRoom;
        var player = leaveRoomReq.player, room = leaveRoomReq.room;
        var curRoom = rooms.get(room.name);
        // console.log('curRoom1', this.server.of('/').adapter.rooms.get(room.name));
        if (curRoom.owner.id === player.id) { //  是房主
            console.log('是房主');
            //  TODO: 随机安排一个玩家为房主 or 房间解散？
            if (room.playerMap.size > 1) {
            }
            else {
                this.globalGameRoom["delete"](curRoom.name);
                this.server.of('/').adapter.rooms["delete"](curRoom.name); //  从实际 socket 中删除
            }
        }
        else if (curRoom.playerMap.has(player.id)) { //  若是普通玩家离开，注意处理给其它玩家的通知（TODO）
            console.log('是普通玩家');
            curRoom.playerMap["delete"](player.id);
            client.leave(curRoom.name);
            this.broadcast2Others(curRoom.name, client.id, player.name + "\u5DF2\u79BB\u5F00\u623F\u95F4"); //  给当前房间除了自己的人广播消息
        }
        // console.log('curRoom2', this.server.of('/').adapter.rooms.get(room.name));
        this.handleUpdateRoomList();
        return true;
    };
    /*  由于 socket.io 只能传递 ‘serializable datastructures’, 传递 Map 对象会导致前端收到空对象
        因此在给前端传递带有 Map 对象的数据结构，如 GameRoom 时，要做一个序列化转换。（转成 Array）
    */
    EventGateway.prototype.getRoomObj = function (roomName) {
        console.log('call event');
        var serializRoom = __assign(__assign({}, this.globalGameRoom.get(roomName)), { playerLst: Array.from(this.globalGameRoom.get(roomName).playerMap.values()) });
        console.log('get-room-obj:', serializRoom);
        return serializRoom;
    };
    //  接受（房主）的第一次请求，广播出牌轮次
    EventGateway.prototype.firstBroadcastTrunsInfo = function (roomName) {
        var room = this.globalGameRoom.get(roomName);
        var index = Math.floor(Math.random() * room.playerMap.size);
        this.server
            .to(roomName)
            .emit('get-turns-info', { curIndex: index }); //  给当前房间除了自己的人广播消息
    };
    //  每轮出牌结束，广播出牌轮次
    EventGateway.prototype.broadcastTrunsInfo = function (data) {
        var index = (data.idx + 1) % data.roomSize;
        this.server
            .to(data.roomName)
            .emit('get-turns-info', { curIndex: index }); //  给当前房间除了自己的人广播消息
    };
    EventGateway.prototype.handleStart = function (client, data) {
        console.log('handleStart');
        var roomName = data.roomName, isOwner = data.isOwner, ready = data.ready;
        var room = this.globalGameRoom.get(roomName);
        console.log('readyNum', room.readyNum);
        if (isOwner) { //  房主点击开始游戏
            if (room.playerMap.size < 2) {
                return constant_1.PLAYER_TOO_LESS;
            }
            else if (room.readyNum === room.playerMap.size) {
                //  开始
                this.server.sockets["in"](roomName).emit('game-start', { msg: 'game-start', roomName: roomName });
                return constant_1.GAME_START;
            }
            else {
                return constant_1.PLAYER_NO_READY;
            }
        }
        else { //  玩家点击准备
            if (ready) {
                room.readyNum++;
            }
            else {
                room.readyNum--;
            }
            return constant_1.GAME_READY;
        }
    };
    /**
     * 断开链接
     */
    EventGateway.prototype.handleDisconnect = function (client, manually) {
        console.log('disconnect', client.id, client.data);
        console.log('client', client.handshake.auth);
        var loginPlayerInfo = client.handshake.auth;
        var playerId = loginPlayerInfo.id;
        /*
          重大问题！！！
          1、刷新页面导致断连和重连
            - 保存当前状态（both 前/后端），并且不适用 client 的 socket id 作为房间和人的唯一标识，应当使用玩家 id
            - 先创建前端的 redux
            - 需要记录的状态：加入的房间、游戏的进度、登陆的状态
          2、handleDisconnect 函数执行时，client 已经销毁，无法通过 id 拿到房间信息来更新 globalGameRoom
            - 通过 client.id 直接在 globalGameRoom 里遍历房间和 playerMap 查找，然后删除
          3、刷新和主观地退出房间，都会调用本函数，需要在逻辑上做出区别
            - 主观退出的情况：1）关闭网页 2）手动点击离开房间
            - 对于 1），可能不存在 reconnect 的情况，直接不用管，虽然可能已经记录了状态，但无故退出导致游戏结束，不需要考虑恢复
            - 对于 2），用一个 handleLeave 的函数监听客户端，执行时调用本函数
          
          TODOS
          1、先完成前端页面刷新，断连时相关 globalGameRoom 清除的逻辑
          2、实现以用户 id 作为房间和用户标识【已解决, 待检查】
          2、然后实现断连状态记录恢复的逻辑
    
          现状：
          1、玩家的 id 已经是数据库分配的 uid（发送 create 和 join 请求时传过来的），而不是 client.id，
              但 room.playerMap 里还没改过来，仍然是 client.id
          2、加入房间后刷新，就退出房间了（前后端都显示如此）
          3、这里断连仍然是用 client.id 查找，肯定会出问题，但不知道该函数如何获取断连的用户的 player uid
          【已解决】：方法：后端的 Socket 对象有data属性，但前端没有，无法利用，但前后端都有身份验证 auth 属性
            在前端登陆后，进入 menu 页时创建 socket 连接，此时在前端给 auth 写入用户信息，后端就能在 client 参数中，
            通过 client.handshake.auth 获取断开连接的 player 对象.
        */
        var rooms = this.globalGameRoom;
        console.log('rooms', rooms);
        if (true) { // 测试时为true，之后应该为 manually，此处是处理用户手动退出的
            for (var _i = 0, _a = rooms.keys(); _i < _a.length; _i++) {
                var roomName = _a[_i];
                var room = rooms.get(roomName);
                if (room.owner.id === playerId) { //  是房主
                    console.log('是房主');
                    //  TODO: 随机安排一个玩家为房主
                    if (room.playerMap.size > 1) {
                    }
                    else {
                        this.globalGameRoom["delete"](roomName);
                    }
                }
                else if (room.playerMap.has(playerId)) { //  若是普通玩家离开，注意处理给其它玩家的通知（TODO）
                    console.log('是普通玩家');
                    room.playerMap["delete"](playerId);
                }
            }
        }
        this.handleUpdateRoomList();
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
        websockets_1.SubscribeMessage('update-roomlist')
    ], EventGateway.prototype, "handleUpdateRoomList");
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
        websockets_1.SubscribeMessage('leaveRoom') //  玩家手动离开房间（不通过调用 handleDisconnect 实现了）
        ,
        __param(0, websockets_1.ConnectedSocket()),
        __param(1, websockets_1.MessageBody())
    ], EventGateway.prototype, "handleLeaveRoom");
    __decorate([
        websockets_1.SubscribeMessage('get-room-obj'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "getRoomObj");
    __decorate([
        websockets_1.SubscribeMessage('qurey-turns-info'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "firstBroadcastTrunsInfo");
    __decorate([
        websockets_1.SubscribeMessage('notifyNext'),
        __param(0, websockets_1.MessageBody())
    ], EventGateway.prototype, "broadcastTrunsInfo");
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
