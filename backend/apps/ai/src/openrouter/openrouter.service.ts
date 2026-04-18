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

export type LlmProvider = 'openrouter' | 'local' | 'mistral' | 'ollama';

export const LLM_SETTINGS_KEYS = {
  USE_LOCAL: 'llm.useLocal',
  LOCAL_BASE_URL: 'llm.localBaseUrl',
  LOCAL_MODEL: 'llm.localModel',
  PROVIDER: 'llm.provider',
  OLLAMA_BASE_URL: 'llm.ollamaBaseUrl',
} as const;

interface LlmConfig {
  provider: LlmProvider;
  localBaseUrl: string;
  localModel: string | null;
  ollamaBaseUrl: string;
  /** @deprecated use provider === 'local' */
  useLocal: boolean;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly remoteClient: AxiosInstance;
  private readonly mistralClient: AxiosInstance;
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

    const mistralApiKey = this.configService.get<string>('MISTRAL_API_KEY', '');
    this.mistralClient = axios.create({
      baseURL: 'https://api.mistral.ai/v1',
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  private async loadLlmConfig(): Promise<LlmConfig> {
    if (this.cachedConfig && this.cachedConfig.expiresAt > Date.now()) {
      return this.cachedConfig.value;
    }
    const defaults: LlmConfig = {
      provider: 'openrouter',
      useLocal: false,
      localBaseUrl: this.configService.get<string>(
        'LOCAL_LLM_BASE_URL',
        'http://127.0.0.1:1234/v1',
      ),
      localModel: null,
      ollamaBaseUrl: this.configService.get<string>(
        'OLLAMA_BASE_URL',
        'http://localhost:11434/v1',
      ),
    };
    try {
      const rows = await this.settingsRepo.find({
        where: [
          { key: LLM_SETTINGS_KEYS.USE_LOCAL },
          { key: LLM_SETTINGS_KEYS.LOCAL_BASE_URL },
          { key: LLM_SETTINGS_KEYS.LOCAL_MODEL },
          { key: LLM_SETTINGS_KEYS.PROVIDER },
          { key: LLM_SETTINGS_KEYS.OLLAMA_BASE_URL },
        ],
      });
      let explicitProvider: LlmProvider | null = null;
      let legacyUseLocal = false;

      for (const row of rows) {
        if (row.key === LLM_SETTINGS_KEYS.PROVIDER && row.value) {
          explicitProvider = String(row.value) as LlmProvider;
        } else if (row.key === LLM_SETTINGS_KEYS.USE_LOCAL) {
          legacyUseLocal = row.value === true || row.value === 'true';
        } else if (row.key === LLM_SETTINGS_KEYS.LOCAL_BASE_URL && row.value) {
          defaults.localBaseUrl = String(row.value);
        } else if (row.key === LLM_SETTINGS_KEYS.LOCAL_MODEL && row.value) {
          defaults.localModel = String(row.value);
        } else if (row.key === LLM_SETTINGS_KEYS.OLLAMA_BASE_URL && row.value) {
          defaults.ollamaBaseUrl = String(row.value);
        }
      }

      // llm.provider takes precedence; fall back to legacy useLocal flag
      if (explicitProvider) {
        defaults.provider = explicitProvider;
      } else if (legacyUseLocal) {
        defaults.provider = 'local';
      }
      defaults.useLocal = defaults.provider === 'local';
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

  private getClientForProvider(provider: LlmProvider, cfg: LlmConfig): AxiosInstance {
    if (provider === 'local') return this.buildLocalClient(cfg.localBaseUrl);
    if (provider === 'ollama') return this.buildLocalClient(cfg.ollamaBaseUrl);
    if (provider === 'mistral') return this.mistralClient;
    return this.remoteClient;
  }

  private getModelForProvider(provider: LlmProvider, cfg: LlmConfig, requestedModel: string): string {
    // LM Studio: single active model overrides bot config
    if (provider === 'local' && cfg.localModel) return cfg.localModel;
    return requestedModel;
  }

  /** @deprecated use getClientForProvider */
  private resolveClient(cfg: LlmConfig): AxiosInstance {
    return this.getClientForProvider(cfg.provider, cfg);
  }

  /** @deprecated use getModelForProvider */
  private resolveModel(cfg: LlmConfig, requestedModel: string): string {
    return this.getModelForProvider(cfg.provider, cfg, requestedModel);
  }

  /** Fetch models available in Ollama. Returns empty array on error. */
  async fetchOllamaModels(): Promise<string[]> {
    const cfg = await this.loadLlmConfig();
    const baseURL = cfg.ollamaBaseUrl;
    try {
      const client = this.buildLocalClient(baseURL);
      const res = await client.get<{ data?: { id: string }[]; models?: { name: string }[] }>('/models', { timeout: 5000 });
      // OpenAI-compat format: { data: [{ id }] }
      if (Array.isArray(res.data?.data)) {
        return res.data.data.map((m) => m.id).filter(Boolean);
      }
      // Ollama native format (if exposed): { models: [{ name }] }
      if (Array.isArray(res.data?.models)) {
        return res.data.models.map((m) => m.name).filter(Boolean);
      }
      return [];
    } catch (e) {
      this.logger.warn(`Failed to fetch Ollama models: ${(e as Error).message}`);
      return [];
    }
  }

  async complete(params: {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    maxTokens?: number;
    providerOverride?: LlmProvider;
  }): Promise<string> {
    const cfg = await this.loadLlmConfig();
    const provider = params.providerOverride ?? cfg.provider;
    const client = this.getClientForProvider(provider, cfg);
    const model = this.getModelForProvider(provider, cfg, params.model);

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
          throw new Error('Empty response from LLM provider');
        }

        return content;
      } catch (err) {
        const error = err as any;
        const status = error.httpStatus ?? error.response?.status;
        this.logger.warn(
          `LLM attempt ${attempt}/${this.maxRetries} failed (status=${status}): ${error.message}`,
        );

        // Don't retry client errors (4xx) — they won't succeed on retry
        if ((status && status >= 400 && status < 500) || attempt === this.maxRetries) {
          throw new Error(
            `LLM request failed: ${error.message}`,
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt),
        );
      }
    }
    throw new Error('LLM request failed: exhausted retries');
  }

  async *completeStream(params: {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    providerOverride?: LlmProvider;
  }): AsyncGenerator<string, void, unknown> {
    const MAX_CONTINUATIONS = 3;

    const cfg = await this.loadLlmConfig();
    const provider = params.providerOverride ?? cfg.provider;
    const client = this.getClientForProvider(provider, cfg);
    const model = this.getModelForProvider(provider, cfg, params.model);

    let currentMessages: OpenRouterMessage[] = [...params.messages];
    let accumulated = '';

    for (let pass = 0; pass <= MAX_CONTINUATIONS; pass++) {
      const request: OpenRouterRequest & { stream: boolean } = {
        model,
        messages: currentMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
        stream: true,
      };

      let finishReason: string | null = null;
      let passText = '';

      // Retry loop for network/server errors
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await client.post(
            '/chat/completions',
            request,
            {
              responseType: 'stream',
              timeout: 60000,
              validateStatus: () => true,
              signal: params.signal,
            },
          );

          if (response.status >= 400) {
            let errorBody = '';
            for await (const chunk of response.data) {
              errorBody += chunk.toString();
            }
            const err = new Error(
              `LLM provider returned ${response.status}: ${errorBody}`,
            ) as any;
            err.httpStatus = response.status;
            throw err;
          }

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
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const jsonStr = trimmed.slice(6);
              if (jsonStr === '[DONE]') break;

              try {
                const chunk: OpenRouterStreamChunk = JSON.parse(jsonStr);
                const fr = chunk.choices?.[0]?.finish_reason;
                if (fr) finishReason = fr;

                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                  passText += content;
                }
              } catch {
                // skip malformed chunks
              }
            }
          }

