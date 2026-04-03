import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  GameSessionEntity,
  ScenarioEntity,
  SessionParticipantEntity,
  SessionPhaseEntity,
  BotConfigEntity,
  SystemSettingEntity,
  GameStatus,
} from '@app/database';
import { KAFKA_TOPICS } from '@app/common';

@Injectable()
export class GameService implements OnModuleInit {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @InjectRepository(GameSessionEntity)
    private readonly sessionRepo: Repository<GameSessionEntity>,
    @InjectRepository(ScenarioEntity)
    private readonly scenarioRepo: Repository<ScenarioEntity>,
    @InjectRepository(SessionParticipantEntity)
    private readonly participantRepo: Repository<SessionParticipantEntity>,
    @InjectRepository(SessionPhaseEntity)
    private readonly phaseRepo: Repository<SessionPhaseEntity>,
    @InjectRepository(BotConfigEntity)
    private readonly botConfigRepo: Repository<BotConfigEntity>,
    @InjectRepository(SystemSettingEntity)
    private readonly settingsRepo: Repository<SystemSettingEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async create(dto: any, hostId: string) {
    // Resolve scenario by UUID or slug
    let scenario: any = null;

    if (dto.scenarioId) {
      scenario = await this.scenarioRepo.findOne({
        where: { id: dto.scenarioId },
      }).catch(() => null);
    }

    if (!scenario && dto.scenarioSlug) {
      scenario = await this.scenarioRepo.findOne({
        where: { slug: dto.scenarioSlug },
      });
    }

    if (!scenario) {
      throw new RpcException('Scenario not found');
    }

    // Create game session
    const inviteCode = this.generateInviteCode();
    const session = this.sessionRepo.create({
      title: dto.title,
      scenarioId: scenario.id,
      hostId,
      difficulty: dto.difficulty,
      durationMinutes: dto.durationMinutes,
      interfaceMode: dto.interfaceMode,
      aiVisibility: dto.aiVisibility,
      crewSize: dto.crewSize,
      boardColumns: dto.boardColumns ?? null,
      inviteCode,
    });

    await this.sessionRepo.save(session);

    // Create phases (custom or default)
    const phasesDef = dto.phases?.length > 0
      ? dto.phases.map(
          (p: { name: string; durationMinutes: number }, i: number) => ({
            name: p.name,
            durationMinutes: p.durationMinutes,
            orderIndex: i,
          }),
        )
      : [
          { name: 'Знакомство', durationMinutes: 5, orderIndex: 0 },
          { name: 'Анализ проблемы', durationMinutes: 10, orderIndex: 1 },
          { name: 'Генерация идей', durationMinutes: 15, orderIndex: 2 },
          { name: 'Обсуждение', durationMinutes: 10, orderIndex: 3 },
          { name: 'Подведение итогов', durationMinutes: 5, orderIndex: 4 },
        ];

    const phases = phasesDef.map((p: any) =>
      this.phaseRepo.create({ ...p, sessionId: session.id }),
    );
    await this.phaseRepo.save(phases);

    // Create host participant
    const hostParticipant = this.participantRepo.create({
      sessionId: session.id,
      userId: hostId,
      role: 'host',
      isOnline: true,
      slotIndex: 0,
    });
    await this.participantRepo.save(hostParticipant);

    // Create bot participants from botSlots (UUIDs) or specialistIds (slugs)
    const botSlots: string[] = dto.botSlots ?? [];
    const specialistIds: string[] = dto.specialistIds ?? [];

    if (botSlots.length > 0) {
      const botConfigs = await this.botConfigRepo.findByIds(botSlots);
      const botParticipants = botConfigs.map((bot, index) =>
        this.participantRepo.create({
          sessionId: session.id,
          botConfigId: bot.id,
          role: 'bot',
          isOnline: true,
          slotIndex: index + 1,
        }),
      );
      await this.participantRepo.save(botParticipants);
    } else if (specialistIds.length > 0) {
      const botConfigs: BotConfigEntity[] = [];
      for (const specId of specialistIds) {
        const bot = await this.botConfigRepo.findOne({
          where: { specialistId: specId },
        });
        if (bot) botConfigs.push(bot);
      }
      const botParticipants = botConfigs.map((bot, index) =>
        this.participantRepo.create({
          sessionId: session.id,
          botConfigId: bot.id,
          role: 'bot',
          isOnline: true,
          slotIndex: index + 1,
        }),
      );
      if (botParticipants.length > 0) {
        await this.participantRepo.save(botParticipants);
      }
    }

    // Emit event
    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
        sessionId: session.id,
        type: 'created',
        session,
      }),
    );

    // Increment scenario usage
    await this.scenarioRepo.increment({ id: scenario.id }, 'sessionsCount', 1);

    return this.findOne(session.id);
  }

  async findAll(
    userId: string,
    filters: { status?: string; search?: string; limit: number; offset: number },
  ) {
    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.scenario', 'scenario')
      .leftJoinAndSelect('session.participants', 'participants')
      .leftJoinAndSelect('session.phases', 'phases')
      .leftJoinAndSelect('participants.user', 'user')
      .leftJoinAndSelect('participants.botConfig', 'botConfig')
      .where(
        '(session.hostId = :userId OR participants.userId = :userId)',
        { userId },
      );

    if (filters.status) {
      qb.andWhere('session.status = :status', { status: filters.status });
    }

    if (filters.search) {
      qb.andWhere('session.title ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('session.createdAt', 'DESC')
      .take(filters.limit)
      .skip(filters.offset);

    const [items, total] = await qb.getManyAndCount();

    return { items, total };
  }

  async findOne(id: string) {
    return this.sessionRepo.findOne({
      where: { id },
      relations: [
        'scenario',
        'host',
        'participants',
        'participants.user',
        'participants.botConfig',
        'phases',
      ],
    });
  }

  async deleteGame(sessionId: string) {
    await this.sessionRepo.delete(sessionId);
    return { ok: true };
  }

  async updateTitle(sessionId: string, title: string) {
    await this.sessionRepo.update(sessionId, { title });
    return { ok: true };
  }

  async updateStatus(sessionId: string, status: GameStatus) {
    const updateData: any = { status };

    if (status === GameStatus.ACTIVE) {
      updateData.startedAt = new Date();
    } else if (status === GameStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.sessionRepo.update(sessionId, updateData);

    const session = await this.findOne(sessionId);

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
        sessionId,
        type: 'status-changed',
        status,
        session,
      }),
    );

    return session;
  }

  async findAllAdmin(filters: {
    limit: number;
    offset: number;
    status?: string;
  }) {
    const where: any = {};
    if (filters.status) {
      where.status = filters.status;
    }

    const [items, total] = await this.sessionRepo.findAndCount({
      where,
      relations: ['scenario', 'host', 'participants'],
      order: { createdAt: 'DESC' },
      take: filters.limit,
      skip: filters.offset,
    });

    return { items, total };
  }

  async listBots() {
    return this.botConfigRepo.find({
      where: { enabled: true },
      order: { stars: 'DESC', createdAt: 'ASC' },
    });
  }

  async createBot(dto: Partial<BotConfigEntity>) {
    const bot = this.botConfigRepo.create(dto);
    return this.botConfigRepo.save(bot);
  }

  async updateBot(id: string, dto: Partial<BotConfigEntity>) {
    await this.botConfigRepo.update(id, dto);
    return this.botConfigRepo.findOne({ where: { id } });
  }

  async deleteBot(id: string) {
    await this.botConfigRepo.delete(id);
    return { deleted: true };
  }

  async getSettings() {
    const settings = await this.settingsRepo.find();
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async updateSettings(data: Record<string, any>) {
    for (const [key, value] of Object.entries(data)) {
      await this.settingsRepo.upsert({ key, value }, ['key']);
    }
    return this.getSettings();
  }

  async findByInviteCode(code: string) {
    const session = await this.sessionRepo.findOne({
      where: { inviteCode: code },
      select: ['id', 'title', 'status', 'inviteCode'],
    });
    if (!session) {
      throw new RpcException('Invalid invite code');
    }
    return session;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
