import axios from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) return error.response?.data ?? 'Something went wrong';
  return 'An unexpected error occurred';
};