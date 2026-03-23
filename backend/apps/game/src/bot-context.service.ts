import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotStageContextEntity, StageSharedContextEntity } from '@app/database';

@Injectable()
export class BotContextService {
  constructor(
    @InjectRepository(BotStageContextEntity)
    private readonly botCtxRepo: Repository<BotStageContextEntity>,
    @InjectRepository(StageSharedContextEntity)
    private readonly sharedCtxRepo: Repository<StageSharedContextEntity>,
  ) {}

  async findAllByScenario(scenarioId: string) {
    const [botContexts, sharedContexts] = await Promise.all([
      this.botCtxRepo.find({
        where: { scenarioId },
        order: { stageName: 'ASC', createdAt: 'ASC' },
      }),
      this.sharedCtxRepo.find({
        where: { scenarioId },
        order: { stageName: 'ASC' },
      }),
    ]);
    return { botContexts, sharedContexts };
  }

  async upsertBotContext(dto: Partial<BotStageContextEntity>) {
    const existing = await this.botCtxRepo.findOne({
      where: {
        scenarioId: dto.scenarioId,
        stageName: dto.stageName,
        botConfigId: dto.botConfigId,
      },
    });

    if (existing) {
      await this.botCtxRepo.update(existing.id, dto);
      return this.botCtxRepo.findOne({ where: { id: existing.id } });
    }

    const entity = this.botCtxRepo.create(dto);
    return this.botCtxRepo.save(entity);
  }

  async deleteBotContext(id: string) {
    await this.botCtxRepo.delete(id);
    return { deleted: true };
  }

  async upsertSharedContext(dto: Partial<StageSharedContextEntity>) {
    const existing = await this.sharedCtxRepo.findOne({
      where: {
        scenarioId: dto.scenarioId,
        stageName: dto.stageName,
      },
    });

    if (existing) {
      await this.sharedCtxRepo.update(existing.id, dto);
      return this.sharedCtxRepo.findOne({ where: { id: existing.id } });
    }

    const entity = this.sharedCtxRepo.create(dto);
    return this.sharedCtxRepo.save(entity);
  }

  async deleteSharedContext(id: string) {
    await this.sharedCtxRepo.delete(id);
    return { deleted: true };
  }

  async findForBotAndStage(
    scenarioId: string,
    stageName: string,
    botConfigId: string,
  ) {
    const [botContext, sharedContext] = await Promise.all([
      this.botCtxRepo.findOne({
        where: { scenarioId, stageName, botConfigId, active: true },
      }),
      this.sharedCtxRepo.findOne({
        where: { scenarioId, stageName },
      }),
    ]);
    return { botContext, sharedContext };
  }
}
