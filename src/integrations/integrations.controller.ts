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
            id: 'b6f83a26-e64b-4883-9c89-53591c2f102f',
            plate: 'ABC123',
            brand: 'Chevrolet',
            model: 'NPR',
            available: true,
          },
          maintenances: [
            {
              id: 'e312779f-ef56-4f17-8494-1404a9b131ef',
              type: 'PREVENTIVE',
              status: 'COMPLETED',
              description: 'Cambio de aceite y filtros',
              mileage: 45000,
              cost: '350000.00',
              finishedAt: '2026-09-15T16:30:00.000Z',
              mechanic: { id: '3e25ec77-b4d3-464c-9fbe-9f607d9c99f0', name: 'Carlos Pérez' },
              workshop: { id: '4c4a0f1b-df9b-4373-a27d-93125d6b77d8', name: 'Taller Norte' },
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