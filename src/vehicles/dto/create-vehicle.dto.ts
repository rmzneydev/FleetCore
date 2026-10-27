import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '../vehicle-status.enum.js';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123', minLength: 2, maxLength: 20 })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate!: string;

  @ApiProperty({ example: 'Chevrolet', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  brand!: string;

  @ApiProperty({ example: 'NPR', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  model!: string;

  @ApiProperty({ example: 2022, minimum: 1900, maximum: new Date().getFullYear() + 1 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @ApiProperty({ example: 45000, minimum: 0 })
  @IsInt()
  @Min(0)
  mileage!: number;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
