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
      return { ...room, playerNum: room.playerMap.size }; //  验证正确后去掉 playerMap 属性
    });
    return roomList;
  }

  @SubscribeMessage('connect-server')
  handleConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): RoomInfo[] {
    console.log('new client connected.');
    return this.updateRoomList(); //  每个客户端接入时，自动获取一次房间列表
  }

  @SubscribeMessage('update-roomlist')
  handleUpdateRoomList (
    @ConnectedSocket() client: Socket,
  ): void {
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
    let newRoom: GameRoom = {
      name: data.roomName,
      started: false,
      message: new Map(),
      playerMap: new Map(),
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
  handleDisconnect(client: Socket) {
    console.log('disconnect');
    // this.allNum -= 1
    // this.ws.emit('leave', { name: this.users[client.id], allNum: this.allNum, connectCounts: this.connectCounts });
  }
}
