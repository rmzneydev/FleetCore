import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  it('wraps successful responses in a uniform success payload', async () => {
    const interceptor = new ResponseInterceptor();
    const result = await lastValueFrom(
      interceptor.intercept(
        {
          switchToHttp: () => ({
            getResponse: () => ({ statusCode: 201 }),
          }),
        } as any,
        {
          handle: () => of({ ok: true }),
        } as any,
      ),
    );

    expect(result).toEqual({
      success: true,
      statusCode: 201,
      data: { ok: true },
      timestamp: expect.any(String),
    });
  });
});
