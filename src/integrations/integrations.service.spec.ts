import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { MaintenanceStatus } from '../maintenance/maintenance-status.enum.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { VehicleStatus } from '../vehicles/vehicle-status.enum.js';
import { IntegrationsService } from './integrations.service.js';

describe('IntegrationsService', () => {
  it('returns only public vehicle fields and completed maintenance history', async () => {
    const vehicle = {
      id: 1,
      plate: 'ABC123',
      brand: 'Chevrolet',
      model: 'NPR',
      status: VehicleStatus.AVAILABLE,
    };
    const completedMaintenance = {
      id: 1,
      type: 'PREVENTIVE',
      status: MaintenanceStatus.COMPLETED,
      description: 'Cambio de aceite',
      mileage: 45000,
      finalCost: '350000.00',
      finishedAt: new Date('2026-09-15T16:30:00.000Z'),
      mechanic: { id: 1, name: 'Carlos Pérez', email: 'private@example.test' },
      workshop: { id: 1, name: 'Taller Norte', address: 'Dirección privada' },
    };
    const vehicles = { findOneBy: jest.fn().mockResolvedValue(vehicle) };
    const maintenances = { find: jest.fn().mockResolvedValue([completedMaintenance]) };
    const service = new IntegrationsService(
      vehicles as unknown as Repository<Vehicle>,
      maintenances as unknown as Repository<Maintenance>,
    );

    const result = await service.getVehicleMaintenanceHistory(' abc123 ');

    expect(vehicles.findOneBy).toHaveBeenCalledWith({ plate: 'ABC123' });
    expect(maintenances.find).toHaveBeenCalledWith({
      where: {
        vehicle: { id: 1 },
        status: MaintenanceStatus.COMPLETED,
      },
      relations: { mechanic: true, workshop: true },
      order: { finishedAt: 'DESC' },
    });
    expect(result).toEqual({
      vehicle: {
        id: 1,
        plate: 'ABC123',
        brand: 'Chevrolet',
        model: 'NPR',
        available: true,
      },
      maintenances: [
        {
          id: 1,
          type: 'PREVENTIVE',
          status: 'COMPLETED',
          description: 'Cambio de aceite',
          mileage: 45000,
          cost: '350000.00',
          finishedAt: completedMaintenance.finishedAt,
          mechanic: { id: 1, name: 'Carlos Pérez' },
          workshop: { id: 1, name: 'Taller Norte' },
        },
      ],
    });
  });

  it('returns not found for an unknown plate', async () => {
    const vehicles = { findOneBy: jest.fn().mockResolvedValue(null) };
    const maintenances = { find: jest.fn() };
    const service = new IntegrationsService(
      vehicles as unknown as Repository<Vehicle>,
      maintenances as unknown as Repository<Maintenance>,
    );

    await expect(service.getVehicleMaintenanceHistory('UNKNOWN')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(maintenances.find).not.toHaveBeenCalled();
  });
});