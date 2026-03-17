import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AiModule } from './ai.module';

async function bootstrap() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AiModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'odi-ai',
          brokers,
        },
        consumer: {
          groupId: 'odi-ai-consumer',
        },
      },
    },
  );

  await app.listen();
  console.log('AI microservice is running');
}

bootstrap();
