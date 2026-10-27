import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { MechanicStatus } from './mechanic-status.enum.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Injectable()
export class MechanicsService {
  constructor(@InjectRepository(Mechanic) private readonly mechanics: Repository<Mechanic>) {}

  create(dto: CreateMechanicDto): Promise<Mechanic> {
    const mechanic = this.mechanics.create(dto);
    mechanic.email = dto.email.trim().toLowerCase();
    return this.mechanics.save(mechanic);
  }

  findAll(): Promise<Mechanic[]> {
    return this.mechanics.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<Mechanic> {
    return this.findById(id);
  }

  async update(id: string, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findById(id);
    Object.assign(mechanic, dto);
    if (dto.email) mechanic.email = dto.email.trim().toLowerCase();
    return this.mechanics.save(mechanic);
  }

  async remove(id: string): Promise<Mechanic> {
    const mechanic = await this.findById(id);
    mechanic.status = MechanicStatus.INACTIVE;
    return this.mechanics.save(mechanic);
  }

  private async findById(id: string): Promise<Mechanic> {
    const mechanic = await this.mechanics.findOneBy({ id });
    if (!mechanic) throw new NotFoundException('Mecánico no encontrado');
    return mechanic;
  }
}
