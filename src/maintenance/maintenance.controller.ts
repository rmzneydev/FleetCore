import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Programar un mantenimiento (ADMIN)' })
  @ApiCreatedResponse({ description: 'Mantenimiento programado' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos (ADMIN)' })
  @ApiOkResponse({ description: 'Lista de mantenimientos con vehículo, mecánico y taller' })
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get('active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos programados y en proceso (ADMIN)' })
  findActive() {
    return this.maintenanceService.findActive();
  }

  @Get('my')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Listar mantenimientos asignados al técnico autenticado' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.maintenanceService.findMine(user.userId);
  }

  @Get('vehicle/:id/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar historial completado/cancelado de un vehículo (ADMIN)' })
  findVehicleHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.findVehicleHistory(id);
  }

  @Get('vehicle/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos de un vehículo (ADMIN)' })
  findByVehicle(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.findByVehicle(id);
  }

  @Get('mechanic/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos asignados a un mecánico (ADMIN)' })
  findByMechanic(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.findByMechanic(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Cambiar estado y registrar cierre del mantenimiento' })
  @ApiOkResponse({ description: 'Estado del mantenimiento actualizado' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenanceService.updateStatus(id, dto, user);
  }
}