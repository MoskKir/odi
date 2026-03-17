import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS, RegisterDto, LoginDto } from '@app/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(KAFKA_TOPICS.AUTH.REGISTER)
  async register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern(KAFKA_TOPICS.AUTH.LOGIN)
  async login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(KAFKA_TOPICS.AUTH.VALIDATE_TOKEN)
  async validateToken(@Payload() data: { userId: string }) {
    return this.authService.validateToken(data.userId);
  }

  @MessagePattern('odi.auth.user-list')
  async listUsers(
    @Payload() data: { limit: number; offset: number; search?: string },
  ) {
    return this.authService.findAll(data);
  }

  @MessagePattern('odi.auth.user-update')
  async updateUser(@Payload() data: { id: string; [key: string]: any }) {
    const { id, ...dto } = data;
    return this.authService.updateUser(id, dto);
  }
}
