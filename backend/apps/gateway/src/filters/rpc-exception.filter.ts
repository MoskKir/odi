import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Catches errors thrown by lastValueFrom() when a microservice
 * throws an RpcException. KafkaJS delivers them as plain Error
 * objects whose `message` is the original RpcException string/object.
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Already an HTTP exception from NestJS (guards, validation, etc.)
    if (typeof exception?.getStatus === 'function') {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();
      return response.status(status).json(
        typeof exResponse === 'string'
          ? { statusCode: status, message: exResponse }
          : exResponse,
      );
    }

    // RPC error propagated through Kafka — comes as a plain Error
    // whose message is the string thrown by RpcException
    const message = exception?.message || 'Unknown error';

    // Map known business errors to 400, everything else stays 500
    const isBusinessError =
      message.includes('Invalid email or password') ||
      message.includes('already exists') ||
      message.includes('not found') ||
      message.includes('required');

    const status = isBusinessError
      ? HttpStatus.BAD_REQUEST
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
