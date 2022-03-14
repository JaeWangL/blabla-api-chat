import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { DebuggerService } from '../debugger/debugger_service';
import { DebuggerModule } from '../debugger/debugger_module';
import Configs from '../configs';
import { ChatModule } from '../chat/chat_module';
import { KafkaProducerModule } from '../kafka/kafka_producer_module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      load: Configs,
      ignoreEnvFile: false,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
    }),
    WinstonModule.forRootAsync({
      inject: [DebuggerService],
      imports: [DebuggerModule],
      useFactory: (loggerService: DebuggerService) => loggerService.createLogger(),
    }),
    KafkaProducerModule,
    ChatModule,
  ],
})
export class CoreModule {}
