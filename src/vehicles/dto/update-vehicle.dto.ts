import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '../vehicle-status.enum.js';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC123', minLength: 2, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate?: string;

  @ApiPropertyOptional({ example: 'Chevrolet', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'NPR', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: 2022, minimum: 1900, maximum: new Date().getFullYear() + 1 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiPropertyOptional({ example: 45000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
