import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const successSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    statusCode: { type: 'integer', example: 200 },
    data: {
      oneOf: [
        { type: 'object', additionalProperties: true },
        { type: 'array', items: { type: 'object', additionalProperties: true } },
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
      ],
    },
    timestamp: { type: 'string', format: 'date-time', example: '2026-10-27T13:00:00.000Z' },
  },
  required: ['success', 'statusCode', 'data', 'timestamp'],
};

const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    statusCode: { type: 'integer', example: 400 },
    message: {
      oneOf: [
        { type: 'string', example: 'La solicitud contiene datos inválidos' },
        { type: 'array', items: { type: 'string' } },
      ],
    },
    path: { type: 'string', example: '/vehicles' },
    timestamp: { type: 'string', format: 'date-time', example: '2026-10-27T13:00:00.000Z' },
  },
  required: ['success', 'statusCode', 'message', 'path', 'timestamp'],
};

export function ApiEnvelopeResponse(statusCode: 200 | 201, description: string) {
  return ApiResponse({ status: statusCode, description, schema: successSchema });
}

const errorDescriptions: Record<400 | 401 | 403 | 404 | 409 | 500, string> = {
  400: 'Solicitud inválida o reglas de negocio incumplidas',
  401: 'Autenticación ausente, inválida o expirada',
  403: 'El usuario no tiene permisos para esta operación',
  404: 'El recurso solicitado no existe',
  409: 'Conflicto con un registro existente o una asignación',
  500: 'Error interno del servidor',
};

export function ApiCommonErrorResponses(
  statuses: Array<keyof typeof errorDescriptions> = [400, 401, 403, 404, 409, 500],
) {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({ status, description: errorDescriptions[status], schema: errorSchema }),
    ),
  );
}