import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PLAYER_TOO_LESS, GAME_START, REPEAT_JOIN, ROOM_PLAYING, ROOM_FULL, JOIN_ROOM_EXIST, CREATE_ROOM_EXIST } from 'src/constant';

@WebSocketGateway({ cors: true })
export class EventGateway {
  @WebSocketServer() private server: Server;

  private limitClientNum: number = 4;

  private globalGameRoom: Map<string, GameRoom> = new Map();

  private updateRoom = (newRoom: GameRoom, clientId: string, playerName: string) => {
    const newPlayer: Player = {
      id: playerName, //  找机会改成使用传入的player用户名
      socketId: clientId,
    };
    newRoom.playerMap.set(clientId, newPlayer);
  }

  private updateRoomList = (): RoomInfo[] => {
    let roomList = [];
    for (let room of this.globalGameRoom) {
      roomList.push(room[1]);
    }
    roomList = roomList.map((room: GameRoom): RoomInfo => {
      return {
        ...room,
        playerNum: room.playerMap.size,
        playerLst: Array.from(room.playerMap.values()),
        owner: room.owner
      }; //  验证正确后去掉 playerMap 属性
    });
    return roomList;
  }

  @SubscribeMessage('connect-server')
  handleConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): RoomInfo[] {
    console.log('new client connected.', client.id);
    return this.updateRoomList(); //  每个客户端接入时，自动获取一次房间列表
  }

  @SubscribeMessage('update-roomlist')
  handleUpdateRoomList(): void {
    console.log('update.');
    this.server.sockets.emit('get-new-room-list', this.updateRoomList()); //  通知所有客户端获取新房间列表
    // this.server.of('/').emit('get-new-room-list', this.updateRoomList()); 
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateRoomReq,
  ): CreateRoomRes {
    console.log('createRoom');
    console.log(client.rooms);
    // client.broadcast.emit('event', {str:'afdsafda'});
    if (this.server.of('/').adapter.rooms.has(data.roomName)) {
      return CREATE_ROOM_EXIST;
    }
    client.join(data.roomName); //  创建时自动加入房间

    const newPlayer: Player = { //  房主在创建时更新进入 globalGameRoom
      id: client.id, //  找机会改成使用传入的player用户名
      socketId: client.id,
    };
    let newRoom: GameRoom = {
      name: data.roomName,
      owner: newPlayer,
      started: false,
      message: new Map(),
      playerMap: new Map(),
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
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomName: string,
  ): JoinRoomRes {
    console.log('joinRoom');
    const roomsMap = this.server.of('/').adapter.rooms;
    console.log('of room', roomsMap);
    console.log('set room', roomName, roomsMap.get(roomName));

    if (roomsMap.get(roomName) === undefined) {
      //  if incoming room_id not in exist rooms, return null
      console.log('no has');
      return JOIN_ROOM_EXIST;
    } else if (roomsMap.get(roomName).size >= this.limitClientNum + 1) {
      // room 人数超过4, 拒绝加入(+1是计入初始的一个房间, 这里没找到namespace的api，先这样写)
      console.log('size', roomsMap.get(roomName).size);
      return ROOM_FULL;
    } else if (this.globalGameRoom.get(roomName).started) {
      return ROOM_PLAYING;
    } else if (this.server.of('/').adapter.rooms.get(roomName).has(client.id)) {
      return REPEAT_JOIN;
    }
    client.join(roomName);
    this.updateRoom(this.globalGameRoom.get(roomName), client.id, client.id);
    this.server
      .to(roomName as string)
      .except(client.id)
      .emit('broadcast', { msg: `${client.id}已进入房间` }); //  给当前房间除了自己的人广播消息
    return {
      msg: `已加入房间：${roomName}`,
      success: true,
      room: this.globalGameRoom.get(roomName)
    }; //  if exist, return room info
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): any {
    console.log('leaveRoom');
    return data;
  }

  @SubscribeMessage('event')
  handleEvent(@MessageBody() data: any): any {
    console.log('call event');
    return data;
  }

  @SubscribeMessage('handleStart')
  handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): StartInfo {
    console.log('handleStart');
    // this.globalGameRoom.get(data.roomName)
    if (this.server.of('/').adapter.rooms.get(data.roomName).size < 2) {
      return PLAYER_TOO_LESS;
    }
    return GAME_START;
  }

  /**
   * 断开链接
   */
  handleDisconnect(client: Socket, manually: Boolean | undefined) {
    console.log('disconnect', client.id);
    /*  
      重大问题！！！ 
      1、刷新页面导致断连和重连
        - 保存当前状态（both 前/后端），并且不适用 client 的 socket id 作为房间和人的唯一标识，应当使用玩家 id
        - 需要记录的状态：加入的房间、游戏的进度、登陆的状态
      2、handleDisconnect 函数执行时，client 已经销毁，无法通过 id 拿到房间信息来更新 globalGameRoom
        - 通过 client.id 直接在 globalGameRoom 里遍历房间和 playerMap 查找，然后删除
      3、刷新和主观地退出房间，都会调用本函数，需要在逻辑上做出区别
        - 主观退出的情况：1）关闭网页 2）手动点击离开房间
        - 对于 1），可能不存在 reconnect 的情况，直接不用管，虽然可能已经记录了状态，但无故退出导致游戏结束，不需要考虑恢复
        - 对于 2），用一个 handleLeave 的函数监听客户端，执行时调用本函数
      
      TODOS
      1、先完成前端页面刷新，断连时相关 globalGameRoom 清除的逻辑
      2、实现以用户 id 作为房间和用户标识
      2、然后实现断连状态记录恢复的逻辑
    */
    const rooms = this.globalGameRoom;
    console.log('rooms', rooms);

    if (true) {  // 测试时为true，之后应该为 manually，此处是处理用户手动退出的
      for (const roomName of rooms.keys()) {
        const room = rooms.get(roomName);
        if (room.owner.id === client.id) { //  是房主
          console.log('是房主');
          //  TODO: 随机安排一个玩家为房主
          if (room.playerMap.size > 1) {

          } else {
            this.globalGameRoom.delete(roomName);
          }
        } else if (room.playerMap.has(client.id)) { //  若是普通玩家离开，注意处理给其它玩家的通知（TODO）
          console.log('是普通玩家');
          room.playerMap.delete(client.id);
        }
      }
    }

    // const sids = this.server.of('/').adapter.sids;
    // console.log('sids', sids);
    // console.log('id', client.id);
    // const rooms = sids.get(client.id);
    // // const lst = [];
    // console.log('rooms', rooms);
    // for(const roomName of rooms.keys()) {
    //   // lst.push(roomName);
    //   //  如果离开的是房主
    //   if(this.globalGameRoom.has(roomName) && this.globalGameRoom.get(roomName).owner.socketId === client.id) {
    //     //  房主随机移交给下一个人，若没人，解散房间（TODO）
    //     //  解散房间：删除 globalGameRoom 记录
    //     this.globalGameRoom.delete(roomName);
    //     this.server.of('/').adapter.rooms.delete(roomName);
    //   }
    //   //  若是普通玩家离开，注意处理给其它玩家的通知（TODO）
    //   client.leave(roomName);
    //   this.globalGameRoom.get(roomName).playerMap.delete(client.id);
    // }


    // // this.globalGameRoom
    // // this.allNum -= 1
    // // this.ws.emit('leave', { name: this.users[client.id], allNum: this.allNum, connectCounts: this.connectCounts });
    this.handleUpdateRoomList();
  }
}
