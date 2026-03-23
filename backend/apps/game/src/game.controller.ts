import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/common';
import { GameService } from './game.service';
import { PhaseService } from './phase.service';
import { ScenarioService } from './scenario.service';
import { ParticipantService } from './participant.service';
import { BoardService } from './board.service';
import { BotContextService } from './bot-context.service';

@Controller()
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly phaseService: PhaseService,
    private readonly scenarioService: ScenarioService,
    private readonly participantService: ParticipantService,
    private readonly boardService: BoardService,
    private readonly botContextService: BotContextService,
  ) {}

  // --- Game Session ---

  @MessagePattern(KAFKA_TOPICS.GAME.CREATE)
  async createGame(@Payload() data: any) {
    return this.gameService.create(data, data.hostId);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.LIST)
  async listGames(@Payload() data: any) {
    return this.gameService.findAll(data.userId, data);
  }

  @MessagePattern('odi.game.get')
  async getGame(@Payload() data: { id: string }) {
    return this.gameService.findOne(data.id);
  }

  @MessagePattern('odi.game.update-title')
  async updateTitle(@Payload() data: { sessionId: string; title: string }) {
    return this.gameService.updateTitle(data.sessionId, data.title);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.UPDATE_STATUS)
  async updateGameStatus(@Payload() data: any) {
    return this.gameService.updateStatus(data.sessionId, data.status);
  }

  // --- Phases ---

  @MessagePattern(KAFKA_TOPICS.GAME.PHASE_ADVANCE)
  async advancePhase(@Payload() data: any) {
    return this.phaseService.advance(data.sessionId, data.direction || 'next');
  }

  // --- Participants ---

  @MessagePattern(KAFKA_TOPICS.GAME.JOIN)
  async joinSession(@Payload() data: any) {
    return this.participantService.join(data.sessionId, data.userId);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.LEAVE)
  async leaveSession(@Payload() data: any) {
    return this.participantService.leave(data.sessionId, data.userId);
  }

  // --- Scenarios ---

  @MessagePattern('odi.game.scenario-list')
  async listScenarios(@Payload() data: { role: string }) {
    return this.scenarioService.findAll(data.role);
  }

  @MessagePattern('odi.game.scenario-create')
  async createScenario(@Payload() data: any) {
    return this.scenarioService.create(data);
  }

  @MessagePattern('odi.game.scenario-update')
  async updateScenario(@Payload() data: any) {
    const { id, ...dto } = data;
    return this.scenarioService.update(id, dto);
  }

  @MessagePattern('odi.game.scenario-delete')
  async deleteScenario(@Payload() data: { id: string }) {
    return this.scenarioService.delete(data.id);
  }

  // --- Bots ---

  @MessagePattern('odi.game.bot-list')
  async listBots() {
    return this.gameService.listBots();
  }

  @MessagePattern('odi.game.bot-create')
  async createBot(@Payload() data: any) {
    return this.gameService.createBot(data);
  }

  @MessagePattern('odi.game.bot-update')
  async updateBot(@Payload() data: any) {
    const { id, ...dto } = data;
    return this.gameService.updateBot(id, dto);
  }

  @MessagePattern('odi.game.bot-delete')
  async deleteBot(@Payload() data: { id: string }) {
    return this.gameService.deleteBot(data.id);
  }

  // --- Board ---

  @MessagePattern('odi.game.board-add')
  async addBoardCard(@Payload() data: any) {
    return this.boardService.addCard(data);
  }

  @MessagePattern('odi.game.board-vote')
  async voteBoardCard(@Payload() data: any) {
    return this.boardService.vote(data.cardId);
  }

  // --- Emotion ---

  @MessagePattern('odi.game.emotion-set')
  async setEmotion(@Payload() data: any) {
    return this.participantService.updateEmotion(
      data.sessionId,
      data.userId,
      data.emotion,
    );
  }

  // --- Admin ---

  @MessagePattern('odi.game.session-list-all')
  async listAllSessions(@Payload() data: any) {
    return this.gameService.findAllAdmin(data);
  }

  @MessagePattern('odi.game.session-force-update')
  async forceUpdateSession(@Payload() data: any) {
    const { sessionId, ...dto } = data;
    return this.gameService.updateStatus(sessionId, dto.status);
  }

  @MessagePattern('odi.game.settings-get')
  async getSettings() {
    return this.gameService.getSettings();
  }

  @MessagePattern('odi.game.settings-update')
  async updateSettings(@Payload() data: any) {
    return this.gameService.updateSettings(data);
  }

  // --- Bot Stage Contexts ---

  @MessagePattern(KAFKA_TOPICS.GAME.BOT_CONTEXT_LIST)
  async listBotContexts(@Payload() data: { scenarioId: string }) {
    return this.botContextService.findAllByScenario(data.scenarioId);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.BOT_CONTEXT_UPSERT)
  async upsertBotContext(@Payload() data: any) {
    return this.botContextService.upsertBotContext(data);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.BOT_CONTEXT_DELETE)
  async deleteBotContext(@Payload() data: { id: string }) {
    return this.botContextService.deleteBotContext(data.id);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.SHARED_CONTEXT_UPSERT)
  async upsertSharedContext(@Payload() data: any) {
    return this.botContextService.upsertSharedContext(data);
  }

  @MessagePattern(KAFKA_TOPICS.GAME.SHARED_CONTEXT_DELETE)
  async deleteSharedContext(@Payload() data: { id: string }) {
    return this.botContextService.deleteSharedContext(data.id);
  }
}
