import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { SessionParticipantEntity, GameSessionEntity } from '@app/database';
import { KAFKA_TOPICS } from '@app/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ParticipantService {
  private readonly logger = new Logger(ParticipantService.name);

  constructor(
    @InjectRepository(SessionParticipantEntity)
    private readonly participantRepo: Repository<SessionParticipantEntity>,
    @InjectRepository(GameSessionEntity)
    private readonly sessionRepo: Repository<GameSessionEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async join(sessionId: string, userId: string) {
    // Check if already a participant
    let participant = await this.participantRepo.findOne({
      where: { sessionId, userId },
    });

    if (participant) {
      // Just set online
      await this.participantRepo.update(participant.id, { isOnline: true });
    } else {
      // Determine next slot index
      const existingCount = await this.participantRepo.count({
        where: { sessionId },
      });

      participant = this.participantRepo.create({
        sessionId,
        userId,
        role: 'player',
        isOnline: true,
        slotIndex: existingCount,
      });
      await this.participantRepo.save(participant);
    }

    // Load with relations
    participant = await this.participantRepo.findOne({
      where: { id: participant.id },
      relations: ['user', 'botConfig'],
    });

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
        sessionId,
        type: 'participant-joined',
        participant,
      }),
    );

    return participant;
  }

  async leave(sessionId: string, userId: string) {
    const participant = await this.participantRepo.findOne({
      where: { sessionId, userId },
    });

    if (participant) {
      await this.participantRepo.update(participant.id, { isOnline: false });

      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
          sessionId,
          type: 'participant-left',
          userId,
          participantId: participant.id,
        }),
      );
    }

    return { success: true };
  }

  async updateEmotion(sessionId: string, userId: string, emotion: string) {
    const participant = await this.participantRepo.findOne({
      where: { sessionId, userId },
    });

    if (participant) {
      await this.participantRepo.update(participant.id, {
        currentEmotion: emotion,
      });

      await lastValueFrom(
        this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.EMOTION, {
          sessionId,
          userId,
          participantId: participant.id,
          emotion,
        }),
      );
    }

    return { success: true };
  }
}
