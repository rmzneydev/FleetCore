import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { VehiclesService } from './vehicles.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../auth/role.enum.js';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('vehicles')
@ApiTags('Vehicles')
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un vehículo (ADMIN)' })
  @ApiCreatedResponse({ description: 'Vehículo registrado' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos' })
  @ApiOkResponse({ description: 'Lista de vehículos' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('plate/:plate')
  @ApiOperation({ summary: 'Consultar vehículo por placa' })
  @ApiOkResponse({ description: 'Vehículo encontrado' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar vehículo por UUID' })
  @ApiOkResponse({ description: 'Vehículo encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un vehículo (ADMIN)' })
  @ApiOkResponse({ description: 'Vehículo actualizado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inactivar un vehículo (ADMIN)' })
  @ApiOkResponse({ description: 'Vehículo inactivado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(id);
  }
}
