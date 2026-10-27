import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function createHost() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/vehicles' }),
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
  }

  it('maps PostgreSQL unique constraint violations to conflict', () => {
    const { host, status, json } = createHost();
    const error = Object.assign(new Error('duplicate'), {
      driverError: { code: '23505' },
    });

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        path: '/vehicles',
      }),
    );
  });

  it('maps PostgreSQL foreign key violations to bad request', () => {
    const { host, status, json } = createHost();
    const error = Object.assign(new Error('foreign key'), {
      driverError: { code: '23503' },
    });

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
      }),
    );
  });
});