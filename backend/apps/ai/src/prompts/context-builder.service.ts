import { Injectable } from '@nestjs/common';
import { OpenRouterMessage } from '../openrouter/openrouter.types';

@Injectable()
export class ContextBuilderService {
  build(params: {
    systemPrompt: string;
    trigger: string;
    recentMessages?: Array<{ role: string; author: string; text: string }>;
  }): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: params.systemPrompt,
      },
    ];

    // Add recent chat messages as conversation context
    if (params.recentMessages && params.recentMessages.length > 0) {
      for (const msg of params.recentMessages) {
        messages.push({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: `[${msg.author}]: ${msg.text}`,
        });
      }
    }

    // Add the trigger message
    messages.push({
      role: 'user',
      content: params.trigger,
    });

    return messages;
  }
}
