import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: any = context.switchToWs().getClient();

    const token =
      client?.handshake?.auth?.token ||
      this.getBearerToken(client?.handshake?.headers?.authorization) ||
      client?.handshake?.query?.token;

    if (!token || typeof token !== 'string') {
      throw new WsException('No autorizado: falta token');
    }

    try {
      const payload: any = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });

      const userId = Number(payload?.sub);
      if (!userId) throw new WsException('No autorizado: token invalido');

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new WsException('No autorizado: usuario no existe');

      client.data = client.data || {};
      client.data.user = { id: user.id, role: user.role, email: user.email };

      return true;
    } catch {
      throw new WsException('No autorizado: token invalido');
    }
  }

  private getBearerToken(authorization?: string): string | null {
    if (!authorization) return null;
    const [type, token] = authorization.split(' ');
    if (!type || type.toLowerCase() !== 'bearer') return null;
    return token || null;
  }
}