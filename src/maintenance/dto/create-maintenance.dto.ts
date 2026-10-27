import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { MaintenanceType } from '../maintenance-type.enum.js';

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiProperty({ example: 'Cambio preventivo de aceite y filtros' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ example: 45000, minimum: 0 })
  @IsInt()
  @Min(0)
  mileage!: number;

  @ApiProperty({ example: '2026-11-02T13:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ example: '2026-11-02T15:00:00.000Z' })
  @IsDateString()
  scheduledEndAt!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  vehicleId!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  mechanicId!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  workshopId!: number;
}