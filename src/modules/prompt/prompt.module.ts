import { Module } from '@nestjs/common';
import { PromptVersionService } from './prompt-version.service';
import { PromptController } from './prompt.controller';

@Module({
  controllers: [PromptController],
  providers: [PromptVersionService],
  exports: [PromptVersionService],
})
export class PromptModule {}
