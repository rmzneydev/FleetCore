import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type DatabaseError = Error & {
  code?: string;
  driverError?: { code?: string };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const databaseError = exception as DatabaseError;
    // TypeORM puede exponer el código PostgreSQL en el error raíz o dentro de driverError.
    const databaseCode = databaseError.code ?? databaseError.driverError?.code;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (databaseCode === '23505') {
      // Unique violation: el conflicto representa un valor que ya está registrado.
      statusCode = HttpStatus.CONFLICT;
      message = 'Ya existe un registro con esos datos únicos';
    } else if (databaseCode === '23503') {
      // Foreign key violation: se informa como referencia inválida, sin filtrar SQL interno.
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'La operación referencia un registro inexistente o relacionado';
    } else if (exception instanceof HttpException) {
      // Los errores HTTP conservan su código y mensaje; los errores inesperados quedan genéricos.
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] }).message ?? exception.message);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}