          // Flush remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              if (jsonStr !== '[DONE]') {
                try {
                  const chunk: OpenRouterStreamChunk = JSON.parse(jsonStr);
                  const fr = chunk.choices?.[0]?.finish_reason;
                  if (fr) finishReason = fr;

                  const content = chunk.choices?.[0]?.delta?.content;
                  if (content) {
                    yield content;
                    passText += content;
                  }
                } catch {
                  // skip malformed chunk
                }
              }
            }
          }

          break; // success — exit retry loop
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
            `LLM stream attempt ${attempt}/${this.maxRetries} failed: ${error.message} | ${detail}`,
          );
          this.logger.warn(
            `Request was: model=${request.model}, messages=${request.messages.length}, pass=${pass}`,
          );

          if ((status && status >= 400 && status < 500) || attempt === this.maxRetries) {
            throw new Error(`LLM stream failed: ${error.message} | ${detail}`);
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      accumulated += passText;

      // Normal finish or abort
      if (finishReason !== 'length') return;

      // Hit token limit — try to continue
      if (pass === MAX_CONTINUATIONS) {
        this.logger.warn(
          `Max continuations (${MAX_CONTINUATIONS}) reached for model ${model}, response may be incomplete`,
        );
        return;
      }

      this.logger.log(
        `finish_reason=length on pass ${pass}, requesting continuation (accumulated ${accumulated.length} chars)`,
      );

      // Add partial response as assistant turn so the model continues from where it stopped
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: accumulated },
      ];
    }
  }
}
