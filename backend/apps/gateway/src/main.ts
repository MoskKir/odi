import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const kafkaBrokers = configService
    .get<string>('KAFKA_BROKERS', 'localhost:9092')
    .split(',');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: kafkaBrokers,
      },
      consumer: {
        groupId: 'odi-gateway-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Gateway is running on port ${port}`);
}

bootstrap();
