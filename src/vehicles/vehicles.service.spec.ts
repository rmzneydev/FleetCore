import { BadRequestException, ConflictException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehicleStatus } from './vehicle-status.enum.js';
import { VehiclesService } from './vehicles.service.js';

describe('VehiclesService', () => {
  function createService(vehicle: Partial<Vehicle>, hasActiveMaintenances = false) {
    const vehicles = {
      findOneBy: jest.fn().mockResolvedValue({ id: 1, plate: 'ABC123', ...vehicle }),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };
    const maintenances = { existsBy: jest.fn().mockResolvedValue(hasActiveMaintenances) };
    const service = new VehiclesService(
      vehicles as unknown as Repository<Vehicle>,
      maintenances as unknown as Repository<Maintenance>,
    );
    return { service, vehicles };
  }

  it('rejects setting IN_MAINTENANCE manually', async () => {
    const { service, vehicles } = createService({ status: VehicleStatus.AVAILABLE });

    await expect(service.update(1, { status: VehicleStatus.IN_MAINTENANCE })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(vehicles.save).not.toHaveBeenCalled();
  });

  it('rejects making a vehicle AVAILABLE while its maintenance is in progress', async () => {
    const { service, vehicles } = createService({ status: VehicleStatus.IN_MAINTENANCE });

    await expect(service.update(1, { status: VehicleStatus.AVAILABLE })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(vehicles.save).not.toHaveBeenCalled();
  });

  it('rejects inactivating a vehicle with scheduled or in-progress maintenances', async () => {
    const { service, vehicles } = createService({ status: VehicleStatus.AVAILABLE }, true);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(vehicles.save).not.toHaveBeenCalled();
  });

  it('inactivates a vehicle without pending maintenances and reactivates it later', async () => {
    const { service } = createService({ status: VehicleStatus.AVAILABLE });
    await expect(service.remove(1)).resolves.toMatchObject({ status: VehicleStatus.INACTIVE });

    const { service: inactiveService } = createService({ status: VehicleStatus.INACTIVE });
    await expect(inactiveService.update(1, { status: VehicleStatus.AVAILABLE })).resolves.toMatchObject({
      status: VehicleStatus.AVAILABLE,
    });
  });
});
