import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { WorkshopStatus } from './workshop-status.enum.js';
import { Workshop } from './entities/workshop.entity.js';

@Injectable()
export class WorkshopsService {
  constructor(@InjectRepository(Workshop) private readonly workshops: Repository<Workshop>) {}

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
    Object.assign(workshop, dto);
    return this.workshops.save(workshop);
  }

  async remove(id: number): Promise<Workshop> {
    const workshop = await this.findById(id);
    workshop.status = WorkshopStatus.INACTIVE;
    return this.workshops.save(workshop);
  }

  private async findById(id: number): Promise<Workshop> {
    const workshop = await this.workshops.findOneBy({ id });
    if (!workshop) throw new NotFoundException('Taller no encontrado');
    return workshop;
  }
}
