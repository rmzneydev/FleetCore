import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { VehiclesService } from './vehicles.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../auth/role.enum.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses, ApiEnvelopeResponse } from '../common/swagger/api-responses.decorator.js';

@Controller('vehicles')
@ApiTags('Vehicles')
@ApiBearerAuth()
@ApiCommonErrorResponses()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un vehículo (ADMIN)' })
  @ApiEnvelopeResponse(201, 'Vehículo registrado; requiere rol ADMIN')
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Lista de vehículos')
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('plate/:plate')
  @ApiOperation({ summary: 'Consultar vehículo por placa (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Vehículo encontrado')
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar vehículo por ID (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Vehículo encontrado')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un vehículo (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Vehículo actualizado; requiere rol ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inactivar un vehículo (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Vehículo inactivado; requiere rol ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id);
  }
}
