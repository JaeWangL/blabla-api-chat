import { Module } from '@nestjs/common';
import { DebuggerService } from './debugger_service';

@Module({
  providers: [DebuggerService],
  exports: [DebuggerService],
  imports: [],
})
export class DebuggerModule {}
