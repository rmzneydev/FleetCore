import { BadRequestException, ConflictException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { Repository } from 'typeorm';
import { UserRole } from '../auth/role.enum.js';
import { User } from '../auth/user.entity.js';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicStatus } from './mechanic-status.enum.js';
import { MechanicsService } from './mechanics.service.js';

describe('MechanicsService', () => {
  function createService(options: { linkedMechanicId?: number; hasActiveMaintenances?: boolean } = {}) {
    const mechanic = { id: 1, name: 'Carlos Pérez', status: MechanicStatus.ACTIVE, userId: 5 };
    const mechanics = {
      findOneBy: jest.fn().mockImplementation(async (where: { id?: number }) =>
        where.id !== undefined
          ? mechanic
          : options.linkedMechanicId !== undefined
            ? { id: options.linkedMechanicId }
            : null,
      ),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };
    const users = {
      findOneBy: jest.fn().mockResolvedValue({ id: 6, role: UserRole.TECHNICIAN }),
    };
    const maintenances = {
      existsBy: jest.fn().mockResolvedValue(options.hasActiveMaintenances ?? false),
    };
    const service = new MechanicsService(
      mechanics as unknown as Repository<Mechanic>,
      users as unknown as Repository<User>,
      maintenances as unknown as Repository<Maintenance>,
    );
    return { service, mechanics, users };
  }

  it('accepts an update that keeps the same technician account', async () => {
    const { service, users } = createService({ linkedMechanicId: 1 });

    await expect(service.update(1, { userId: 5, specialty: 'Frenos' })).resolves.toMatchObject({
      specialty: 'Frenos',
    });
    expect(users.findOneBy).not.toHaveBeenCalled();
  });

  it('rejects linking a technician account already used by another mechanic', async () => {
    const { service } = createService({ linkedMechanicId: 2 });

    await expect(service.update(1, { userId: 6 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inactivating a mechanic with pending maintenances', async () => {
    const { service, mechanics } = createService({ hasActiveMaintenances: true });

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.update(1, { status: MechanicStatus.INACTIVE })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mechanics.save).not.toHaveBeenCalled();
  });
});
