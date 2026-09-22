import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { trainingLogsApi } from './api';
import { UpdateExerciseLogRequest } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

// Cached data is kept (and persisted) for a week so the app works offline at the gym
export const CACHE_MAX_AGE = 7 * DAY_MS;

export const MUTATION_KEYS = {
  updateExerciseLog: ['updateExerciseLog'] as const,
};

export interface UpdateExerciseLogVariables {
  exerciseLogId: number;
  data: UpdateExerciseLogRequest;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_MAX_AGE,
    },
  },
});

// Paused (offline) mutations are persisted and resumed after an app restart, which needs
// their mutationFn registered by key rather than only inline in a hook.
queryClient.setMutationDefaults(MUTATION_KEYS.updateExerciseLog, {
  mutationFn: ({ exerciseLogId, data }: UpdateExerciseLogVariables) =>
    trainingLogsApi.updateExerciseLog(exerciseLogId, data),
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'query-cache',
});

// On web the browser's online/offline events already drive onlineManager
if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }),
  );
}

/** Drops all cached (and persisted) data, e.g. on logout so the next user starts clean. */
export async function clearQueryCache() {
  queryClient.clear();
  await persister.removeClient();
}
