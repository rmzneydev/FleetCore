import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { MechanicsService } from './mechanics.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../auth/role.enum.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses, ApiEnvelopeResponse } from '../common/swagger/api-responses.decorator.js';

@Controller('mechanics')
@ApiTags('Mechanics')
@ApiBearerAuth()
@ApiCommonErrorResponses()
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un mecánico (ADMIN)' })
  @ApiEnvelopeResponse(201, 'Mecánico registrado; requiere rol ADMIN')
  create(@Body() createMechanicDto: CreateMechanicDto) {
    return this.mechanicsService.create(createMechanicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mecánicos (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Lista de mecánicos')
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar mecánico por ID (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Mecánico encontrado')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un mecánico (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Mecánico actualizado; requiere rol ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMechanicDto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, updateMechanicDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inactivar un mecánico (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Mecánico inactivado; requiere rol ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.remove(id);
  }
}
