import { Module } from '@nestjs/common';
import { AppController } from './app_controller';
import { AppService } from './app_service';
import { ChatModule } from './chat/chat_module';

@Module({
  imports: [ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
