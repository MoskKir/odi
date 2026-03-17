export const KAFKA_TOPICS = {
  AUTH: {
    REGISTER: 'odi.auth.register',
    LOGIN: 'odi.auth.login',
    VALIDATE_TOKEN: 'odi.auth.validate-token',
    GET_PREFERENCES: 'odi.auth.get-preferences',
    UPDATE_PREFERENCES: 'odi.auth.update-preferences',
    RESULT: 'odi.auth.result',
  },
  GAME: {
    CREATE: 'odi.game.create',
    UPDATE_STATUS: 'odi.game.update-status',
    PHASE_ADVANCE: 'odi.game.phase-advance',
    JOIN: 'odi.game.join',
    LEAVE: 'odi.game.leave',
    LIST: 'odi.game.list',
    RESULT: 'odi.game.result',
  },
  CHAT: {
    SEND: 'odi.chat.send',
    HISTORY: 'odi.chat.history',
    RESULT: 'odi.chat.result',
  },
  AI: {
    GENERATE: 'odi.ai.generate',
    ANALYZE_EMOTION: 'odi.ai.analyze-emotion',
    CHANGE_STRATEGY: 'odi.ai.change-strategy',
    RESULT: 'odi.ai.result',
  },
  EVENTS: {
    SESSION: 'odi.events.session',
    CHAT: 'odi.events.chat',
    EMOTION: 'odi.events.emotion',
    PHASE: 'odi.events.phase',
  },
} as const;
