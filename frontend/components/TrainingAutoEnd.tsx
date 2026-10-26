import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { onlineManager, QueryClient, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { trainingScope } from '@/services/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useActiveTraining } from '@/hooks/useActiveTraining';
import { useCompleteTraining } from '@/hooks/useTraining';
import { useRestTimerStore } from '@/store/restTimerStore';
import { useSetDraftStore } from '@/store/setDraftStore';
import { toast } from '@/utils/confirm';
import { TrainingLog } from '@/types';

// A session without any input for this long was left without finishing it
const IDLE_LIMIT_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;
// Modals over the session screen, closed to show the summary once it ends
const SESSION_MODALS = new Set(['/log-exercise', '/add-exercise']);

/**
 * When the session last had input: the server's record of it (which includes other devices),
 * and the session's changes on this device that may not have reached the server yet.
 */
function lastActivityMs(queryClient: QueryClient, training: TrainingLog): number {
  const cached = queryClient.getQueryData<TrainingLog>(QUERY_KEYS.training(String(training.id)));
  const scopeId = trainingScope(training.id).id;
  const local = queryClient.getMutationCache()
    .findAll({ predicate: (m) => m.options.scope?.id === scopeId })
    .map((m) => m.state.submittedAt);
  const times = [training.startedAt, training.lastActivityAt, cached?.lastActivityAt]
    .filter((t): t is string => !!t)
    .map(Date.parse)
    .concat(local);
  return Math.max(...times.filter(Number.isFinite));
}

/** A timed set's stopwatch is running in one of the session's exercises. */
function isTiming(training: TrainingLog): boolean {
  const { drafts } = useSetDraftStore.getState();
  return training.exercises.some((e) => drafts[String(e.id)]?.timing != null);
}

/**
 * Ends the session in progress once it has had no input for 30 minutes, backdated to the last
 * input so its duration doesn't include the idle time. Checked every minute while the app is
 * open and when it comes back to the foreground, so a session left behind also ends on the next
 * start. Like finishing by hand it works offline, and the request is sent once back online.
 */
export function TrainingAutoEnd() {
  const { activeTraining } = useActiveTraining();
  const queryClient = useQueryClient();
  const completeTraining = useCompleteTraining(String(activeTraining?.id ?? ''));
  const router = useRouter();
  const pathname = usePathname();
  const activeId = activeTraining?.id;

  // The checks run from a timer, so they read the latest of these through a ref
  const latest = useRef({ activeTraining, completeTraining, router, pathname });
  useEffect(() => {
    latest.current = { activeTraining, completeTraining, router, pathname };
  });

  useEffect(() => {
    let checking = false;

    const isIdle = (training: TrainingLog) =>
      Date.now() - lastActivityMs(queryClient, training) >= IDLE_LIMIT_MS
      && useRestTimerStore.getState().endTime == null
      && !isTiming(training);

    const check = async () => {
      const training = latest.current.activeTraining;
      if (checking || !training || !isIdle(training)) return;
      checking = true;
      try {
        if (onlineManager.isOnline()) {
          // Make sure nothing was logged since, e.g. on another device
          const fresh = await queryClient.fetchQuery({
            queryKey: QUERY_KEYS.training(String(training.id)),
            queryFn: () => trainingLogsApi.getById(training.id),
            staleTime: 0,
            retry: false,
          });
          if (fresh.isCompleted) {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeTraining });
            return;
          }
          if (!isIdle(fresh)) return;
        }
      } catch {
        // Try again on the next check
        return;
      } finally {
        checking = false;
      }
      // The training may have changed while the check waited for the server
      const { activeTraining: current, completeTraining: complete, router: nav, pathname: path } = latest.current;
      if (current?.id !== training.id) return;

      complete.mutate({ trainingLogId: training.id, completedAtMs: lastActivityMs(queryClient, training) });
      useSetDraftStore.getState().clearDrafts(training.exercises.map((e) => String(e.id)));
      toast('Session ended', 'No input for 30 minutes', 'stop-circle-outline');
      if (path === '/training' || SESSION_MODALS.has(path)) {
        if (SESSION_MODALS.has(path)) nav.dismiss();
        nav.replace({ pathname: '/session-summary' as any, params: { trainingLogId: String(training.id) } });
      }
    };

    void check();
    const timer = setInterval(() => void check(), CHECK_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
    // Re-run for a new session, so one restored from the cache on startup is checked right away
  }, [queryClient, activeId]);

  return null;
}
