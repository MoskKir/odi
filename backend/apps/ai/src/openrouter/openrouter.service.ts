import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { SystemSettingEntity } from '@app/database';
import {
  OpenRouterRequest,
  OpenRouterResponse,
  OpenRouterMessage,
  OpenRouterStreamChunk,
} from './openrouter.types';

export const LLM_SETTINGS_KEYS = {
  USE_LOCAL: 'llm.useLocal',
  LOCAL_BASE_URL: 'llm.localBaseUrl',
  LOCAL_MODEL: 'llm.localModel',
} as const;

interface LlmConfig {
  useLocal: boolean;
  localBaseUrl: string;
  localModel: string | null;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly remoteClient: AxiosInstance;
  private readonly maxRetries = 3;
  private cachedConfig: { value: LlmConfig; expiresAt: number } | null = null;
  private readonly cacheTtlMs = 3000;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SystemSettingEntity)
    private readonly settingsRepo: Repository<SystemSettingEntity>,
  ) {
    const baseURL = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    this.remoteClient = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://odi.app',
        'X-Title': 'ODI Platform',
      },
      timeout: 30000,
    });
  }

  private async loadLlmConfig(): Promise<LlmConfig> {
    if (this.cachedConfig && this.cachedConfig.expiresAt > Date.now()) {
      return this.cachedConfig.value;
    }
    const defaults: LlmConfig = {
      useLocal: false,
      localBaseUrl: this.configService.get<string>(
        'LOCAL_LLM_BASE_URL',
        'http://127.0.0.1:1234/v1',
      ),
      localModel: null,
    };
    try {
      const rows = await this.settingsRepo.find({
        where: [
          { key: LLM_SETTINGS_KEYS.USE_LOCAL },
          { key: LLM_SETTINGS_KEYS.LOCAL_BASE_URL },
          { key: LLM_SETTINGS_KEYS.LOCAL_MODEL },
        ],
      });
      for (const row of rows) {
        if (row.key === LLM_SETTINGS_KEYS.USE_LOCAL) {
          defaults.useLocal = row.value === true || row.value === 'true';
        } else if (row.key === LLM_SETTINGS_KEYS.LOCAL_BASE_URL && row.value) {
          defaults.localBaseUrl = String(row.value);
        } else if (row.key === LLM_SETTINGS_KEYS.LOCAL_MODEL && row.value) {
          defaults.localModel = String(row.value);
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to load LLM settings, using defaults: ${(e as Error).message}`);
    }
    this.cachedConfig = { value: defaults, expiresAt: Date.now() + this.cacheTtlMs };
    return defaults;
  }

  /** Invalidate the in-memory settings cache (call after settings update) */
  invalidateConfigCache() {
    this.cachedConfig = null;
  }

  private buildLocalClient(baseURL: string): AxiosInstance {
    return axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    });
  }

  async complete(params: {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const cfg = await this.loadLlmConfig();
    const client = cfg.useLocal
      ? this.buildLocalClient(cfg.localBaseUrl)
      : this.remoteClient;
    const model = cfg.useLocal && cfg.localModel ? cfg.localModel : params.model;

    const request: OpenRouterRequest = {
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await client.post<OpenRouterResponse>(
          '/chat/completions',
          request,
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenRouter');
        }

        return content;
      } catch (err) {
        const error = err as any;
        const status = error.httpStatus ?? error.response?.status;
        this.logger.warn(
          `OpenRouter attempt ${attempt}/${this.maxRetries} failed (status=${status}): ${error.message}`,
        );

        // Don't retry client errors (4xx) — they won't succeed on retry
        if ((status && status >= 400 && status < 500) || attempt === this.maxRetries) {
          throw new Error(
            `OpenRouter request failed: ${error.message}`,
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt),
        );
      }
    }
    throw new Error('OpenRouter request failed: exhausted retries');
  }

  async *completeStream(params: {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  }): AsyncGenerator<string, void, unknown> {
    const cfg = await this.loadLlmConfig();
    const client = cfg.useLocal
      ? this.buildLocalClient(cfg.localBaseUrl)
      : this.remoteClient;
    const model = cfg.useLocal && cfg.localModel ? cfg.localModel : params.model;

    const request: OpenRouterRequest & { stream: boolean } = {
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      stream: true,
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await client.post(
          '/chat/completions',
          request,
          {
            responseType: 'stream',
            timeout: 60000,
            validateStatus: () => true, // don't throw on 4xx/5xx — we read the stream ourselves
            signal: params.signal,
          },
        );

        // If non-2xx, read the error body from the stream
        if (response.status >= 400) {
          let errorBody = '';
          for await (const chunk of response.data) {
            errorBody += chunk.toString();
          }
          const err = new Error(
            `OpenRouter returned ${response.status}: ${errorBody}`,
          ) as any;
          err.httpStatus = response.status;
          throw err;
        }

        // When abort signal fires, destroy the underlying stream immediately
        if (params.signal) {
          const nodeStream = response.data;
          const onAbort = () => nodeStream.destroy();
          params.signal.addEventListener('abort', onAbort, { once: true });
        }

        let buffer = '';

        for await (const rawChunk of response.data) {
          if (params.signal?.aborted) return;
          buffer += rawChunk.toString();

          const lines = buffer.split('\n');
          // Keep the last (possibly incomplete) line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') return;

            try {
              const chunk: OpenRouterStreamChunk = JSON.parse(jsonStr);
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Process any remaining data left in the buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr !== '[DONE]') {
              try {
                const chunk: OpenRouterStreamChunk = JSON.parse(jsonStr);
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch {
                // skip malformed chunk
              }
            }
          }
        }
        return;
      } catch (err) {
        const error = err as any;
        const status = error.httpStatus ?? error.response?.status;
        let detail = '';
        try {
          const respData = error.response?.data;
          if (typeof respData === 'string') {
            detail = respData;
          } else if (respData && typeof respData.read !== 'function') {
            detail = JSON.stringify(respData);
          } else {
            detail = `status=${status ?? 'unknown'}`;
          }
        } catch {
          detail = `status=${status ?? 'unknown'}`;
        }
        this.logger.warn(
          `OpenRouter stream attempt ${attempt}/${this.maxRetries} failed: ${error.message} | ${detail}`,
        );
        this.logger.warn(
          `Request was: model=${request.model}, messages=${request.messages.length}, temp=${request.temperature}`,
        );

        // Don't retry client errors (4xx) — they won't succeed on retry
        if ((status && status >= 400 && status < 500) || attempt === this.maxRetries) {
          throw new Error(
            `OpenRouter stream failed: ${error.message} | ${detail}`,
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt),
        );
      }
    }
  }
}
