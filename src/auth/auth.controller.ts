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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrorResponses, ApiEnvelopeResponse } from '../common/swagger/api-responses.decorator.js';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario TECHNICIAN',
    description:
      'El registro público siempre crea cuentas TECHNICIAN. Las cuentas ADMIN solo las crea un administrador con POST /auth/users.',
  })
  @ApiCommonErrorResponses([400, 409, 500])
  @ApiEnvelopeResponse(201, 'Usuario registrado y token emitido')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiCommonErrorResponses([400, 401, 500])
  @ApiEnvelopeResponse(200, 'Autenticación correcta; devuelve JWT y usuario')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario con cualquier rol (ADMIN)' })
  @ApiCommonErrorResponses([400, 401, 403, 409, 500])
  @ApiEnvelopeResponse(201, 'Usuario creado; requiere rol ADMIN')
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.authService.createUser(dto, dto.role);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiCommonErrorResponses([401, 500])
  @ApiEnvelopeResponse(200, 'Perfil del usuario autenticado')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }
}