import { ForbiddenException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

describe('RolesGuard', () => {
  it('allows the request when the user has one of the required roles', () => {
    const getAllAndOverride = jest.fn().mockReturnValue(['ADMIN']);
    const reflector = { getAllAndOverride } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws for a user without the required role', () => {
    const getAllAndOverride = jest.fn().mockReturnValue(['ADMIN']);
    const reflector = { getAllAndOverride } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'TECHNICIAN' } }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [context.getHandler(), context.getClass()]);
  });

  it('lets requests through when no roles metadata is configured', () => {
    const getAllAndOverride = jest.fn().mockReturnValue(undefined);
    const reflector = { getAllAndOverride } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'TECHNICIAN' } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
