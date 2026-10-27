import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // API_KEYS permite varias claves separadas por coma para integraciones distintas.
    const configuredKeys = this.config
      .get<string>('API_KEYS', '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
    const providedKey = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-api-key');

    // Se comparan buffers de igual longitud para evitar comparaciones sensibles al tiempo.
    const isValid = Boolean(
      providedKey &&
        configuredKeys.some((key) => {
          const expected = Buffer.from(key);
          const provided = Buffer.from(providedKey);
          return expected.length === provided.length && timingSafeEqual(expected, provided);
        }),
    );
    if (!isValid) throw new UnauthorizedException('API key inválida o ausente');
    return true;
  }
}