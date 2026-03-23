import { Injectable } from '@nestjs/common';
import { BotConfigEntity, BotStageContextEntity, StageSharedContextEntity } from '@app/database';
import { DEFAULT_MODERATOR_PROMPT } from './templates/moderator';
import { DEFAULT_ANALYST_PROMPT } from './templates/analyst';
import { VISIONARY_SYSTEM_PROMPT } from './templates/visionary';
import { DEFAULT_CRITIC_PROMPT } from './templates/critic';
import { DEFAULT_EXPERT_PROMPT } from './templates/expert';
import { PEACEMAKER_SYSTEM_PROMPT } from './templates/peacemaker';
import { PROVOCATEUR_SYSTEM_PROMPT } from './templates/provocateur';
import { KEEPER_SYSTEM_PROMPT } from './templates/keeper';

const BOT_PROMPTS: Record<string, string> = {
  moderator: DEFAULT_MODERATOR_PROMPT,
  analyst: DEFAULT_ANALYST_PROMPT,
  visionary: VISIONARY_SYSTEM_PROMPT,
  critic: DEFAULT_CRITIC_PROMPT,
  expert: DEFAULT_EXPERT_PROMPT,
  peacemaker: PEACEMAKER_SYSTEM_PROMPT,
  provocateur: PROVOCATEUR_SYSTEM_PROMPT,
  keeper: KEEPER_SYSTEM_PROMPT,
};

@Injectable()
export class PromptBuilderService {
  /**
   * Build prompt from DB bot config (preferred path).
   */
  buildFromConfig(
    botConfig: BotConfigEntity,
    params: {
      sessionId: string;
      strategyOverride?: string;
      stageContext?: BotStageContextEntity | null;
      sharedContext?: StageSharedContextEntity | null;
    },
  ): string {
    let prompt = botConfig.systemPrompt;

    if (botConfig.personality) {
      prompt += `\n\nТвоя личность: ${botConfig.personality}`;
    }

    // Inject stage-specific context if available
    if (params.sharedContext || params.stageContext) {
      prompt += this.buildStageContextBlock(params.stageContext, params.sharedContext);
    }

    if (params.strategyOverride) {
      prompt += `\n\nТекущая стратегия поведения: ${params.strategyOverride}`;
    }

    prompt += `\n\nКонтекст текущего действия: Участник написал сообщение, требующее вашей реакции.`;
    prompt += `\nID сессии: ${params.sessionId}`;

    return prompt;
  }

  /**
   * Build the stage context block to inject into the system prompt.
   */
  private buildStageContextBlock(
    botCtx?: BotStageContextEntity | null,
    sharedCtx?: StageSharedContextEntity | null,
  ): string {
    const parts: string[] = [];

    if (sharedCtx) {
      parts.push(`\n\n--- КОНТЕКСТ ЭТАПА: ${sharedCtx.stageName} ---`);
      if (sharedCtx.purpose) {
        parts.push(`Цель этапа: ${sharedCtx.purpose}`);
      }
      if (sharedCtx.methodologicalTask) {
        parts.push(`Методологическая задача этапа: ${sharedCtx.methodologicalTask}`);
      }
      if (sharedCtx.keyConcepts?.length) {
        parts.push(`Ключевые концепции: ${sharedCtx.keyConcepts.join(', ')}`);
      }
      if (sharedCtx.criticalMoments?.length) {
        const moments = sharedCtx.criticalMoments
          .map((m) => `- Когда: ${m.when} → Действие: ${m.action}`)
          .join('\n');
        parts.push(`Критические моменты:\n${moments}`);
      }
    }

    if (botCtx) {
      parts.push(`\n--- ТВОЯ РОЛЬ НА ЭТОМ ЭТАПЕ ---`);
      if (botCtx.roleDescription) {
        parts.push(`Роль: ${botCtx.roleDescription}`);
      }
      if (botCtx.methodologicalTask) {
        parts.push(`Задача: ${botCtx.methodologicalTask}`);
      }
      if (botCtx.tone) {
        parts.push(`Тон общения: ${botCtx.tone}`);
      }
      if (botCtx.triggers?.length) {
        parts.push(`Следи за: ${botCtx.triggers.join(', ')}`);
      }
      if (botCtx.forbidden?.length) {
        parts.push(`Запрещено: ${botCtx.forbidden.join(', ')}`);
      }
      if (botCtx.responseTemplates?.length) {
        const templates = botCtx.responseTemplates
          .map((t) => `- [${t.trigger}]: "${t.template}"`)
          .join('\n');
        parts.push(`Шаблоны ответов:\n${templates}`);
      }
      if (botCtx.fallbackBehavior) {
        parts.push(`Поведение по умолчанию: ${botCtx.fallbackBehavior}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Fallback: build prompt from specialistId template.
   */
  build(params: {
    botConfigId: string;
    sessionId: string;
    trigger: string;
    strategyOverride?: string;
  }): string {
    const basePrompt =
      BOT_PROMPTS[params.botConfigId] || DEFAULT_MODERATOR_PROMPT;

    let prompt = basePrompt;

    if (params.strategyOverride) {
      prompt += `\n\nТекущая стратегия поведения: ${params.strategyOverride}`;
    }

    prompt += `\n\nКонтекст текущего действия: Участник написал сообщение, требующее вашей реакции.`;
    prompt += `\nID сессии: ${params.sessionId}`;

    return prompt;
  }
}
