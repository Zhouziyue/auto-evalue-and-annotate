import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ description: '技能名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '技能描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '版本号', default: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: '分类', enum: ['function_call', 'rag', 'agent', 'chat', 'classification', 'summarization'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '标签数组' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: '技能指令（SKILL.md 风格的 Markdown）' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: '允许使用的工具列表' })
  @IsOptional()
  @IsArray()
  allowedTools?: string[];

  @ApiPropertyOptional({ description: '需要的上下文信息' })
  @IsOptional()
  @IsArray()
  requiredContext?: string[];

  @ApiPropertyOptional({ description: '技能作者' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: '许可协议' })
  @IsOptional()
  @IsString()
  license?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'deprecated', 'draft'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '父技能ID（用于嵌套子技能）' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: '包类型', enum: ['root', 'sub_skill'] })
  @IsOptional()
  @IsString()
  packageType?: string;

  @ApiPropertyOptional({ description: '图标（emoji 或 icon name）' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateSkillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '标签数组' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: '技能指令' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: '允许使用的工具列表' })
  @IsOptional()
  @IsArray()
  allowedTools?: string[];

  @ApiPropertyOptional({ description: '需要的上下文信息' })
  @IsOptional()
  @IsArray()
  requiredContext?: string[];

  @ApiPropertyOptional({ description: '技能作者' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: '许可协议' })
  @IsOptional()
  @IsString()
  license?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '父技能ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: '图标' })
  @IsOptional()
  @IsString()
  icon?: string;
}

// ============================================
// 文件管理 DTO
// ============================================

export class CreateSkillFileDto {
  @ApiProperty({ description: '文件相对路径', example: 'prompts/main.md' })
  @IsString()
  path: string;

  @ApiProperty({ description: '文件内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '文件类型', enum: ['markdown', 'json', 'yaml', 'text', 'python', 'javascript'] })
  @IsOptional()
  @IsString()
  fileType?: string;
}

export class UpdateSkillFileDto {
  @ApiPropertyOptional({ description: '文件内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '新路径（重命名）' })
  @IsOptional()
  @IsString()
  path?: string;
}

export class BatchCreateFilesDto {
  @ApiProperty({ description: '文件列表', type: [CreateSkillFileDto] })
  @IsArray()
  files: CreateSkillFileDto[];
}

// ============================================
// 技能-智能体关联 DTO
// ============================================

export class LinkAgentDto {
  @ApiProperty({ description: '智能体端点ID' })
  @IsString()
  endpointId: string;

  @ApiPropertyOptional({ description: '角色', enum: ['primary', 'fallback', 'observer'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: '关联配置 JSON' })
  @IsOptional()
  config?: Record<string, any>;
}
