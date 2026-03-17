import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import {
  BoardCardEntity,
  SessionParticipantEntity,
} from '@app/database';
import { KAFKA_TOPICS } from '@app/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(BoardCardEntity)
    private readonly cardRepo: Repository<BoardCardEntity>,
    @InjectRepository(SessionParticipantEntity)
    private readonly participantRepo: Repository<SessionParticipantEntity>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async addCard(data: {
    sessionId: string;
    userId: string;
    column: string;
    text: string;
  }) {
    const participant = await this.participantRepo.findOne({
      where: { sessionId: data.sessionId, userId: data.userId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    const card = this.cardRepo.create({
      sessionId: data.sessionId,
      column: data.column,
      text: data.text,
      authorParticipantId: participant.id,
    });

    await this.cardRepo.save(card);

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
        sessionId: data.sessionId,
        type: 'board-card-added',
        card,
      }),
    );

    return card;
  }

  async getCards(sessionId: string) {
    return this.cardRepo.find({
      where: { sessionId },
      relations: ['authorParticipant', 'authorParticipant.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async vote(cardId: string) {
    await this.cardRepo.increment({ id: cardId }, 'votes', 1);
    const card = await this.cardRepo.findOne({ where: { id: cardId } });

    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
        sessionId: card!.sessionId,
        type: 'board-card-voted',
        card,
      }),
    );

    return card;
  }
}
