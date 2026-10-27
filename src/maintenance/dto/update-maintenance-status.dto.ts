import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsInt, Min, MinLength } from 'class-validator';
import { MaintenanceStatus } from '../maintenance-status.enum.js';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.IN_PROGRESS })
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  @ApiPropertyOptional({ example: 'Se cambiaron aceite, filtros y empaque.' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  workPerformed?: string;

  @ApiPropertyOptional({ example: 350000, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalCost?: number;

  @ApiPropertyOptional({ example: '2026-11-02T14:45:00.000Z' })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;

  @ApiPropertyOptional({ example: 45120, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  finalMileage?: number;
}