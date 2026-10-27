import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity.js';
import { UserRole } from '../auth/role.enum.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { MechanicStatus } from './mechanic-status.enum.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic) private readonly mechanics: Repository<Mechanic>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const mechanic = this.mechanics.create({
      name: dto.name,
      email: dto.email,
      specialty: dto.specialty,
      status: dto.status,
    });
    mechanic.email = dto.email.trim().toLowerCase();
    if (dto.userId) mechanic.user = await this.findTechnicianUser(dto.userId);
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
    const { userId, ...updates } = dto;
    Object.assign(mechanic, updates);
    if (dto.email) mechanic.email = dto.email.trim().toLowerCase();
    if (userId) mechanic.user = await this.findTechnicianUser(userId);
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

  private async findTechnicianUser(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user || user.role !== UserRole.TECHNICIAN) {
      throw new BadRequestException('La cuenta vinculada debe existir y tener rol TECHNICIAN');
    }
    return user;
  }
}
