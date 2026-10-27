import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MechanicsService } from './mechanics.service.js';
import { MechanicsController } from './mechanics.controller.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic])],
  controllers: [MechanicsController],
  providers: [MechanicsService],
})
export class MechanicsModule {}
