import { RateLimiterMemory } from 'rate-limiter-flexible';
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
import { KafkaTopics } from '../configs/kafka_topics';
import { SocketPubMessageTypes, SocketSubMessageTypes } from '../configs/socket_keys';
import { JoinedRoomIntegrationEvent } from '../infrastructure/events/joined_room_integration_event';
import { LeavedRoomIntegrationEvent } from '../infrastructure/events/leaved_room_integration_event';
import {
  JoinRoomRequest,
  JoinedNewMember,
  LeavedExistingMember,
  SendMessageRequest,
  SentMessage,
} from './dtos/chat_dtos';
import { RateLimited } from './dtos/socket_dtos';
import { KafkaProducerService } from '../kafka/kafka_producer_service';
import { MemberService } from './services/member_service';
import { RoomService } from './services/room_service';

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 points
  duration: 3, // per second
});

@WebSocketGateway({
  transports: ['websocket'],
  // transports: ['websocket', 'polling', 'flashsocket'],
  path: '/ws-chat/',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private kafkaService: KafkaProducerService,
    private roomService: RoomService,
    private memberService: MemberService,
  ) {}

  afterInit(server: Server): void {
    // console.log('Init');
  }

  handleDisconnect(client: Socket): void {
    this.disconnectClientAsync(client);
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

    try {
      await rateLimiter.consume(client.handshake.address); // consume 1 point per event from IP

      const room = await this.roomService.upsertByRoomIdAsync(roomId);
      const generatedNickname = room.accumulated_members_count.toString();

      // Join in specific room
      client.join(roomId);
      await this.memberService.upsertByClientIdAsync(client.id, {
        client_id: client.id,
        room_id: roomId,
        device_type: deviceType,
        device_id: deviceId,
        nick_name: generatedNickname,
      });

      // Send his profile to 'client'
      this.server.to(client.id).emit(SocketPubMessageTypes.GET_PROFILE, generatedNickname);

      // Send joined new member message to others 'except client'
      client.to(roomId).emit(SocketPubMessageTypes.JOINED_NEW_MEMBER, {
        nickName: generatedNickname,
        joinedAt: new Date(),
      } as JoinedNewMember);

      this.kafkaService.emit<JoinedRoomIntegrationEvent>(KafkaTopics.JOINED_ROOM_MEMBER, {
        postId: roomId,
        updatedMemberCount: room.accumulated_members_count,
      });
    } catch (rejRes) {
      this.server
        .to(client.id)
        .emit(SocketPubMessageTypes.RATE_LIMITED, { retryRemainingMs: rejRes.msBeforeNext } as RateLimited);
    }
  }

  @SubscribeMessage(SocketSubMessageTypes.SEND_MESSAGE)
  async handleSendMessageAsync(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageRequest,
  ): Promise<void> {
    const { message, nickName, roomId } = data;

    try {
      await rateLimiter.consume(client.handshake.address); // consume 1 point per event from IP

      // Send new message to all members in roomId 'including sender'
      this.server
        .in(roomId)
        .emit(SocketPubMessageTypes.NEW_MESSAGE, { nickName, message, createdAt: new Date() } as SentMessage);
    } catch (rejRes) {
      this.server
        .to(client.id)
        .emit(SocketPubMessageTypes.RATE_LIMITED, { retryRemainingMs: rejRes.msBeforeNext } as RateLimited);
    }
  }

  /**
   * We assume one user can join just one room and at a time
   * And, Leaving room means 'disconnect'
   */
  private async disconnectClientAsync(client: Socket): Promise<void> {
    const member = await this.memberService.findOneByClientIdAsync(client.id);
    if (!member) {
      return;
    }

    const room = await this.roomService.decreaseMemberCountAsync(member.room_id);

    // Send leave member message to others 'except client'
    client.to(member.room_id).emit(SocketPubMessageTypes.LEAVED_EXISTING_MEMBER, {
      nickName: member.nick_name,
      leavedAt: new Date(),
    } as LeavedExistingMember);

    await this.memberService.deleteByClientIdAsync(client.id);

    this.kafkaService.emit<LeavedRoomIntegrationEvent>(KafkaTopics.LEAVED_ROOM_MEMBER, {
      postId: member.room_id,
      updatedMemberCount: room.accumulated_members_count,
    });

    client.disconnect(true);
  }
}
