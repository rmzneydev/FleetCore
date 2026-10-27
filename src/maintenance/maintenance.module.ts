import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceService } from './maintenance.service.js';

@Module({
	imports: [TypeOrmModule.forFeature([Maintenance])],
	controllers: [MaintenanceController],
	providers: [MaintenanceService],
})
export class MaintenanceModule {}
