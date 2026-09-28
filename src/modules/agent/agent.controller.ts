import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { CreateAgentDto, UpdateAgentDto, ProbeSseDto } from './agent.dto';

@ApiTags('智能体管理')
@ApiBearerAuth()
@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiOperation({ summary: '注册智能体' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取智能体列表（含关联技能）' })
  findAll() {
    return this.agentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取智能体详情（含关联技能）' })
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新智能体配置' })
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除智能体' })
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }

  @Post(':id/probe')
  @ApiOperation({ summary: '探测 SSE 响应格式' })
  probeSse(@Param('id') id: string, @Body() dto: ProbeSseDto) {
    return this.agentService.probeSseFormat(id, dto.input);
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试智能体连接' })
  testConnection(@Param('id') id: string, @Body() dto: ProbeSseDto) {
    return this.agentService.testConnection(id, dto.input);
  }

  // ============================================
  // 技能关联管理
  // ============================================

  @Get(':id/skills')
  @ApiOperation({ summary: '获取该智能体关联的技能列表' })
  getLinkedSkills(@Param('id') id: string) {
    return this.agentService.getLinkedSkills(id);
  }

  @Post(':id/skills')
  @ApiOperation({ summary: '关联技能到智能体' })
  linkToSkill(
    @Param('id') id: string,
    @Body() body: { skillId: string; role?: string },
  ) {
    return this.agentService.linkToSkill(id, body.skillId, body.role);
  }

  @Delete(':id/skills/:linkId')
  @ApiOperation({ summary: '取消技能关联' })
  unlinkFromSkill(@Param('id') id: string, @Param('linkId') linkId: string) {
    return this.agentService.unlinkFromSkill(id, linkId);
  }
}
