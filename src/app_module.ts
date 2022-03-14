import { Module } from '@nestjs/common';
import { AppController } from './app_controller';
import { AppService } from './app_service';
import { CoreModule } from './core/core_module';

@Module({
  imports: [CoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
