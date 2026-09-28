// @ts-nocheck
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { SkillService } from './skill.service';
import { SkillPackageService } from './skill-package.service';
import {
  CreateSkillDto, UpdateSkillDto,
  CreateSkillFileDto, UpdateSkillFileDto, BatchCreateFilesDto,
  LinkAgentDto,
} from './skill.dto';

@ApiTags('技能管理')
@ApiBearerAuth()
@Controller('skills')
export class SkillController {
  constructor(
    private readonly skillService: SkillService,
    private readonly skillPackageService: SkillPackageService,
  ) {}

  // ============================================
  // Skill CRUD
  // ============================================

  @Post()
  @ApiOperation({ summary: '创建技能包' })
  create(@Body() dto: CreateSkillDto) {
    return this.skillService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取技能列表（默认 root 级，parentId=all 返回全部）' })
  findAll(@Query('parentId') parentId?: string) {
    return this.skillService.findAll(parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取技能详情（含文件树、子技能、关联 Agent）' })
  findOne(@Param('id') id: string) {
    return this.skillService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新技能包' })
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除技能包（级联删除子技能和文件）' })
  remove(@Param('id') id: string) {
    return this.skillService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取技能统计' })
  getStats(@Param('id') id: string) {
    return this.skillService.getStats(id);
  }

  // ============================================
  // 文件树管理
  // ============================================

  @Get(':id/tree')
  @ApiOperation({ summary: '获取文件树结构' })
  getFileTree(@Param('id') id: string) {
    return this.skillService.getFileTree(id);
  }

  @Get(':id/files')
  @ApiOperation({ summary: '获取所有文件列表（扁平）' })
  getAllFiles(@Param('id') id: string) {
    return this.skillService.getAllFiles(id);
  }

  @Post(':id/files')
  @ApiOperation({ summary: '添加单个文件' })
  addFile(@Param('id') id: string, @Body() dto: CreateSkillFileDto) {
    return this.skillService.addFile(id, dto);
  }

  @Post(':id/files/batch')
  @ApiOperation({ summary: '批量创建/更新文件' })
  batchCreateFiles(@Param('id') id: string, @Body() dto: BatchCreateFilesDto) {
    return this.skillService.batchCreateFiles(id, dto);
  }

  @Put(':id/files/:fileId')
  @ApiOperation({ summary: '更新文件内容' })
  updateFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Body() dto: UpdateSkillFileDto,
  ) {
    return this.skillService.updateFile(id, fileId, dto);
  }

  @Delete(':id/files/:fileId')
  @ApiOperation({ summary: '删除文件' })
  deleteFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.skillService.deleteFile(id, fileId);
  }

  // ============================================
  // zip 导入/导出
  // ============================================

  @Post('upload')
  @ApiOperation({ summary: '上传 zip 包导入技能包' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        parentId: { type: 'string', description: '可选的父技能ID' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPackage(
    @UploadedFile() file: Express.Multer.File,
    @Body('parentId') parentId?: string,
  ) {
    if (!file) {
      throw new Error('请上传 zip 文件');
    }
    return this.skillPackageService.importFromZip(file.buffer, parentId);
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出技能包为 zip' })
  async exportPackage(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.skillPackageService.exportToZip(id);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="skill-${id}.zip"`,
    });
    res.send(buffer);
  }

  // ============================================
  // 技能-智能体关联
  // ============================================

  @Get(':id/agents')
  @ApiOperation({ summary: '获取该技能关联的所有 Agent' })
  getLinkedAgents(@Param('id') id: string) {
    return this.skillService.getLinkedAgents(id);
  }

  @Post(':id/agents')
  @ApiOperation({ summary: '关联 Agent 到技能' })
  linkAgent(@Param('id') id: string, @Body() dto: LinkAgentDto) {
    return this.skillService.linkAgent(id, dto);
  }

  @Delete(':id/agents/:linkId')
  @ApiOperation({ summary: '取消 Agent 关联' })
  unlinkAgent(@Param('id') id: string, @Param('linkId') linkId: string) {
    return this.skillService.unlinkAgent(id, linkId);
  }
}
