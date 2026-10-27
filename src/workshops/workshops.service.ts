import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { ACTIVE_MAINTENANCE_STATUSES } from '../maintenance/maintenance-status.enum.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { WorkshopStatus } from './workshop-status.enum.js';
import { Workshop } from './entities/workshop.entity.js';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop) private readonly workshops: Repository<Workshop>,
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
  ) {}

  create(dto: CreateWorkshopDto): Promise<Workshop> {
    return this.workshops.save(this.workshops.create(dto));
  }

  findAll(): Promise<Workshop[]> {
    return this.workshops.find({
      where: { status: WorkshopStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number): Promise<Workshop> {
    return this.findById(id);
  }

  async update(id: number, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findById(id);
    if (dto.status === WorkshopStatus.INACTIVE && workshop.status !== WorkshopStatus.INACTIVE) {
      await this.assertWithoutActiveMaintenances(workshop);
    }
    Object.assign(workshop, dto);
    return this.workshops.save(workshop);
  }

  async remove(id: number): Promise<Workshop> {
    const workshop = await this.findById(id);
    await this.assertWithoutActiveMaintenances(workshop);
    workshop.status = WorkshopStatus.INACTIVE;
    return this.workshops.save(workshop);
  }

  private async assertWithoutActiveMaintenances(workshop: Workshop): Promise<void> {
    const hasActiveMaintenances = await this.maintenances.existsBy({
      workshop: { id: workshop.id },
      status: In([...ACTIVE_MAINTENANCE_STATUSES]),
    });
    if (hasActiveMaintenances) {
      throw new ConflictException(
        `El taller ${workshop.name} tiene mantenimientos programados o en proceso`,
      );
    }
  }

  private async findById(id: number): Promise<Workshop> {
    const workshop = await this.workshops.findOneBy({ id });
    if (!workshop) throw new NotFoundException('Taller no encontrado');
    return workshop;
  }
}
