import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard.js';

function createContext(apiKey?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ header: () => apiKey }),
    }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  it('accepts a configured key from a comma-separated key list', () => {
    const config = { get: () => 'partner-one, partner-two' } as unknown as ConfigService;
    const guard = new ApiKeyGuard(config);

    expect(guard.canActivate(createContext('partner-two'))).toBe(true);
  });

  it.each([undefined, 'wrong-key'])('rejects a missing or invalid key: %s', (apiKey) => {
    const config = { get: () => 'partner-one,partner-two' } as unknown as ConfigService;
    const guard = new ApiKeyGuard(config);

    expect(() => guard.canActivate(createContext(apiKey))).toThrow(UnauthorizedException);
  });

  it('rejects requests when no keys are configured', () => {
    const config = { get: () => '' } as unknown as ConfigService;
    const guard = new ApiKeyGuard(config);

    expect(() => guard.canActivate(createContext('partner-one'))).toThrow(UnauthorizedException);
  });
});