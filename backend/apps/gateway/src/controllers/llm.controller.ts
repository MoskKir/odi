import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const KEYS = {
  USE_LOCAL: 'llm.useLocal',
  LOCAL_BASE_URL: 'llm.localBaseUrl',
  LOCAL_MODEL: 'llm.localModel',
  PROVIDER: 'llm.provider',
  OLLAMA_BASE_URL: 'llm.ollamaBaseUrl',
} as const;

type LlmProvider = 'openrouter' | 'local' | 'mistral' | 'ollama';

interface LlmSettingsDto {
  provider?: LlmProvider;
  localBaseUrl?: string;
  localModel?: string | null;
  ollamaBaseUrl?: string;
  /** @deprecated use provider */
  useLocal?: boolean;
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
    this.kafkaClient.subscribeToResponseOf('odi.ai.ollama-models');
    await this.kafkaClient.connect();
  }

  @Get('settings')
  async getSettings() {
    const all: Record<string, any> = await lastValueFrom(
      this.kafkaClient.send('odi.game.settings-get', {}),
    );
    const legacyUseLocal =
      all?.[KEYS.USE_LOCAL] === true || all?.[KEYS.USE_LOCAL] === 'true';
    const provider: LlmProvider =
      (all?.[KEYS.PROVIDER] as LlmProvider) ??
      (legacyUseLocal ? 'local' : 'openrouter');
    return {
      provider,
      useLocal: provider === 'local',
      localBaseUrl: all?.[KEYS.LOCAL_BASE_URL] ?? 'http://127.0.0.1:1234/v1',
      localModel: all?.[KEYS.LOCAL_MODEL] ?? null,
      ollamaBaseUrl: all?.[KEYS.OLLAMA_BASE_URL] ?? 'http://localhost:11434/v1',
    };
  }

  @Put('settings')
  async updateSettings(@Body() dto: LlmSettingsDto) {
    const payload: Record<string, any> = {};

    if (dto.provider !== undefined) {
      payload[KEYS.PROVIDER] = dto.provider;
      // Keep legacy flag in sync for backward compat
      payload[KEYS.USE_LOCAL] = dto.provider === 'local';
    } else if (dto.useLocal !== undefined) {
      payload[KEYS.USE_LOCAL] = !!dto.useLocal;
      payload[KEYS.PROVIDER] = dto.useLocal ? 'local' : 'openrouter';
    }

    if (dto.localBaseUrl !== undefined) payload[KEYS.LOCAL_BASE_URL] = dto.localBaseUrl;
    if (dto.localModel !== undefined) payload[KEYS.LOCAL_MODEL] = dto.localModel;
    if (dto.ollamaBaseUrl !== undefined) payload[KEYS.OLLAMA_BASE_URL] = dto.ollamaBaseUrl;

    await lastValueFrom(
      this.kafkaClient.send('odi.game.settings-update', payload),
    );
    return this.getSettings();
  }

  @Get('models')
  async getOllamaModels() {
    try {
      const models: string[] = await lastValueFrom(
        this.kafkaClient.send('odi.ai.ollama-models', {}),
      );
      return { models };
    } catch {
      return { models: [] };
    }
  }
}
