import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkshopStatus } from '../workshop-status.enum.js';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Centro', minLength: 2, maxLength: 150 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'Av. Principal 123, Bogotá', minLength: 5, maxLength: 255 })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address!: string;

  @ApiPropertyOptional({ enum: WorkshopStatus, example: WorkshopStatus.ACTIVE })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}
