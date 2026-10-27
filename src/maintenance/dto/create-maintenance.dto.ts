import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
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

  @ApiProperty({ example: 'b6f83a26-e64b-4883-9c89-53591c2f102f' })
  @IsUUID()
  vehicleId!: string;

  @ApiProperty({ example: 'd2f73bd3-cb34-4f90-bd7a-97679a913801' })
  @IsUUID()
  mechanicId!: string;

  @ApiProperty({ example: '3d1c1c90-560f-41a3-b7d7-f299a7a5a55a' })
  @IsUUID()
  workshopId!: string;
}