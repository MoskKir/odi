import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const KEYS = {
  USE_LOCAL: 'llm.useLocal',
  LOCAL_BASE_URL: 'llm.localBaseUrl',
  LOCAL_MODEL: 'llm.localModel',
} as const;

interface LlmSettingsDto {
  useLocal?: boolean;
  localBaseUrl?: string;
  localModel?: string | null;
}

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('odi.game.settings-get');
    this.kafkaClient.subscribeToResponseOf('odi.game.settings-update');
    await this.kafkaClient.connect();
  }

  @Get('settings')
  async getSettings() {
    const all: Record<string, any> = await lastValueFrom(
      this.kafkaClient.send('odi.game.settings-get', {}),
    );
    return {
      useLocal: all?.[KEYS.USE_LOCAL] === true || all?.[KEYS.USE_LOCAL] === 'true',
      localBaseUrl: all?.[KEYS.LOCAL_BASE_URL] ?? 'http://127.0.0.1:1234/v1',
      localModel: all?.[KEYS.LOCAL_MODEL] ?? null,
    };
  }

  @Put('settings')
  async updateSettings(@Body() dto: LlmSettingsDto) {
    const payload: Record<string, any> = {};
    if (dto.useLocal !== undefined) payload[KEYS.USE_LOCAL] = !!dto.useLocal;
    if (dto.localBaseUrl !== undefined) payload[KEYS.LOCAL_BASE_URL] = dto.localBaseUrl;
    if (dto.localModel !== undefined) payload[KEYS.LOCAL_MODEL] = dto.localModel;

    await lastValueFrom(
      this.kafkaClient.send('odi.game.settings-update', payload),
    );
    return this.getSettings();
  }
}
