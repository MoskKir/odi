import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'odi-gateway',
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
            },
            producer: {
              allowAutoTopicCreation: true,
            },
            consumer: {
              groupId: 'odi-gateway-consumer',
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaClientModule {}
