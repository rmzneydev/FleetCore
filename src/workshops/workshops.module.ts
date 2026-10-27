import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { WorkshopsService } from './workshops.service.js';
import { WorkshopsController } from './workshops.controller.js';
import { Workshop } from './entities/workshop.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop, Maintenance])],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
})
export class WorkshopsModule {}
