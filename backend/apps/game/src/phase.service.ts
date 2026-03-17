import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { SessionPhaseEntity, PhaseStatus } from '@app/database';
import { KAFKA_TOPICS } from '@app/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PhaseService {
  private readonly logger = new Logger(PhaseService.name);

  constructor(
    @InjectRepository(SessionPhaseEntity)
    private readonly phaseRepo: Repository<SessionPhaseEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async advance(sessionId: string, direction: 'next' | 'prev') {
    const phases = await this.phaseRepo.find({
      where: { sessionId },
      order: { orderIndex: 'ASC' },
    });

    if (!phases.length) {
      throw new Error('No phases found for session');
    }

    const activeIndex = phases.findIndex(
      (p) => p.status === PhaseStatus.ACTIVE,
    );

    if (direction === 'next') {
      // Mark current as done
      if (activeIndex >= 0) {
        await this.phaseRepo.update(phases[activeIndex].id, {
          status: PhaseStatus.DONE,
          completedAt: new Date(),
        });
      }

      // Activate next
      const nextIndex = activeIndex + 1;
      if (nextIndex < phases.length) {
        await this.phaseRepo.update(phases[nextIndex].id, {
          status: PhaseStatus.ACTIVE,
          startedAt: new Date(),
        });
      }
    } else if (direction === 'prev') {
      // Revert current to pending
      if (activeIndex >= 0) {
        await this.phaseRepo.update(phases[activeIndex].id, {
          status: PhaseStatus.PENDING,
          startedAt: null,
        });
      }

      // Reactivate previous
      const prevIndex = activeIndex - 1;
      if (prevIndex >= 0) {
        await this.phaseRepo.update(phases[prevIndex].id, {
          status: PhaseStatus.ACTIVE,
          completedAt: null,
        });
      }
    }

    // Reload phases
    const updatedPhases = await this.phaseRepo.find({
      where: { sessionId },
      order: { orderIndex: 'ASC' },
    });

    const currentPhase = updatedPhases.find(
      (p) => p.status === PhaseStatus.ACTIVE,
    );

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.PHASE, {
        sessionId,
        type: 'phase-advanced',
        direction,
        currentPhase,
        phases: updatedPhases,
      }),
    );

    return { phases: updatedPhases, currentPhase };
  }
}
