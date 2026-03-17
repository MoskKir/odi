import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { KAFKA_TOPICS, TokenPayloadDto } from '@app/common';
import { lastValueFrom } from 'rxjs';

@WebSocketGateway({ cors: true, namespace: '/game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('odi.game.emotion-set');
    this.kafkaClient.subscribeToResponseOf('odi.game.board-add');
    this.kafkaClient.subscribeToResponseOf('odi.game.board-vote');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake?.auth?.token ||
        this.extractTokenFromHeader(client.handshake?.headers?.authorization);

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }

      const payload: TokenPayloadDto = await this.jwtService.verifyAsync(token);
      client.data = {
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        },
      };

      this.logger.log(`Client ${client.id} connected: ${payload.email}`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('session:join')
  async handleSessionJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    client.join(data.sessionId);
    this.logger.log(`User ${user.email} joined room ${data.sessionId}`);

    await lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.JOIN, {
        sessionId: data.sessionId,
        userId: user.id,
      }),
    );

    this.server.to(data.sessionId).emit('session:user-joined', {
      userId: user.id,
      email: user.email,
    });

    client.emit('session:joined', { sessionId: data.sessionId });
  }

  @SubscribeMessage('session:leave')
  async handleSessionLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    client.leave(data.sessionId);
    this.logger.log(`User ${user.email} left room ${data.sessionId}`);

    await lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.GAME.LEAVE, {
        sessionId: data.sessionId,
        userId: user.id,
      }),
    );

    this.server.to(data.sessionId).emit('session:user-left', {
      userId: user.id,
      email: user.email,
    });
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; text: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    lastValueFrom(
      this.kafkaClient.send(KAFKA_TOPICS.CHAT.SEND, {
        sessionId: data.sessionId,
        userId: user.id,
        text: data.text,
      }),
    ).catch((err) => {
      this.logger.error(`chat:send failed: ${err.message}`);
      client.emit('error', { message: err.message });
    });
  }

  @SubscribeMessage('emotion:set')
  async handleEmotionSet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; emotion: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    lastValueFrom(
      this.kafkaClient.send('odi.game.emotion-set', {
        sessionId: data.sessionId,
        userId: user.id,
        emotion: data.emotion,
      }),
    ).catch((err) => {
      this.logger.error(`emotion:set failed: ${err.message}`);
    });
  }

  @SubscribeMessage('board:add')
  async handleBoardAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; column: string; text: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    lastValueFrom(
      this.kafkaClient.send('odi.game.board-add', {
        sessionId: data.sessionId,
        userId: user.id,
        column: data.column,
        text: data.text,
      }),
    ).catch((err) => {
      this.logger.error(`board:add failed: ${err.message}`);
    });
  }

  @SubscribeMessage('board:vote')
  async handleBoardVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; cardId: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    lastValueFrom(
      this.kafkaClient.send('odi.game.board-vote', {
        sessionId: data.sessionId,
        userId: user.id,
        cardId: data.cardId,
      }),
    ).catch((err) => {
      this.logger.error(`board:vote failed: ${err.message}`);
    });
  }

  private extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
