import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TimeoutError } from 'rxjs';
import { IApiResponse } from '@nx-boilerplate/api-interfaces';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof TimeoutError) {
      status = HttpStatus.GATEWAY_TIMEOUT;
      message =
        'Tiempo de espera agotado al comunicarse con el microservicio (Gateway Timeout)';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception
    ) {
      const err = exception as {
        status?: number;
        statusCode?: number;
        message?: string | object;
        code?: number;
      };
      status = err.statusCode || err.status || err.code || HttpStatus.BAD_REQUEST;
      message = err.message || 'Error en comunicación con microservicio';
    } else {
      this.logger.error(`Excepción no controlada: ${JSON.stringify(exception)}`);
    }

    const resolvedMessage =
      typeof message === 'object' && message !== null && 'message' in message
        ? String((message as { message?: unknown }).message ?? message)
        : String(message);

    const payload: IApiResponse<null> = {
      success: false,
      statusCode: status,
      message: resolvedMessage,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response
      .status(typeof status === 'number' && status >= 100 && status <= 599 ? status : 500)
      .json(payload);
  }
}

