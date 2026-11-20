import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { getErrorMessage } from '@/utils/errorHandler';

const httpError = (data: unknown, status = 400, headers: Record<string, string> = {}) => {
  const response = { data, status, statusText: 'Bad Request', headers, config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
};

describe('getErrorMessage', () => {
  it('uses the server\'s message', () => {
    expect(getErrorMessage(httpError({ message: 'Username taken' }))).toBe('Username taken');
    expect(getErrorMessage(httpError('Plain text error'))).toBe('Plain text error');
  });

  it('falls back for responses without a usable message', () => {
    expect(getErrorMessage(httpError(''))).toBe('Something went wrong');
    expect(getErrorMessage(httpError({ message: 42 }))).toBe('Something went wrong');
    expect(getErrorMessage(httpError(null))).toBe('Something went wrong');
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe('Something went wrong');
  });

  it('explains a 429 without a message from its Retry-After', () => {
    expect(getErrorMessage(httpError({ message: 'Too many attempts, try again in 3 minutes' }, 429)))
      .toBe('Too many attempts, try again in 3 minutes');
    expect(getErrorMessage(httpError('', 429, { 'retry-after': '600' }))).toBe('Too many attempts, try again in 10 minutes');
    expect(getErrorMessage(httpError('', 429, { 'retry-after': '20' }))).toBe('Too many attempts, try again in 1 minute');
    expect(getErrorMessage(httpError('', 429))).toBe('Too many attempts, try again later');
  });

  it('is generic for anything that is not an HTTP error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
