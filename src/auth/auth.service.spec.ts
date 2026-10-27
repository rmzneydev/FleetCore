import { jest } from '@jest/globals';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { UserRole } from './role.enum.js';
import { User } from './user.entity.js';

describe('AuthService', () => {
  function createService() {
    const users = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((entity) => entity),
      save: jest.fn().mockImplementation(async (entity) => ({ id: 1, ...(entity as object) })),
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    const config = { get: jest.fn((_key: string, fallback: string) => fallback) };
    const service = new AuthService(
      users as unknown as Repository<User>,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
    return { service, users };
  }

  it('always registers public sign-ups as TECHNICIAN, even if a role is sent', async () => {
    const { service, users } = createService();

    const result = await service.register({
      email: ' New.Tech@FleetCore.com ',
      password: 'StrongPass123',
      role: UserRole.ADMIN,
    } as never);

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new.tech@fleetcore.com', role: UserRole.TECHNICIAN }),
    );
    expect(result.user.role).toBe(UserRole.TECHNICIAN);
    expect(result.accessToken).toBe('signed-token');
  });

  it('lets an administrator create an ADMIN account', async () => {
    const { service, users } = createService();

    const user = await service.createUser(
      { email: 'boss@fleetcore.com', password: 'StrongPass123' },
      UserRole.ADMIN,
    );

    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.ADMIN }));
    expect(user.role).toBe(UserRole.ADMIN);
  });
});
