import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { UserRole } from '../auth/role.enum.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { User } from '../auth/user.entity.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceStatus } from './maintenance-status.enum.js';
import { MaintenanceService } from './maintenance.service.js';

describe('MaintenanceService', () => {
  it('rejects an invalid scheduled interval before opening a transaction', async () => {
    const transaction = vi.fn();
    const service = new MaintenanceService(
      { transaction } as unknown as DataSource,
      {} as Repository<never>,
    );

    await expect(
      service.create({
        type: 'PREVENTIVE',
        description: 'Cambio preventivo de aceite',
        mileage: 1000,
        scheduledAt: '2026-11-02T15:00:00.000Z',
        scheduledEndAt: '2026-11-02T15:00:00.000Z',
        vehicleId: 'b6f83a26-e64b-4883-9c89-53591c2f102f',
        mechanicId: 'd2f73bd3-cb34-4f90-bd7a-97679a913801',
        workshopId: '3d1c1c90-560f-41a3-b7d7-f299a7a5a55a',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it.each(['vehicle', 'mechanic'] as const)(
    'rejects starting a maintenance when the same %s already has one in progress',
    async (resource) => {
      const currentMaintenance = {
        id: 'maintenance-current',
        vehicleId: 'vehicle-1',
        mechanicId: 'mechanic-1',
        scheduledAt: new Date('2026-11-02T15:00:00.000Z'),
        scheduledEndAt: new Date('2026-11-02T16:00:00.000Z'),
        status: MaintenanceStatus.SCHEDULED,
      };
      const conflictingMaintenance = { id: 'maintenance-other' };
      const queryResults = [
        currentMaintenance,
        resource === 'vehicle' ? conflictingMaintenance : null,
        resource === 'mechanic' ? conflictingMaintenance : null,
      ];
      let queryIndex = 0;
      const maintenanceRepository = {
        findOneBy: vi.fn().mockResolvedValue(currentMaintenance),
        createQueryBuilder: vi.fn(() => {
          const result = queryResults[queryIndex++];
          const queryBuilder = {
            setLock: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getOne: vi.fn().mockResolvedValue(result),
          };
          return queryBuilder;
        }),
        save: vi.fn(),
      };
      const vehicleRepository = {
        findOne: vi.fn().mockResolvedValue({ id: 'vehicle-1', plate: 'ABC123' }),
        save: vi.fn(),
      };
      const mechanicRepository = {
        findOne: vi.fn().mockResolvedValue({ id: 'mechanic-1', userId: null }),
      };
      const userRepository = { findOneBy: vi.fn() };
      const repositories = new Map([
        [Maintenance, maintenanceRepository],
        [Vehicle, vehicleRepository],
        [Mechanic, mechanicRepository],
        [User, userRepository],
      ]);
      const transaction = vi.fn(async (callback) =>
        callback({
          getRepository: (entity: Function) => repositories.get(entity),
        } as unknown as EntityManager),
      );
      const service = new MaintenanceService(
        { transaction } as unknown as DataSource,
        { findOne: vi.fn() } as unknown as Repository<Maintenance>,
      );

      await expect(
        service.updateStatus(
          currentMaintenance.id,
          { status: MaintenanceStatus.IN_PROGRESS },
          { userId: 'admin-1', email: 'admin@example.com', role: UserRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(vehicleRepository.save).not.toHaveBeenCalled();
      expect(maintenanceRepository.save).not.toHaveBeenCalled();
    },
  );

  it('does not allow a technician to update a maintenance assigned to another user', async () => {
    const maintenance = {
      id: 'maintenance-current',
      vehicleId: 'vehicle-1',
      mechanicId: 'mechanic-1',
      status: MaintenanceStatus.SCHEDULED,
    };
    const mechanicRepository = {
      findOne: vi.fn().mockResolvedValue({ userId: 'technician-owner' }),
    };
    const maintenanceRepository = {
      findOneBy: vi.fn().mockResolvedValue(maintenance),
    };
    const repositories = new Map([
      [Maintenance, maintenanceRepository],
      [Vehicle, { findOne: vi.fn().mockResolvedValue({ id: 'vehicle-1' }) }],
      [Mechanic, mechanicRepository],
      [User, { findOneBy: vi.fn().mockResolvedValue({ id: 'technician-owner' }) }],
    ]);
    const transaction = vi.fn(async (callback) =>
      callback({
        getRepository: (entity: Function) => repositories.get(entity),
      } as unknown as EntityManager),
    );
    const service = new MaintenanceService(
      { transaction } as unknown as DataSource,
      {} as Repository<Maintenance>,
    );

    await expect(
      service.updateStatus(
        maintenance.id,
        { status: MaintenanceStatus.CANCELLED },
        { userId: 'different-technician', email: 'tech@example.com', role: UserRole.TECHNICIAN },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    [MaintenanceStatus.SCHEDULED, 'AVAILABLE', 'AVAILABLE'],
    [MaintenanceStatus.IN_PROGRESS, 'IN_MAINTENANCE', 'AVAILABLE'],
  ] as const)(
    'keeps the correct vehicle state when cancelling a %s maintenance',
    async (initialStatus, initialVehicleStatus, expectedVehicleStatus) => {
      const maintenance = {
        id: 'maintenance-current',
        vehicleId: 'vehicle-1',
        mechanicId: 'mechanic-1',
        scheduledAt: new Date('2026-11-02T15:00:00.000Z'),
        scheduledEndAt: new Date('2026-11-02T16:00:00.000Z'),
        status: initialStatus,
      };
      const vehicle = {
        id: 'vehicle-1',
        plate: 'ABC123',
        status: initialVehicleStatus,
      };
      const transactionMaintenanceRepository = {
        findOneBy: vi.fn().mockResolvedValue(maintenance),
        createQueryBuilder: vi.fn(() => ({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(maintenance),
        })),
        save: vi.fn().mockImplementation(async (entity) => entity),
      };
      const vehicleRepository = {
        findOne: vi.fn().mockResolvedValue(vehicle),
        save: vi.fn().mockImplementation(async (entity) => entity),
      };
      const repositories = new Map([
        [Maintenance, transactionMaintenanceRepository],
        [Vehicle, vehicleRepository],
        [Mechanic, { findOne: vi.fn().mockResolvedValue({ userId: null }) }],
        [User, { findOneBy: vi.fn() }],
      ]);
      const transaction = vi.fn(async (callback) =>
        callback({
          getRepository: (entity: Function) => repositories.get(entity),
        } as unknown as EntityManager),
      );
      const service = new MaintenanceService(
        { transaction } as unknown as DataSource,
        { findOne: vi.fn().mockResolvedValue(maintenance) } as unknown as Repository<Maintenance>,
      );

      await service.updateStatus(
        maintenance.id,
        { status: MaintenanceStatus.CANCELLED },
        { userId: 'admin-1', email: 'admin@example.com', role: UserRole.ADMIN },
      );

      expect(vehicle.status).toBe(expectedVehicleStatus);
      expect(vehicleRepository.save).toHaveBeenCalledWith(vehicle);
      expect(transactionMaintenanceRepository.save).toHaveBeenCalledWith(maintenance);
    },
  );
});