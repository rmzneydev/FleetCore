import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
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
});