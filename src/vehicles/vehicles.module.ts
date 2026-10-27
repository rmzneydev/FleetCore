import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { VehiclesService } from './vehicles.service.js';
import { VehiclesController } from './vehicles.controller.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Maintenance])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
