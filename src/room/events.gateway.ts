import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ namespace: 'room', cors: true })
export class EventGateway {
  @WebSocketServer() server;

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
    this.server
      .to(data.roomName as string)
      .emit('broadcast', { str: 'afdsafda' });
    console.log(client.rooms);
    return data;
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): any {
    console.log('joinRoom');
    const roomIds = (this.server.adapter as any).rooms;
    console.log(roomIds.keys());

    // console.log('in room', this.server.in('room'));
    // console.log(this.server._nsps);
    // console.log(nsp, (this.server.adapter as any).rooms.nsp);
    // console.log(roomIds.get(data.roomId));
    // console.log('size', this.server.of('/room').adapter.rooms.size);
    // console.log('server', this.server.server);
    const io = this.server.server;
    console.log('of', io.of('/room').adapter.rooms); //  of下namespace的rooms

    // return this.server;

    console.log('size', roomIds.size);
    // const io = this.server as Server;
    // console.log('nsp', io.of('/'));

    if (roomIds.get(data.roomId) === undefined) {
      //  if incoming room_id not in exist rooms, return null
      console.log('no has');
      return null;
    } else if (roomIds.size >= 4 + 1) {
      // room 人数超过4, 拒绝加入(+1是计入初始的一个房间, 这里没找到namespace的api，先这样写)
      return { msg: '当前房间人数已满' };
    }
    client.join(data.roomId);
    return { roomId: data.roomId }; //  if exist, return room info
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

  @SubscribeMessage('func')
  func(@MessageBody() data: string): string {
    console.log('func');
    this.server.on('connection', (socket: Socket) => {
      // console.log(socket);
      socket.emit('message');
    });
    return data;
  }

  /**
   * 断开链接
   */
  handleDisconnect(client: Socket) {
    // this.allNum -= 1
    // this.ws.emit('leave', { name: this.users[client.id], allNum: this.allNum, connectCounts: this.connectCounts });
  }
}
