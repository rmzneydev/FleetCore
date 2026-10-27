import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { ACTIVE_MAINTENANCE_STATUSES } from '../maintenance/maintenance-status.enum.js';
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
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
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

  findOne(id: number): Promise<Mechanic> {
    return this.findById(id);
  }

  async update(id: number, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findById(id);
    if (dto.status === MechanicStatus.INACTIVE && mechanic.status !== MechanicStatus.INACTIVE) {
      await this.assertWithoutActiveMaintenances(mechanic);
    }
    const { userId, ...updates } = dto;
    Object.assign(mechanic, updates);
    if (dto.email) mechanic.email = dto.email.trim().toLowerCase();
    if (userId && userId !== mechanic.userId) {
      mechanic.user = await this.findTechnicianUser(userId, mechanic.id);
    }
    return this.mechanics.save(mechanic);
  }

  async remove(id: number): Promise<Mechanic> {
    const mechanic = await this.findById(id);
    await this.assertWithoutActiveMaintenances(mechanic);
    mechanic.status = MechanicStatus.INACTIVE;
    return this.mechanics.save(mechanic);
  }

  private async findById(id: number): Promise<Mechanic> {
    const mechanic = await this.mechanics.findOneBy({ id });
    if (!mechanic) throw new NotFoundException('Mecánico no encontrado');
    return mechanic;
  }

  // Inactivar no borra historial, pero sí debe esperar a que no queden trabajos pendientes.
  private async assertWithoutActiveMaintenances(mechanic: Mechanic): Promise<void> {
    const hasActiveMaintenances = await this.maintenances.existsBy({
      mechanic: { id: mechanic.id },
      status: In([...ACTIVE_MAINTENANCE_STATUSES]),
    });
    if (hasActiveMaintenances) {
      throw new ConflictException(
        `El mecánico ${mechanic.name} tiene mantenimientos programados o en proceso`,
      );
    }
  }

  private async findTechnicianUser(id: number, currentMechanicId?: number): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user || user.role !== UserRole.TECHNICIAN) {
      throw new BadRequestException('La cuenta vinculada debe existir y tener rol TECHNICIAN');
    }

    const alreadyLinked = await this.mechanics.findOneBy({ user: { id } });
    if (alreadyLinked && alreadyLinked.id !== currentMechanicId) {
      throw new BadRequestException('La cuenta TECHNICIAN ya está vinculada a un mecánico');
    }
    return user;
  }
}
