import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity.js';
import { MaintenanceService } from './maintenance.service.js';

@Module({
	imports: [TypeOrmModule.forFeature([Maintenance, MaintenanceStatusLog])],
	controllers: [MaintenanceController],
	providers: [MaintenanceService],
})
export class MaintenanceModule {}
