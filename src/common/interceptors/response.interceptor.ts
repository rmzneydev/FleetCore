import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, object> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<object> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      // Estandariza únicamente respuestas exitosas; las excepciones las procesa el filtro global.
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}