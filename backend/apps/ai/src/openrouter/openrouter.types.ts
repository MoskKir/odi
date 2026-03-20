export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterStreamDelta {
  role?: string;
  content?: string;
}

export interface OpenRouterStreamChoice {
  index: number;
  delta: OpenRouterStreamDelta;
  finish_reason: string | null;
}

export interface OpenRouterStreamChunk {
  id: string;
  model: string;
  choices: OpenRouterStreamChoice[];
}
