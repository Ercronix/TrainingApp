import axios from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string') {
      return (data as { message: string }).message;
    }
    return 'Something went wrong';
  }
  return 'An unexpected error occurred';
};
