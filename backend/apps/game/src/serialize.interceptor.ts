import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Converts TypeORM entity class instances to plain JSON-serializable objects
 * before they are sent back through Kafka transport.
 * Fixes "[object Object]" serialization bug in NestJS Kafka response serializer.
 */
@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => JSON.parse(JSON.stringify(data))),
    );
  }
}
