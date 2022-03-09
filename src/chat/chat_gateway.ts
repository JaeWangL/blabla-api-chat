import { Socket, Server } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { SocketPubMessageTypes, SocketSubMessageTypes } from '../configs/socket_keys';
import { JoinRoomRequest, LeaveRoomRequest, SendMessageRequest, SentMessage } from './dtos/chat_dtos';

type JoinedUser = {
  roomId: string;

  /**
   * 1: Android
   * 2: iOS
   */
  deviceType: 1 | 2;
  deviceId: string;
};

@WebSocketGateway({
  transports: ['websocket', 'polling', 'flashsocket'],
  path: '/ws-chat/',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  joinedUsers: Map<string, JoinedUser> = new Map(); // [clientId, JoinedUser]

  accumulatedUserCount: Map<string, number> = new Map(); // [roomId, count]

  afterInit(server: Server): void {
    // console.log('Init');
  }

  handleDisconnect(client: Socket): void {
    // console.log(`Client Disconnected : ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]): void {
    // console.log(`Client Connected : ${client.id}`);
  }

  /**
   * We assume one user can join just one room and at a time
   * If want joining multiple rooms, change 'joinedUsers' to grouped array by roomId
   */
  @SubscribeMessage(SocketSubMessageTypes.JOIN_ROOM)
  async handleJoinRoomAsync(@ConnectedSocket() client: Socket, @MessageBody() data: JoinRoomRequest): Promise<void> {
    const { deviceType, deviceId, roomId } = data;
    // updatedUserCount will be used with user's nickname
    const updatedUserCount = this.accumulatedUserCount.get(roomId) ? this.accumulatedUserCount.get(roomId) + 1 : 1;

    client.join(roomId);
    this.joinedUsers.set(client.id, { roomId, deviceType, deviceId });
    this.accumulatedUserCount.set(roomId, updatedUserCount);

    // Send his profile to 'client'
    this.server.to(client.id).emit(SocketPubMessageTypes.GET_PROFILE, updatedUserCount);

    // Send joined new member message to others 'except client'
    client.to(roomId).emit(SocketPubMessageTypes.JOINED_NEW_MEMBER, updatedUserCount);
  }

  /**
   * We assume one user can join just one room and at a time
   * And, Leaving room means 'disconnect'
   */
  @SubscribeMessage(SocketSubMessageTypes.LEAVE_ROOM)
  async onLeaveRoomAsync(@ConnectedSocket() client: Socket, @MessageBody() data: LeaveRoomRequest): Promise<void> {
    const { deviceType, deviceId, nickName, roomId } = data;
    const updatedUserCount = this.accumulatedUserCount.get(roomId) - 1;

    client.leave(roomId);

    client.to(roomId).emit(SocketPubMessageTypes.LEAVED_EXISTING_MEMBER, nickName);

    this.disconnectClient(client);
  }

  @SubscribeMessage(SocketSubMessageTypes.SEND_MESSAGE)
  async handleSendMessageAsync(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageRequest,
  ): Promise<void> {
    const { message, nickName, roomId } = data;

    client.to(roomId).emit(SocketPubMessageTypes.NEW_MESSAGE, { nickName, message } as SentMessage);
  }

  private getClientByDevice(deviceType: 1 | 2, deviceId: string): Socket | undefined {
    for (const [key, value] of this.joinedUsers.entries()) {
      if (value.deviceType === deviceType && value.deviceId === deviceId) {
        return this.server.sockets.sockets.get(key);
      }
    }

    return undefined;
  }

  private disconnectClient(client: Socket) {
    this.joinedUsers.delete(client.id);

    client.disconnect(true);
  }
}
