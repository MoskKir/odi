import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@app/database';
import { KafkaClientModule } from './kafka/kafka-client.module';
import { KafkaInitService } from './kafka/kafka-init.service';
import { GameGatewayModule } from './websocket/game.gateway.module';
import { AuthController } from './controllers/auth.controller';
import { GameController } from './controllers/game.controller';
import { ScenarioController } from './controllers/scenario.controller';
import { BotController } from './controllers/bot.controller';
import { AdminController } from './controllers/admin.controller';
import { ChatController } from './controllers/chat.controller';
import { EventListenerService } from './kafka/event-listener.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    KafkaClientModule,
    DatabaseModule,
    GameGatewayModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'odi-secret',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      }),
    }),
  ],
  controllers: [
    AuthController,
    GameController,
    ScenarioController,
    BotController,
    AdminController,
    ChatController,
    EventListenerService,
  ],
  providers: [KafkaInitService],
})
export class GatewayModule {}
