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

  private toDto(card: BoardCardEntity) {
    return {
      id: card.id,
      column: card.column,
      text: card.text,
      votes: card.votes,
      orderIndex: card.orderIndex,
      author: card.authorParticipant?.user?.name || 'Unknown',
    };
  }

  private async loadCard(cardId: string) {
    return this.cardRepo.findOne({
      where: { id: cardId },
      relations: ['authorParticipant', 'authorParticipant.user'],
    });
  }

  private async emitEvent(sessionId: string, type: string, extra: Record<string, any>) {
    await lastValueFrom(
      this.kafkaClient.emit(KAFKA_TOPICS.EVENTS.SESSION, {
        sessionId,
        type,
        ...extra,
      }),
    );
  }

  async addCard(data: {
    sessionId: string;
    userId: string;
    column: string;
    text: string;
  }) {
    const participant = await this.participantRepo.findOne({
      where: { sessionId: data.sessionId, userId: data.userId },
      relations: ['user'],
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    // Get max orderIndex for the column
    const maxResult = await this.cardRepo
      .createQueryBuilder('card')
      .select('COALESCE(MAX(card.orderIndex), -1)', 'max')
      .where('card.sessionId = :sessionId AND card.column = :column', {
        sessionId: data.sessionId,
        column: data.column,
      })
      .getRawOne();

    const card = this.cardRepo.create({
      sessionId: data.sessionId,
      column: data.column,
      text: data.text,
      authorParticipantId: participant.id,
      orderIndex: (maxResult?.max ?? -1) + 1,
    });

    await this.cardRepo.save(card);

    const dto = {
      ...this.toDto(card),
      author: participant.user?.name || 'Unknown',
    };

    await this.emitEvent(data.sessionId, 'board-card-added', { card: dto });
    return dto;
  }

  async getCards(sessionId: string) {
    const cards = await this.cardRepo.find({
      where: { sessionId },
      relations: ['authorParticipant', 'authorParticipant.user'],
      order: { column: 'ASC', orderIndex: 'ASC', createdAt: 'ASC' },
    });
    return cards.map((card) => this.toDto(card));
  }

  async vote(cardId: string) {
    await this.cardRepo.increment({ id: cardId }, 'votes', 1);
    const card = await this.loadCard(cardId);
    const dto = this.toDto(card!);
    await this.emitEvent(card!.sessionId, 'board-card-voted', { card: dto });
    return dto;
  }

  async editCard(cardId: string, text: string) {
    await this.cardRepo.update(cardId, { text });
    const card = await this.loadCard(cardId);
    const dto = this.toDto(card!);
    await this.emitEvent(card!.sessionId, 'board-card-edited', { card: dto });
    return dto;
  }

  async moveCard(cardId: string, column: string, orderIndex: number) {
    const card = await this.cardRepo.findOne({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');

    const sessionId = card.sessionId;
    const oldColumn = card.column;

    // If moving to a different column, shift cards in the target column
    if (oldColumn !== column) {
      await this.cardRepo
        .createQueryBuilder()
        .update()
        .set({ orderIndex: () => '"orderIndex" + 1' })
        .where(
          'sessionId = :sessionId AND column = :column AND "orderIndex" >= :orderIndex',
          { sessionId, column, orderIndex },
        )
        .execute();

      // Compact the old column
      await this.compactColumn(sessionId, oldColumn);
    } else {
      // Reorder within the same column
      const oldIndex = card.orderIndex;
      if (orderIndex === oldIndex) return this.toDto(card);

      if (orderIndex > oldIndex) {
        await this.cardRepo
          .createQueryBuilder()
          .update()
          .set({ orderIndex: () => '"orderIndex" - 1' })
          .where(
            'sessionId = :sessionId AND column = :column AND id != :cardId AND "orderIndex" > :oldIndex AND "orderIndex" <= :newIndex',
            { sessionId, column, cardId, oldIndex, newIndex: orderIndex },
          )
          .execute();
      } else {
        await this.cardRepo
          .createQueryBuilder()
          .update()
          .set({ orderIndex: () => '"orderIndex" + 1' })
          .where(
            'sessionId = :sessionId AND column = :column AND id != :cardId AND "orderIndex" >= :newIndex AND "orderIndex" < :oldIndex',
            { sessionId, column, cardId, newIndex: orderIndex, oldIndex },
          )
          .execute();
      }
    }

    await this.cardRepo.update(cardId, { column, orderIndex });
    const updated = await this.loadCard(cardId);
    const dto = this.toDto(updated!);

    // Return all cards for full sync
    const allCards = await this.getCards(sessionId);
    await this.emitEvent(sessionId, 'board-cards-sync', { cards: allCards });
    return dto;
  }

  async deleteCard(cardId: string) {
    const card = await this.cardRepo.findOne({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');
    const { sessionId, column } = card;

    await this.cardRepo.delete(cardId);
    await this.compactColumn(sessionId, column);

    await this.emitEvent(sessionId, 'board-card-deleted', { cardId });
    return { ok: true };
  }

  private async compactColumn(sessionId: string, column: string) {
    const cards = await this.cardRepo.find({
      where: { sessionId, column },
      order: { orderIndex: 'ASC' },
    });
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].orderIndex !== i) {
        await this.cardRepo.update(cards[i].id, { orderIndex: i });
      }
    }
  }
}
