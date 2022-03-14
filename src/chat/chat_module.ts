import { Module } from '@nestjs/common';
import { ChatGateway } from './chat_gateway';

@Module({
  providers: [ChatGateway],
})
export class ChatModule {}
