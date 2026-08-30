import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDatasetDto {
  @ApiProperty({ description: '数据集名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '分类标签' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateDatasetDto {
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
  category?: string;
}

export class CreateTestCaseDto {
  @ApiProperty({ description: '输入 prompt' })
  @IsString()
  input: string;

  @ApiPropertyOptional({ description: '期望输出' })
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @ApiPropertyOptional({ description: '难度', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ description: '标签' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GenerateDto {
  @ApiProperty({ description: '问题/场景' })
  @IsString()
  input: string;

  @ApiPropertyOptional({ description: '上下文' })
  @IsOptional()
  @IsString()
  context?: string;
}

export class SelectAnswerDto {
  @ApiProperty({ description: '生成记录ID' })
  @IsString()
  generationId: string;

  @ApiPropertyOptional({ description: '选择的答案索引 (0-2)' })
  @IsOptional()
  @IsNumber()
  selectedIndex?: number;

  @ApiPropertyOptional({ description: '自定义修正答案' })
  @IsOptional()
  @IsString()
  customAnswer?: string;
}
