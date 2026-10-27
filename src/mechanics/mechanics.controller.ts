import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { MechanicsService } from './mechanics.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../auth/role.enum.js';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('mechanics')
@ApiTags('Mechanics')
@ApiBearerAuth()
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar un mecánico (ADMIN)' })
  @ApiCreatedResponse({ description: 'Mecánico registrado' })
  create(@Body() createMechanicDto: CreateMechanicDto) {
    return this.mechanicsService.create(createMechanicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mecánicos' })
  @ApiOkResponse({ description: 'Lista de mecánicos' })
  findAll() {
    return this.mechanicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar mecánico por ID' })
  @ApiOkResponse({ description: 'Mecánico encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un mecánico (ADMIN)' })
  @ApiOkResponse({ description: 'Mecánico actualizado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMechanicDto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, updateMechanicDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Inactivar un mecánico (ADMIN)' })
  @ApiOkResponse({ description: 'Mecánico inactivado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.remove(id);
  }
}
