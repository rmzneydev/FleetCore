import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrorResponses, ApiEnvelopeResponse } from '../common/swagger/api-responses.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { UserRole } from '../auth/role.enum.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { MaintenanceService } from './maintenance.service.js';

@Controller('maintenances')
@ApiTags('Maintenances')
@ApiBearerAuth()
@ApiCommonErrorResponses()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Programar un mantenimiento (ADMIN)' })
  @ApiEnvelopeResponse(201, 'Mantenimiento programado; requiere rol ADMIN')
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.maintenanceService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Lista de mantenimientos con vehículo, mecánico y taller; requiere rol ADMIN')
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get('active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos programados y en proceso (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Mantenimientos programados y en proceso')
  findActive() {
    return this.maintenanceService.findActive();
  }

  @Get('audit')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar la auditoría de cambios de estado de todos los mantenimientos (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Cambios de estado, del más reciente al más antiguo, con el usuario que los hizo')
  findAuditLog() {
    return this.maintenanceService.findAuditLog();
  }

  @Get('my')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Listar mantenimientos asignados al técnico autenticado' })
  @ApiEnvelopeResponse(200, 'Mantenimientos del técnico autenticado')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.maintenanceService.findMine(user.userId);
  }

  @Get('vehicle/:id/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar historial completado/cancelado de un vehículo (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Historial completado y cancelado del vehículo')
  findVehicleHistory(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findVehicleHistory(id);
  }

  @Get('vehicle/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos de un vehículo (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Mantenimientos asociados al vehículo')
  findByVehicle(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findByVehicle(id);
  }

  @Get('mechanic/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos asignados a un mecánico (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Mantenimientos asociados al mecánico')
  findByMechanic(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findByMechanic(id);
  }

  @Get(':id/audit')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar la auditoría de cambios de estado de un mantenimiento (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Cambios de estado del mantenimiento en orden cronológico')
  findMaintenanceAuditLog(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findMaintenanceAuditLog(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Cambiar estado y registrar cierre del mantenimiento',
    description:
      'ADMIN puede actualizar cualquier mantenimiento. TECHNICIAN solo puede actualizar los asignados a su cuenta. Transiciones permitidas: SCHEDULED a IN_PROGRESS o CANCELLED; IN_PROGRESS a COMPLETED o CANCELLED. Para COMPLETED se requieren workPerformed, finalCost, finishedAt y finalMileage.',
  })
  @ApiEnvelopeResponse(200, 'Estado actualizado; requiere rol ADMIN o TECHNICIAN asignado al mantenimiento')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenanceService.updateStatus(id, dto, user);
  }
}