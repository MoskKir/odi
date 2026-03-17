import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { TokenPayloadDto } from '@app/common';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token =
      client.handshake?.auth?.token ||
      this.extractFromHeader(client.handshake?.headers?.authorization);

    if (!token) {
      throw new WsException('Missing authorization token');
    }

    try {
      const payload: TokenPayloadDto = await this.jwtService.verifyAsync(token);
      client.data = {
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        },
      };
    } catch {
      throw new WsException('Invalid or expired token');
    }

    return true;
  }

  private extractFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
