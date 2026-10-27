import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { Repository } from 'typeorm';
import { Maintenance } from '../maintenance/entities/maintenance.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopStatus } from './workshop-status.enum.js';
import { WorkshopsService } from './workshops.service.js';

describe('WorkshopsService', () => {
  function createService(workshop: Partial<Workshop> | null, hasActiveMaintenances = false) {
    const workshops = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(workshop && { id: 1, name: 'Taller Centro', ...workshop }),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };
    const maintenances = { existsBy: jest.fn().mockResolvedValue(hasActiveMaintenances) };
    const service = new WorkshopsService(
      workshops as unknown as Repository<Workshop>,
      maintenances as unknown as Repository<Maintenance>,
    );
    return { service, workshops };
  }

  it('lists only active workshops', async () => {
    const { service, workshops } = createService(null);

    await service.findAll();

    expect(workshops.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: WorkshopStatus.ACTIVE } }),
    );
  });

  it('returns 404 for a missing workshop', async () => {
    const { service } = createService(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects inactivating a workshop with pending maintenances', async () => {
    const { service, workshops } = createService({ status: WorkshopStatus.ACTIVE }, true);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.update(1, { status: WorkshopStatus.INACTIVE })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(workshops.save).not.toHaveBeenCalled();
  });

  it('inactivates and reactivates a workshop without pending maintenances', async () => {
    const { service } = createService({ status: WorkshopStatus.ACTIVE });
    await expect(service.remove(1)).resolves.toMatchObject({ status: WorkshopStatus.INACTIVE });

    const { service: inactiveService } = createService({ status: WorkshopStatus.INACTIVE });
    await expect(inactiveService.update(1, { status: WorkshopStatus.ACTIVE })).resolves.toMatchObject({
      status: WorkshopStatus.ACTIVE,
    });
  });
});
