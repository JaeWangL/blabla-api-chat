import { Controller, Get } from '@nestjs/common';
import { AppService } from './app_service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
