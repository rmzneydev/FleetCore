import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MechanicStatus } from '../mechanic-status.enum.js';

export class UpdateMechanicDto {
  @ApiPropertyOptional({ example: 'Carlos Pérez', minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'carlos.perez@example.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Motor diésel', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  specialty?: string;

  @ApiPropertyOptional({ enum: MechanicStatus, example: MechanicStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MechanicStatus)
  status?: MechanicStatus;

  @ApiPropertyOptional({ example: 'd2f73bd3-cb34-4f90-bd7a-97679a913801' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
