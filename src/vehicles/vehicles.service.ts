import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleStatus } from './vehicle-status.enum.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>) {}

  create(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicles.create(dto);
    vehicle.plate = dto.plate.trim().toUpperCase();
    return this.vehicles.save(vehicle);
  }

  findAll(): Promise<Vehicle[]> {
    return this.vehicles.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: number): Promise<Vehicle> {
    return this.findById(id);
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findOneBy({ plate: plate.trim().toUpperCase() });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    Object.assign(vehicle, dto);
    if (dto.plate) vehicle.plate = dto.plate.trim().toUpperCase();
    return this.vehicles.save(vehicle);
  }

  async remove(id: number): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehicles.save(vehicle);
  }

  private async findById(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicles.findOneBy({ id });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }
}
