import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'odi-auth',
          brokers,
        },
        consumer: {
          groupId: 'odi-auth-consumer',
        },
      },
    },
  );

  await app.listen();
  console.log('Auth microservice is running');
}

bootstrap();
