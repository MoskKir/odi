import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { KAFKA_TOPICS, RegisterDto, LoginDto, UpdatePreferencesDto } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.AUTH.REGISTER);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.AUTH.LOGIN);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.AUTH.VALIDATE_TOKEN);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.AUTH.GET_PREFERENCES);
    this.kafkaClient.subscribeToResponseOf(KAFKA_TOPICS.AUTH.UPDATE_PREFERENCES);
    await this.kafkaClient.connect();
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.AUTH.REGISTER, { ...dto }),
    );
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.AUTH.LOGIN, { ...dto }),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string; email: string; role: string }) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.AUTH.VALIDATE_TOKEN, {
        userId: user.id,
      }),
    );
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@CurrentUser() user: { id: string }) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.AUTH.GET_PREFERENCES, {
        userId: user.id,
      }),
    );
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.AUTH.UPDATE_PREFERENCES, {
        userId: user.id,
        preferences: { ...dto },
      }),
    );
  }
}
