import { Injectable } from '@nestjs/common';
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
  build(params: {
    botConfigId: string;
    sessionId: string;
    trigger: string;
    strategyOverride?: string;
  }): string {
    // Determine which bot template to use based on botConfigId
    // In production, fetch from DB; here use a mapping fallback
    const basePrompt =
      BOT_PROMPTS[params.botConfigId] || DEFAULT_MODERATOR_PROMPT;

    let prompt = basePrompt;

    // Append strategy override if present
    if (params.strategyOverride) {
      prompt += `\n\nТекущая стратегия поведения: ${params.strategyOverride}`;
    }

    // Append trigger context
    prompt += `\n\nКонтекст текущего действия: Участник написал сообщение, требующее вашей реакции.`;
    prompt += `\nID сессии: ${params.sessionId}`;

    return prompt;
  }
}
