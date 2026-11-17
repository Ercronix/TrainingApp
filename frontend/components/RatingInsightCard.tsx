import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TrainingLog } from '@/types';
import { formatSigned } from '@/utils/stats';
import { FactorInsight, HIGH_RATING, RATING_FIELDS, RatingGroup, computeRatingInsight } from '@/utils/ratings';

function GroupRow({ label, group }: { label: string; group: RatingGroup }) {
  const volume = group.volumeVsUsualPct;
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-muted text-[9px] tracking-[1.5px] w-24" numberOfLines={1}>
        {label} · {group.sessions}
      </Text>
      <Text
        className={`flex-1 text-xs font-mono-bold ${volume == null ? 'text-muted' : volume >= 0 ? 'text-accent-text' : 'text-danger'}`}
        numberOfLines={1}
      >
        {volume == null ? '—' : formatSigned(volume, 0, '%')}
        <Text className="text-muted text-[10px] font-mono"> vol · {group.prsPerSession.toFixed(1)} PRs</Text>
      </Text>
      {group.avgFeel != null && (
        <Text className="text-muted text-[10px]">felt {group.avgFeel.toFixed(1)}</Text>
      )}
    </View>
  );
}

function FactorRow({ factor }: { factor: FactorInsight }) {
  const c = useTheme();
  const field = RATING_FIELDS.find((f) => f.key === factor.key)!;
  const diff = factor.volumeDiffPct;
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-2">
        <Ionicons name={field.icon} size={14} color={c.accent} />
        <Text className="text-primary text-sm font-bold flex-1">{factor.key === 'sleep' ? 'Sleep' : 'Energy'}</Text>
        {diff != null && (
          <Text className={`text-sm font-mono-bold ${diff >= 0 ? 'text-accent-text' : 'text-danger'}`}>
            {formatSigned(diff, 0, '%')}
          </Text>
        )}
      </View>
      {diff != null && (
        <Text className="text-muted text-[11px]">
          {Math.abs(diff) < 0.5
            ? `No difference in volume between good and poor ${factor.key}`
            : `${Math.round(Math.abs(diff))}% ${diff > 0 ? 'more' : 'less'} volume when ${factor.key} is ${HIGH_RATING}–5`}
        </Text>
      )}
      <View className="bg-inset rounded p-2.5 gap-1.5">
        <GroupRow label={`HIGH ${HIGH_RATING}–5`} group={factor.high} />
        <GroupRow label={`LOW 1–${HIGH_RATING - 1}`} group={factor.low} />
      </View>
    </View>
  );
}

/**
 * Energy and sleep ratings against performance. Hidden until both a high and a low group of rated
 * sessions are big enough to compare.
 */
export function RatingInsightCard({ logs }: { logs: TrainingLog[] }) {
  const insight = useMemo(() => computeRatingInsight(logs), [logs]);
  if (insight.factors.length === 0) return null;
  return (
    <View className="mx-4 mb-3 bg-surface rim border-edge rounded-md p-5 gap-4">
      <View>
        <Text className="text-muted text-[9px] tracking-[3px] mb-1">HOW YOU FEEL VS HOW YOU LIFT</Text>
        <Text className="text-muted text-[10px]">
          Volume against each workout&apos;s usual, and records per session · {insight.ratedSessions} rated sessions
        </Text>
      </View>
      {insight.factors.map((factor) => <FactorRow key={factor.key} factor={factor} />)}
    </View>
  );
}
