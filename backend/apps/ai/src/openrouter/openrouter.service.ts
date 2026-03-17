import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  OpenRouterRequest,
  OpenRouterResponse,
  OpenRouterMessage,
} from './openrouter.types';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: AxiosInstance;
  private readonly maxRetries = 3;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    this.client = axios.create({
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

  async complete(params: {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const request: OpenRouterRequest = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 512,
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.post<OpenRouterResponse>(
          '/chat/completions',
          request,
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenRouter');
        }

        return content;
      } catch (error) {
        this.logger.warn(
          `OpenRouter attempt ${attempt}/${this.maxRetries} failed: ${error.message}`,
        );

        if (attempt === this.maxRetries) {
          throw new Error(
            `OpenRouter request failed after ${this.maxRetries} attempts: ${error.message}`,
          );
        }

        // Simple delay before retry
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt),
        );
      }
    }
    throw new Error('OpenRouter request failed: exhausted retries');
  }
}
