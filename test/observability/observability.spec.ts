import { Metadata } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import {
  ObservabilityInterceptor,
  resolveRequestId,
} from '../../src/observability/observability.interceptor.js';

describe('ObservabilityInterceptor', () => {
  it('uses a valid incoming request ID and generates one when missing or invalid', () => {
    const metadata = new Metadata();
    metadata.set('x-request-id', 'req-2026-08-19-001');

    expect(resolveRequestId(metadata)).toBe('req-2026-08-19-001');
    expect(resolveRequestId(undefined)).toMatch(/^[0-9a-f-]{36}$/);

    const invalid = new Metadata();
    invalid.set('x-request-id', 'attacker\nrequest');
    expect(resolveRequestId(invalid)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('logs structured request context and preserves the correlation ID on errors', () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const interceptor = new ObservabilityInterceptor();
    const metadata = new Metadata();
    metadata.set('x-request-id', 'req-observability-001');

    const executionContext = {
      switchToRpc: () => ({
        getContext: () => metadata,
      }),
      getClass: () => ({ name: 'UsersGrpcController' }),
      getHandler: () => ({ name: 'getUserHandler' }),
    } as never;

    const observable = interceptor.intercept(executionContext, {
      handle: () => throwError(() => new Error('user not found')),
    });

    observable.subscribe({ error: () => undefined });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]?.[0]).toContain('rpc.request.started');
    expect(logSpy.mock.calls[0]?.[0]).toContain('req-observability-001');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const errorLog = errorSpy.mock.calls[0]?.[0] as string;
    expect(errorLog).toContain('rpc.request.failed');
    expect(errorLog).toContain('req-observability-001');
    expect(errorLog).toContain('user not found');

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('logs completion and passes successful RPC results through unchanged', () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const interceptor = new ObservabilityInterceptor();
    const executionContext = {
      switchToRpc: () => ({ getContext: () => undefined }),
      getClass: () => ({ name: 'UsersGrpcController' }),
      getHandler: () => ({ name: 'getUserHandler' }),
    } as never;

    const values: unknown[] = [];
    interceptor
      .intercept(executionContext, { handle: () => of({ ok: true }) })
      .subscribe({ next: (value) => values.push(value) });

    expect(values).toEqual([{ ok: true }]);
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls[1]?.[0]).toContain('rpc.request.completed');
    logSpy.mockRestore();
  });
});
