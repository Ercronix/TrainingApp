import { Text, TextInput, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tactile } from '@/components/Tactile';
import { useTheme } from '@/hooks/useTheme';
import { useTrainingReview } from '@/hooks/useTrainingReview';
import { TrainingLog, TrainingReview } from '@/types';
import { RATING_FIELDS, RatingField, reviewOf, sameReview } from '@/utils/ratings';

const NOTE_MAX_LENGTH = 2000;

function RatingRow({ field, value, onChange }: { field: RatingField; value: number | null; onChange: (value: number | null) => void }) {
  const c = useTheme();
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={field.icon} size={12} color={value != null ? c.accent : c.muted} />
        <Text className="text-muted text-[9px] tracking-[2px]">{field.question}</Text>
      </View>
      <View className="flex-row gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value != null && n <= value;
          return (
            <Tactile
              key={n}
              variant={on ? 'accent' : 'elevated'}
              depth={3}
              containerClassName="flex-1"
              className="h-10 rounded-sm justify-center items-center"
              // Tapping the chosen value again clears the rating
              onPress={() => onChange(value === n ? null : n)}
              accessibilityRole="button"
              accessibilityLabel={`${field.label} ${n} of 5`}
              accessibilityState={{ selected: value === n }}
            >
              <Text className={`text-sm font-mono-bold ${on ? 'text-accent-fg' : 'text-muted'}`}>{n}</Text>
            </Tactile>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Ratings (feel, energy, sleep) and a note for a session. Ratings save on each tap, the note when
 * the field loses focus or the screen closes; each save replaces the whole review and works offline.
 */
export function SessionReview({ training, title = 'HOW WAS IT?' }: { training: TrainingLog; title?: string }) {
  const c = useTheme();
  const { mutate } = useTrainingReview(String(training.id));
  const [review, setReview] = useState<TrainingReview>(() => reviewOf(training));
  const latest = useRef(review);
  const saved = useRef(review);
  const trainingLogId = training.id;

  useEffect(() => {
    latest.current = review;
  }, [review]);

  const save = useRef((next: TrainingReview) => {
    const normalized = { ...next, notes: next.notes?.trim() || null };
    if (sameReview(normalized, saved.current)) return;
    saved.current = normalized;
    mutate({ trainingLogId, review: normalized });
  }).current;

  // Leaving the screen with the note still focused saves it too
  useEffect(() => () => save(latest.current), [save]);

  const rate = (key: RatingField['key'], value: number | null) => {
    const next = { ...review, [key]: value };
    setReview(next);
    latest.current = next;
    save(next);
  };

  return (
    <View className="bg-surface rim border-edge rounded-md p-4 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-[9px] tracking-[3px]">{title}</Text>
        <Text className="text-subtle text-[9px] tracking-[1px]">OPTIONAL · 1 LOW – 5 HIGH</Text>
      </View>
      {RATING_FIELDS.map((field) => (
        <RatingRow key={field.key} field={field} value={review[field.key]} onChange={(v) => rate(field.key, v)} />
      ))}
      <TextInput
        className="bg-inset rounded px-4 py-3 text-primary text-sm"
        placeholder="Add a note: how it went, what to change..."
        placeholderTextColor={c.subtle}
        value={review.notes ?? ''}
        onChangeText={(notes) => setReview((r) => ({ ...r, notes }))}
        onBlur={() => save(latest.current)}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        keyboardAppearance={c.keyboardAppearance}
        accessibilityLabel="Session note"
        style={{ textAlignVertical: 'top', minHeight: 64 }}
      />
    </View>
  );
}

/** The ratings in one compact row, e.g. for a history card; nothing when the session isn't rated. */
export function RatingBadges({ training, className = '' }: { training: TrainingLog; className?: string }) {
  const c = useTheme();
  const given = RATING_FIELDS.filter((f) => training[f.key] != null);
  if (given.length === 0) return null;
  return (
    <View
      className={`flex-row gap-3 ${className}`}
      accessible
      accessibilityLabel={given.map((f) => `${f.label} ${training[f.key]} of 5`).join(', ')}
    >
      {given.map((f) => (
        <View key={f.key} className="flex-row items-center gap-1">
          <Ionicons name={f.icon} size={11} color={c.accent} />
          <Text className="text-muted text-[11px] font-mono-bold">{training[f.key]}</Text>
          <Text className="text-subtle text-[8px] tracking-[1px]">{f.label}</Text>
        </View>
      ))}
    </View>
  );
}
