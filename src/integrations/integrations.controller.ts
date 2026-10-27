import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { IntegrationsService } from './integrations.service.js';

@Controller('integrations')
@ApiTags('Integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('vehicles/:plate/maintenances')
  @Public()
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Consultar historial de mantenimiento para una integración externa' })
  @ApiOkResponse({
    description: 'Vehículo y mantenimientos completados asociados',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          vehicle: {
            id: 1,
            plate: 'ABC123',
            brand: 'Chevrolet',
            model: 'NPR',
            available: true,
          },
          maintenances: [
            {
              id: 1,
              type: 'PREVENTIVE',
              status: 'COMPLETED',
              description: 'Cambio de aceite y filtros',
              mileage: 45000,
              cost: '350000.00',
              finishedAt: '2026-09-15T16:30:00.000Z',
              mechanic: { id: 1, name: 'Carlos Pérez' },
              workshop: { id: 1, name: 'Taller Norte' },
            },
          ],
        },
        timestamp: '2026-10-27T13:00:00.000Z',
      },
    },
  })
  getVehicleMaintenanceHistory(@Param('plate') plate: string) {
    return this.integrationsService.getVehicleMaintenanceHistory(plate);
  }
}