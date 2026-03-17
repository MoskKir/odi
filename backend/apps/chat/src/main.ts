import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ChatModule } from './chat.module';

async function bootstrap() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ChatModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'odi-chat',
          brokers,
        },
        consumer: {
          groupId: 'odi-chat-consumer',
        },
      },
    },
  );

  await app.listen();
  console.log('Chat microservice is running');
}

bootstrap();
