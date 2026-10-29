export type ResultStatus = 'success' | 'failure';

export interface Success<T> {
  readonly status: 'success';
  readonly value: T;
  isSuccess(): true;
  isFailure(): false;
}

export interface Failure {
  readonly status: 'failure';
  readonly error: Error;
  isSuccess(): false;
  isFailure(): true;
}

export type Result<T> = Success<T> | Failure;

export const ok = <T>(value: T): Result<T> => ({
  status: 'success' as const,
  value,
  isSuccess: () => true,
  isFailure: () => false,
});

export const err = (error: Error): Result<never> => ({
  status: 'failure' as const,
  error,
  isSuccess: () => false,
  isFailure: () => true,
});
