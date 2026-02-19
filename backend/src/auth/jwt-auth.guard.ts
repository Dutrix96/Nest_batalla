import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader) throw new UnauthorizedException('No token');

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Token invalido');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        roles: payload.role ? [payload.role] : [],
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }
}