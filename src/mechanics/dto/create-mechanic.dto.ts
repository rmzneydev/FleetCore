import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MechanicStatus } from '../mechanic-status.enum.js';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Pérez', minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'carlos.perez@example.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Motor diésel', minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  specialty!: string;

  @ApiPropertyOptional({ enum: MechanicStatus, example: MechanicStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MechanicStatus)
  status?: MechanicStatus;
}
