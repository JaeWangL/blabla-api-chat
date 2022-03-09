import { Module } from '@nestjs/common';
import { ChatGateway } from './chat_gateway';

@Module({
  imports: [],
  providers: [ChatGateway],
})
export class ChatModule {}
