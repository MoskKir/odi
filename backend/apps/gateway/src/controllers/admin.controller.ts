import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { UserRole } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('odi.auth.user-list');
    this.kafkaClient.subscribeToResponseOf('odi.auth.user-update');
    this.kafkaClient.subscribeToResponseOf('odi.game.session-list-all');
    this.kafkaClient.subscribeToResponseOf('odi.game.session-force-update');
    this.kafkaClient.subscribeToResponseOf('odi.game.settings-get');
    this.kafkaClient.subscribeToResponseOf('odi.game.settings-update');
    await this.kafkaClient.connect();
  }

  @Get('users')
  async listUsers(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
  ) {
    return lastValueFrom(
      this.kafkaClient.send('odi.auth.user-list', {
        limit: limit || 20,
        offset: offset || 0,
        search,
      }),
    );
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.auth.user-update', { id, ...dto }),
    );
  }

  @Get('sessions')
  async listSessions(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
  ) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.session-list-all', {
        limit: limit || 20,
        offset: offset || 0,
        status,
      }),
    );
  }

  @Patch('sessions/:id')
  async updateSession(@Param('id') id: string, @Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.session-force-update', {
        sessionId: id,
        ...dto,
      }),
    );
  }

  @Get('settings')
  async getSettings() {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.settings-get', {}),
    );
  }

  @Put('settings')
  async updateSettings(@Body() dto: any) {
    return lastValueFrom(
      this.kafkaClient.send('odi.game.settings-update', dto),
    );
  }
}
