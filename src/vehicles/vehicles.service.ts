import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { ACTIVE_MAINTENANCE_STATUSES } from '../maintenance/maintenance-status.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleStatus } from './vehicle-status.enum.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
  ) {}

  create(dto: CreateVehicleDto): Promise<Vehicle> {
    if (dto.status === VehicleStatus.IN_MAINTENANCE) {
      throw new BadRequestException(
        'El estado IN_MAINTENANCE se asigna automáticamente al iniciar un mantenimiento',
      );
    }
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
    if (dto.status && dto.status !== vehicle.status) {
      await this.assertManualStatusChange(vehicle, dto.status);
    }
    Object.assign(vehicle, dto);
    if (dto.plate) vehicle.plate = dto.plate.trim().toUpperCase();
    return this.vehicles.save(vehicle);
  }

  async remove(id: number): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    await this.assertWithoutActiveMaintenances(vehicle);
    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehicles.save(vehicle);
  }

  // La disponibilidad ligada a mantenimientos la gestiona MaintenanceService; manualmente
  // solo se permite activar o inactivar un vehículo que no tenga trabajo pendiente.
  private async assertManualStatusChange(vehicle: Vehicle, nextStatus: VehicleStatus): Promise<void> {
    if (nextStatus === VehicleStatus.IN_MAINTENANCE) {
      throw new BadRequestException(
        'El estado IN_MAINTENANCE se asigna automáticamente al iniciar un mantenimiento',
      );
    }
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} tiene un mantenimiento en proceso; finalícelo o cancélelo primero`,
      );
    }
    if (nextStatus === VehicleStatus.INACTIVE) {
      await this.assertWithoutActiveMaintenances(vehicle);
    }
  }

  private async assertWithoutActiveMaintenances(vehicle: Vehicle): Promise<void> {
    const hasActiveMaintenances = await this.maintenances.existsBy({
      vehicle: { id: vehicle.id },
      status: In([...ACTIVE_MAINTENANCE_STATUSES]),
    });
    if (hasActiveMaintenances) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} tiene mantenimientos programados o en proceso`,
      );
    }
  }

  private async findById(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicles.findOneBy({ id });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }
}
