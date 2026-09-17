// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkillService } from './skill.service';
import { CreateSkillDto, UpdateSkillDto } from './skill.dto';

@ApiTags('技能管理')
@ApiBearerAuth()
@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Post()
  @ApiOperation({ summary: '创建技能' })
  create(@Body() dto: CreateSkillDto) {
    return this.skillService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取技能列表' })
  findAll() {
    return this.skillService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取技能详情' })
  findOne(@Param('id') id: string) {
    return this.skillService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新技能' })
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除技能' })
  remove(@Param('id') id: string) {
    return this.skillService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取技能统计' })
  getStats(@Param('id') id: string) {
    return this.skillService.getStats(id);
  }
}
