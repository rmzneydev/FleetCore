import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

type UserWithRoles = { role?: string; roles?: string[] };
type RequestWithUser = Request & { user?: UserWithRoles };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Sin @Roles no se impone autorización adicional; JwtAuthGuard sigue protegiendo la ruta.
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const user = context.switchToHttp().getRequest<RequestWithUser>().user;
    const userRoles = [user?.role, ...(user?.roles ?? [])].filter(
      (role): role is string => Boolean(role),
    );
    // Basta con que el usuario tenga uno de los roles declarados para la ruta.
    if (roles.some((role) => userRoles.includes(role))) return true;

    throw new ForbiddenException('No tienes permisos para este recurso');
  }
}