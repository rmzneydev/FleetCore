import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { WorkshopsService } from './workshops.service.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../auth/role.enum.js';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('workshops')
@ApiTags('Workshops')
@ApiBearerAuth()
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un taller (ADMIN)' })
  @ApiCreatedResponse({ description: 'Taller registrado' })
  create(@Body() createWorkshopDto: CreateWorkshopDto) {
    return this.workshopsService.create(createWorkshopDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar talleres activos' })
  @ApiOkResponse({ description: 'Lista de talleres activos' })
  findAll() {
    return this.workshopsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar taller por UUID' })
  @ApiOkResponse({ description: 'Taller encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un taller (ADMIN)' })
  @ApiOkResponse({ description: 'Taller actualizado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateWorkshopDto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, updateWorkshopDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inactivar un taller (ADMIN)' })
  @ApiOkResponse({ description: 'Taller inactivado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshopsService.remove(id);
  }
}
