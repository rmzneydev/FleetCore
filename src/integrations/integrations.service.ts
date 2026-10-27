import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenance/maintenance-status.enum.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/vehicle-status.enum.js';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(Maintenance) private readonly maintenances: Repository<Maintenance>,
  ) {}

  async getVehicleMaintenanceHistory(plate: string) {
    const vehicle = await this.vehicles.findOneBy({ plate: plate.trim().toUpperCase() });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const records = await this.maintenances.find({
      where: {
        vehicle: { id: vehicle.id },
        status: MaintenanceStatus.COMPLETED,
      },
      relations: { mechanic: true, workshop: true },
      order: { finishedAt: 'DESC' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: records.map((maintenance) => ({
        id: maintenance.id,
        type: maintenance.type,
        status: maintenance.status,
        description: maintenance.description,
        mileage: maintenance.mileage,
        cost: maintenance.finalCost === null ? null : Number(maintenance.finalCost),
        finishedAt: maintenance.finishedAt,
        mechanic: {
          id: maintenance.mechanic.id,
          name: maintenance.mechanic.name,
        },
        workshop: {
          id: maintenance.workshop.id,
          name: maintenance.workshop.name,
        },
      })),
    };
  }
}