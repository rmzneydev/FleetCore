import { AuthGuard } from '@nestjs/passport';
import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

describe('JwtAuthGuard', () => {
  it('allows public routes without calling Passport', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const canActivateSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');

    const result = await guard.canActivate({
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [expect.any(Object), expect.any(Object)]);
    expect(canActivateSpy).not.toHaveBeenCalled();
    canActivateSpy.mockRestore();
  });

  it('delegates to Passport for protected routes', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const canActivateSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockResolvedValue(true);

    const result = await guard.canActivate({
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any);

    expect(result).toBe(true);
    expect(canActivateSpy).toHaveBeenCalledTimes(1);
    canActivateSpy.mockRestore();
  });
});
