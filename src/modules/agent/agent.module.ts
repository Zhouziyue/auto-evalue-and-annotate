import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { SseParserService } from './sse-parser.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, SseParserService],
  exports: [AgentService, SseParserService],
})
export class AgentModule {}
