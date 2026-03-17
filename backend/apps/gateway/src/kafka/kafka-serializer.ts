import { Serializer } from '@nestjs/microservices';

/**
 * Custom Kafka serializer that ensures all messages are plain JSON objects.
 * Fixes the issue where class instances (from ValidationPipe transform)
 * serialize as "[object Object]" string instead of proper JSON.
 */
export class JsonKafkaSerializer implements Serializer {
  serialize(value: any) {
    return JSON.stringify(value);
  }
}
