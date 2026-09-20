import { IsString, IsOptional, IsArray } from 'class-validator';
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
}
