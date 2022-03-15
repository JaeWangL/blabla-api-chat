import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database_module';
import { MemberService } from './services/member_service';
import { RoomService } from './services/room_service';
import { ChatGateway } from './chat_gateway';

@Module({
  imports: [DatabaseModule],
  providers: [RoomService, MemberService, ChatGateway],
})
export class ChatModule {}
