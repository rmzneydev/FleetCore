import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AdminCreateUserDto } from './dto/admin-create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthenticatedUser } from './jwt-payload.interface.js';
import { UserRole } from './role.enum.js';
import { AuthService } from './auth.service.js';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario con rol ADMIN o TECHNICIAN' })
  @ApiCreatedResponse({ description: 'Usuario registrado y token emitido' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto, dto.role);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiOkResponse({ description: 'Autenticación correcta' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario con cualquier rol (ADMIN)' })
  @ApiCreatedResponse({ description: 'Usuario creado' })
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.authService.createUser(dto, dto.role);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil del usuario' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }
}