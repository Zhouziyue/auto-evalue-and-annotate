import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportExportService } from './report-export.service';
import { ReportController } from './report.controller';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportExportService],
  exports: [ReportService, ReportExportService],
})
export class ReportModule {}
