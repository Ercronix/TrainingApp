import axios from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string') {
      return (data as { message: string }).message;
    }
    // The backend's 429s carry a message; this covers one without (e.g. from a proxy)
    if (error.response?.status === 429) return tooManyAttempts(error.response.headers?.['retry-after']);
    return 'Something went wrong';
  }
  return 'An unexpected error occurred';
};

// Retry-After in seconds; the HTTP-date form isn't sent by the backend
function tooManyAttempts(retryAfter: unknown): string {
  const seconds = Number(retryAfter);
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Too many attempts, try again later';
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts, try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}
