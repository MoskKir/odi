import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { EmotionResultDto } from '@app/common';

const ANALYSIS_PROMPT = `Ты - анализатор эмоций и динамики групповой дискуссии.
Проанализируй следующие сообщения участников и оцени текущее состояние группы по 4 метрикам (каждая от 0 до 1):

- engagement (вовлечённость): насколько активно участники включены в обсуждение
- tension (напряжённость): уровень конфликтности и стресса в группе
- creativity (креативность): насколько нестандартные и разнообразные идеи генерируются
- fatigue (усталость): признаки утомления, повторения, снижения качества ответов

Ответь ТОЛЬКО в формате JSON без markdown:
{"engagement": 0.0, "tension": 0.0, "creativity": 0.0, "fatigue": 0.0}`;

@Injectable()
export class EmotionAnalyzerService {
  private readonly logger = new Logger(EmotionAnalyzerService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async analyze(
    messages: Array<{ author: string; text: string }>,
  ): Promise<EmotionResultDto> {
    if (!messages || messages.length === 0) {
      return {
        sessionId: '',
        engagement: 0.5,
        tension: 0.1,
        creativity: 0.5,
        fatigue: 0.1,
      };
    }

    const messagesText = messages
      .map((m) => `[${m.author}]: ${m.text}`)
      .join('\n');

    try {
      const response = await this.openRouterService.complete({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: messagesText },
        ],
        temperature: 0.3,
        maxTokens: 128,
      });

      const parsed = JSON.parse(response);

      return {
        sessionId: '',
        engagement: this.clamp(parsed.engagement),
        tension: this.clamp(parsed.tension),
        creativity: this.clamp(parsed.creativity),
        fatigue: this.clamp(parsed.fatigue),
      };
    } catch (error) {
      this.logger.warn(`Emotion analysis failed: ${error.message}`);
      return {
        sessionId: '',
        engagement: 0.5,
        tension: 0.2,
        creativity: 0.5,
        fatigue: 0.2,
      };
    }
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }
}
