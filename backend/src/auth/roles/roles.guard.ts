import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: string; roles?: string[] } | undefined;

    const userRoles = (user?.roles?.length ? user.roles : user?.role ? [user.role] : [])
      .map((r) => String(r).toUpperCase());

    const needed = requiredRoles.map((r) => String(r).toUpperCase());

    return needed.some((r) => userRoles.includes(r));
  }
}