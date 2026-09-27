import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { trainingLogsApi } from './api';
import { UpdateExerciseLogRequest } from '@/types';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { AddExerciseLogDto } from '@/hooks/useAddExerciseLog';

const DAY_MS = 24 * 60 * 60 * 1000;

// Cached data is kept (and persisted) for a week so the app works offline at the gym
export const CACHE_MAX_AGE = 7 * DAY_MS;

export const MUTATION_KEYS = {
  updateExerciseLog: ['updateExerciseLog'] as const,
  addExerciseLog: ['addExerciseLog'] as const,
  completeTraining: ['completeTraining'] as const,
};

/**
 * A session's mutations share this scope so they run one at a time, in order — also when
 * replayed after being offline, where e.g. completing must come after the logged sets.
 */
export const trainingScope = (trainingLogId: string | number) => ({ id: `training-${trainingLogId}` });

export interface UpdateExerciseLogVariables {
  exerciseLogId: number;
  data: UpdateExerciseLogRequest;
}

export interface AddExerciseLogVariables {
  trainingLogId: number;
  data: AddExerciseLogDto;
}

export interface CompleteTrainingVariables {
  trainingLogId: number;
  // When the user finished (Date.now()), which can be well before the request is sent
  completedAtMs: number;
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

// Hooks using these keys don't set onSuccess/onSettled, so the invalidation here also runs
// for mutations replayed after an app restart.
queryClient.setMutationDefaults(MUTATION_KEYS.addExerciseLog, {
  mutationFn: ({ trainingLogId, data }: AddExerciseLogVariables) =>
    trainingLogsApi.addExerciseLog(trainingLogId, data),
  onSettled: (_data, _error, { trainingLogId }: AddExerciseLogVariables) => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.training(trainingLogId.toString()) });
    void queryClient.invalidateQueries({ queryKey: ['exercises'] });
    void queryClient.invalidateQueries({ queryKey: ['workouts'] });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.library });
  },
});

queryClient.setMutationDefaults(MUTATION_KEYS.completeTraining, {
  mutationFn: ({ trainingLogId, completedAtMs }: CompleteTrainingVariables) =>
    // Measured on the device's clock at send time, so it holds regardless of time zones or clock skew
    trainingLogsApi.complete(trainingLogId, undefined, Math.max(0, Math.floor((Date.now() - completedAtMs) / 1000))),
  onSettled: (_data, _error, { trainingLogId }: CompleteTrainingVariables) => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.training(trainingLogId.toString()) });
    void queryClient.invalidateQueries({ queryKey: ['history'] });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeTraining });
  },
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
