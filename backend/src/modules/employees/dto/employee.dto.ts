import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Direction, Role } from '../../../common/enums/reference.enum';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'sAMAccountName — ключ матчинга с Jira' })
  @IsString()
  @IsOptional()
  jiraIdentity?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  mail?: string;

  @ApiProperty({ enum: Direction })
  @IsEnum(Direction)
  direction: Direction;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
