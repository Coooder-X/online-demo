import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class EventGateway {
  @WebSocketServer() private server: Server;

  private limitClientNum: number = 4;

  private globalGameRoom: Map<string, GameRoom> = new Map();

  @SubscribeMessage('connect-server')
  handleConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): void {
    console.log('new client connected.');
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): any {
    console.log('createRoom');
    console.log(client.rooms);
    // client.broadcast.emit('event', {str:'afdsafda'});
    client.join(data.roomName);
    let newRoom: GameRoom = {
      id: data.roomName,
      started: false,
      message: new Map(),
      playerMap: new Map(),
    };
    let newPlayer: Player = {
      id: client.id, //  找机会改成使用传入的player用户名
      socketId: client.id,
    };
    newRoom.playerMap.set(client.id, newPlayer);
    this.globalGameRoom.set(data.roomName, newRoom);
    console.log(client.rooms);
    console.log(this.globalGameRoom);
    return data;
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): any {
    console.log('joinRoom');
    const roomsMap = this.server.of('/').adapter.rooms;
    console.log('of room', roomsMap);
    console.log('set room', data.roomId, roomsMap.get(data.roomId));

    if (roomsMap.get(data.roomId) === undefined) {
      //  if incoming room_id not in exist rooms, return null
      console.log('no has');
      return null;
    } else if (roomsMap.get(data.roomId).size >= this.limitClientNum + 1) {
      // room 人数超过4, 拒绝加入(+1是计入初始的一个房间, 这里没找到namespace的api，先这样写)
      console.log('size', roomsMap.get(data.roomId).size);
      return { msg: '当前房间人数已满' };
    } else if (this.globalGameRoom.get(data.roomId).started) {
      return { msg: '当前房间正在游戏中，无法加入' };
    }
    client.join(data.roomId);
    this.server
      .to(data.roomId as string)
      .except(client.id)
      .emit('broadcast', { msg: `${client.id}已进入房间` }); //  给当前房间除了自己的人广播消息
    return { msg: `已加入房间：${data.roomId}` }; //  if exist, return room info
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
  ): any {
    console.log('handleStart');
    // this.globalGameRoom.get(data.roomId)
    if(this.server.of('/').adapter.rooms.get(data.roomId).size < 2) {
      return { msg: '人数不足，无法开始', enable: false }
    }
    return { enable: true };
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
