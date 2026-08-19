import { Metadata } from '@grpc/grpc-js';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, tap, throwError } from 'rxjs';
import { v4 as uuid } from 'uuid';

const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

export const resolveRequestId = (metadata: Metadata | undefined): string => {
  const value = metadata?.get(REQUEST_ID_HEADER)[0];
  const requestId =
    typeof value === 'string'
      ? value
      : Buffer.isBuffer(value)
        ? value.toString('utf8')
        : undefined;

  return requestId !== undefined && REQUEST_ID_PATTERN.test(requestId)
    ? requestId
    : uuid();
};

const getErrorContext = (error: unknown): {
  errorType: string;
  errorMessage: string;
  errorCode?: number | string;
} => {
  if (error instanceof Error) {
    const candidate = error as Error & { code?: number | string };
    return {
      errorType: error.constructor.name,
      errorMessage: error.message,
      ...(candidate.code !== undefined && { errorCode: candidate.code }),
    };
  }

  return {
    errorType: typeof error,
    errorMessage: 'Unknown RPC error',
  };
};

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ObservabilityInterceptor.name);
  private readonly serviceName =
    process.env.APP_NAME ?? 'arunika-coffee-api-users-service';
  private readonly environment = process.env.NODE_ENV ?? 'development';

  intercept(context: ExecutionContext, next: CallHandler) {
    const args = context.switchToRpc().getArgs();
    const metadata = args[1] instanceof Metadata ? args[1] : undefined;
    const requestId = resolveRequestId(metadata);
    const rpc = `${context.getClass().name}.${context.getHandler().name}`;
    const startedAt = performance.now();

    this.logger.log(
      JSON.stringify({
        event: 'rpc.request.started',
        service: this.serviceName,
        environment: this.environment,
        rpc,
        requestId,
      }),
    );

    return next.handle().pipe(
      tap(() => {
        const durationMs = Math.round(performance.now() - startedAt);

        this.logger.log(
          JSON.stringify({
            event: 'rpc.request.completed',
            service: this.serviceName,
            environment: this.environment,
            rpc,
            requestId,
            durationMs,
          }),
        );
      }),
      catchError((error: unknown) => {
        const durationMs = Math.round(performance.now() - startedAt);
        const errorContext = getErrorContext(error);

        this.logger.error(
          JSON.stringify({
            event: 'rpc.request.failed',
            service: this.serviceName,
            environment: this.environment,
            rpc,
            requestId,
            durationMs,
            ...errorContext,
          }),
        );

        return throwError(() => error);
      }),
    );
  }
}
