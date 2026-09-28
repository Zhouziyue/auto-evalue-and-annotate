import { Module } from '@nestjs/common';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';
import { SkillPackageService } from './skill-package.service';

@Module({
  controllers: [SkillController],
  providers: [SkillService, SkillPackageService],
  exports: [SkillService, SkillPackageService],
})
export class SkillModule {}
