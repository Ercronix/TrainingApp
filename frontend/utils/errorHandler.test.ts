import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { getErrorMessage } from '@/utils/errorHandler';

const httpError = (data: unknown) => {
  const response = { data, status: 400, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() } } as AxiosResponse;
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

  it('is generic for anything that is not an HTTP error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
