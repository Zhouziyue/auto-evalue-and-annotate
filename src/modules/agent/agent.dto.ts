import { IsString, IsOptional, IsUrl, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ description: '所属技能ID' })
  @IsString()
  skillId: string;

  @ApiProperty({ description: '智能体名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '智能体描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '接入地址' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: '底层模型', example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '系统提示词' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'inactive', 'error'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'error'])
  status?: string;

  @ApiPropertyOptional({ description: '认证方式', enum: ['none', 'api_key', 'oauth', 'token'] })
  @IsOptional()
  @IsEnum(['none', 'api_key', 'oauth', 'token'])
  authType?: string;

  @ApiPropertyOptional({ description: '认证配置' })
  @IsOptional()
  @IsObject()
  authConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'SSE 响应格式', enum: ['auto', 'content', 'delta', 'custom'] })
  @IsOptional()
  @IsEnum(['auto', 'content', 'delta', 'custom'])
  sseFormat?: string;

  @ApiPropertyOptional({ description: 'SSE 解析模板' })
  @IsOptional()
  @IsObject()
  sseTemplate?: Record<string, any>;

  @ApiPropertyOptional({ description: '请求体模板' })
  @IsOptional()
  @IsObject()
  requestTemplate?: Record<string, any>;

  @ApiPropertyOptional({ description: '超时时间(ms)', default: 30000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional({ description: '最大重试次数', default: 3 })
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class UpdateAgentDto {
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
  @IsUrl()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['active', 'inactive', 'error'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['none', 'api_key', 'oauth', 'token'])
  authType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  authConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['auto', 'content', 'delta', 'custom'])
  sseFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sseTemplate?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  requestTemplate?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class ProbeSseDto {
  @ApiProperty({ description: '测试输入' })
  @IsString()
  input: string;
}
