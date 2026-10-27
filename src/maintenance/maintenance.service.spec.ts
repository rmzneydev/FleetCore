import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { UserRole } from '../auth/role.enum.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { User } from '../auth/user.entity.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity.js';
import { MaintenanceStatus } from './maintenance-status.enum.js';
import { MaintenanceService } from './maintenance.service.js';

describe('MaintenanceService', () => {
  it('rejects an invalid scheduled interval before opening a transaction', async () => {
    const transaction = jest.fn();
    const service = new MaintenanceService(
      { transaction } as unknown as DataSource,
      {} as Repository<never>,
      {} as Repository<never>,
    );

    await expect(
      service.create({
        type: 'PREVENTIVE',
        description: 'Cambio preventivo de aceite',
        mileage: 1000,
        scheduledAt: '2026-11-02T15:00:00.000Z',
        scheduledEndAt: '2026-11-02T15:00:00.000Z',
        vehicleId: 1,
        mechanicId: 1,
        workshopId: 1,
      }, { userId: 1, email: 'admin@example.com', role: UserRole.ADMIN }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it.each(['vehicle', 'mechanic'] as const)(
    'rejects starting a maintenance when the same %s already has one in progress',
    async (resource) => {
      const currentMaintenance = {
        id: 10,
        vehicleId: 1,
        mechanicId: 1,
        scheduledAt: new Date('2026-11-02T15:00:00.000Z'),
        scheduledEndAt: new Date('2026-11-02T16:00:00.000Z'),
        status: MaintenanceStatus.SCHEDULED,
      };
      const conflictingMaintenance = { id: 11 };
      const queryResults = [
        currentMaintenance,
        resource === 'vehicle' ? conflictingMaintenance : null,
        resource === 'mechanic' ? conflictingMaintenance : null,
      ];
      let queryIndex = 0;
      const maintenanceRepository = {
        findOneBy: jest.fn().mockResolvedValue(currentMaintenance),
        createQueryBuilder: jest.fn(() => {
          const result = queryResults[queryIndex++];
          const queryBuilder = {
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(result),
          };
          return queryBuilder;
        }),
        save: jest.fn(),
      };
      const vehicleRepository = {
        findOne: jest.fn().mockResolvedValue({ id: 1, plate: 'ABC123' }),
        save: jest.fn(),
      };
      const mechanicRepository = {
        findOne: jest.fn().mockResolvedValue({ id: 1, userId: null }),
      };
      const userRepository = { findOneBy: jest.fn() };
      const repositories = new Map([
        [Maintenance, maintenanceRepository],
        [Vehicle, vehicleRepository],
        [Mechanic, mechanicRepository],
        [User, userRepository],
      ]);
      const transaction = jest.fn(async (callback) =>
        callback({
          getRepository: (entity: Function) => repositories.get(entity),
        } as unknown as EntityManager),
      );
      const service = new MaintenanceService(
        { transaction } as unknown as DataSource,
        { findOne: jest.fn() } as unknown as Repository<Maintenance>,
        {} as Repository<MaintenanceStatusLog>,
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
      id: 10,
      vehicleId: 1,
      mechanicId: 1,
      status: MaintenanceStatus.SCHEDULED,
    };
    const mechanicRepository = {
      findOne: jest.fn().mockResolvedValue({ userId: 'technician-owner' }),
    };
    const maintenanceRepository = {
      findOneBy: jest.fn().mockResolvedValue(maintenance),
    };
    const repositories = new Map([
      [Maintenance, maintenanceRepository],
      [Vehicle, { findOne: jest.fn().mockResolvedValue({ id: 1 }) }],
      [Mechanic, mechanicRepository],
      [User, { findOneBy: jest.fn().mockResolvedValue({ id: 'technician-owner' }) }],
    ]);
    const transaction = jest.fn(async (callback) =>
      callback({
        getRepository: (entity: Function) => repositories.get(entity),
      } as unknown as EntityManager),
    );
    const service = new MaintenanceService(
      { transaction } as unknown as DataSource,
      {} as Repository<Maintenance>,
      {} as Repository<MaintenanceStatusLog>,
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
        id: 10,
        vehicleId: 1,
        mechanicId: 1,
        scheduledAt: new Date('2026-11-02T15:00:00.000Z'),
        scheduledEndAt: new Date('2026-11-02T16:00:00.000Z'),
        status: initialStatus,
      };
      const vehicle = {
        id: 1,
        plate: 'ABC123',
        status: initialVehicleStatus,
      };
      const transactionMaintenanceRepository = {
        findOneBy: jest.fn().mockResolvedValue(maintenance),
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(maintenance),
        })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };
      const vehicleRepository = {
        findOne: jest.fn().mockResolvedValue(vehicle),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };
      const statusLogRepository = {
        create: jest.fn((entity) => entity),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };
      const repositories = new Map<Function, unknown>([
        [Maintenance, transactionMaintenanceRepository],
        [Vehicle, vehicleRepository],
        [Mechanic, { findOne: jest.fn().mockResolvedValue({ userId: null }) }],
        [User, { findOneBy: jest.fn() }],
        [MaintenanceStatusLog, statusLogRepository],
      ]);
      const transaction = jest.fn(async (callback) =>
        callback({
          getRepository: (entity: Function) => repositories.get(entity),
        } as unknown as EntityManager),
      );
      const service = new MaintenanceService(
        { transaction } as unknown as DataSource,
        { findOne: jest.fn().mockResolvedValue(maintenance) } as unknown as Repository<Maintenance>,
        {} as Repository<MaintenanceStatusLog>,
      );

      await service.updateStatus(
        maintenance.id,
        { status: MaintenanceStatus.CANCELLED },
        { userId: 1, email: 'admin@example.com', role: UserRole.ADMIN },
      );

      expect(statusLogRepository.save).toHaveBeenCalledWith({
        maintenance: { id: maintenance.id },
        fromStatus: initialStatus,
        toStatus: MaintenanceStatus.CANCELLED,
        changedBy: { id: 1 },
      });
      expect(vehicle.status).toBe(expectedVehicleStatus);
      expect(vehicleRepository.save).toHaveBeenCalledWith(vehicle);
      expect(transactionMaintenanceRepository.save).toHaveBeenCalledWith(maintenance);
    },
  );
});