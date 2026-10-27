import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { User } from '../auth/user.entity.js';
import { MechanicsService } from './mechanics.service.js';
import { MechanicsController } from './mechanics.controller.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic, Maintenance, User])],
  controllers: [MechanicsController],
  providers: [MechanicsService],
})
export class MechanicsModule {}
