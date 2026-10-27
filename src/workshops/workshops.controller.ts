import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { WorkshopsService } from './workshops.service.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../auth/role.enum.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses, ApiEnvelopeResponse } from '../common/swagger/api-responses.decorator.js';

@Controller('workshops')
@ApiTags('Workshops')
@ApiBearerAuth()
@ApiCommonErrorResponses()
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un taller (ADMIN)' })
  @ApiEnvelopeResponse(201, 'Taller registrado; requiere rol ADMIN')
  create(@Body() createWorkshopDto: CreateWorkshopDto) {
    return this.workshopsService.create(createWorkshopDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar talleres activos (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Lista de talleres activos')
  findAll() {
    return this.workshopsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar taller por ID (ADMIN o TECHNICIAN)' })
  @ApiEnvelopeResponse(200, 'Taller encontrado')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un taller (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Taller actualizado; requiere rol ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateWorkshopDto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, updateWorkshopDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inactivar un taller (ADMIN)' })
  @ApiEnvelopeResponse(200, 'Taller inactivado; requiere rol ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.remove(id);
  }
}
