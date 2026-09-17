import { IsString, IsOptional } from 'class-validator';
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
}
