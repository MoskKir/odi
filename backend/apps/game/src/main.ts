import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { GameModule } from './game.module';

async function bootstrap() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GameModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'odi-game',
          brokers,
        },
        consumer: {
          groupId: 'odi-game-consumer',
        },
      },
    },
  );

  await app.listen();
  console.log('Game microservice is running');
}

bootstrap();
