import { View, Text, TextInput, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStretchRoutine } from '@/hooks/useStretchRoutine';
import { alert } from '@/utils/confirm';
import { haptics } from '@/utils/haptics';
import { formatAmount } from '@/utils/stretch';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { Tactile } from '@/components/Tactile';
import { StretchItemRequest, StretchKind } from '@/types';

const PRESETS: Record<StretchKind, number[]> = {
  hold: [20, 30, 45, 60, 90],
  reps: [5, 8, 10, 12, 15],
};

const SUGGESTIONS = ['Hip flexor stretch', 'Pigeon pose', 'Hamstring stretch', 'Couch stretch', 'Cat-cow', "Child's pose"];

/**
 * Adds stretches to the routine, several in a row ("ADD + NEXT" keeps the form open), or edits
 * one when an itemId is passed.
 */
export default function StretchItemModal() {
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const router = useRouter();
  const c = useTheme();
  const { items, addItem, updateItem } = useStretchRoutine();
  const editing = itemId ? items.find((i) => i.id === Number(itemId)) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [kind, setKind] = useState<StretchKind>(editing?.kind ?? 'hold');
  const [amount, setAmount] = useState(String(editing?.amount ?? 30));
  const [perSide, setPerSide] = useState(editing?.perSide ?? false);
  const [note, setNote] = useState(editing?.note ?? '');
  // Stretches added since the modal opened
  const [added, setAdded] = useState<string[]>([]);
  const isPending = addItem.isPending || updateItem.isPending;

  const existing = new Set(items.map((i) => i.name.toLowerCase()));
  const suggestions = editing ? [] : SUGGESTIONS.filter((s) => !existing.has(s.toLowerCase()));

  const pickKind = (next: StretchKind) => {
    if (next === kind) return;
    setKind(next);
    setAmount(String(next === 'hold' ? 30 : 10));
  };

  /** The form as a request, or null after telling the user what's missing. */
  const request = (): StretchItemRequest | null => {
    const value = Number(amount);
    if (!name.trim()) {
      alert('Error', 'Please enter a name');
      return null;
    }
    if (!Number.isInteger(value) || value < 1 || value > 3600) {
      alert('Error', kind === 'hold' ? 'Hold time must be 1 to 3600 seconds' : 'Reps must be 1 to 3600');
      return null;
    }
    // An empty note clears it when editing
    return { name: name.trim(), kind, amount: value, perSide, note: note.trim() };
  };

  const save = (close: boolean) => {
    const data = request();
    if (!data) return;
    if (editing) {
      updateItem.mutate({ id: editing.id, data }, { onSuccess: () => router.back() });
      return;
    }
    addItem.mutate(data, {
      onSuccess: () => {
        haptics.check();
        if (close) {
          router.back();
          return;
        }
        // Keep kind, amount and side for the next one; most routines repeat them
        setAdded((prev) => [...prev, `${data.name} ${formatAmount({ kind, amount: data.amount! })}${perSide ? ' L+R' : ''}`]);
        setName('');
        setNote('');
      },
    });
  };

  const fieldClass = 'bg-surface border-2 border-edge border-b-4 rounded px-4 py-4 text-primary font-bold tracking-tight';

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">{editing ? 'EDIT STRETCH' : 'NEW STRETCH'}</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingWrapper>
      <View className="flex-1 px-6 pb-10">
        <Text className="text-primary text-[40px] font-bold tracking-tighter leading-[44px] mb-2">
          {editing ? 'EDIT\nSTRETCH' : 'ADD A\nSTRETCH'}
        </Text>
        <Text className="text-subtle text-sm mb-6">Stretches stay out of your training stats.</Text>

        {added.length > 0 && (
          <View className="bg-surface-done border-2 border-edge-done border-b-[6px] rounded-md px-4 py-3.5 mb-6 gap-2.5">
            <Text className="text-accent-text text-[10px] tracking-[3px]">{added.length} ADDED</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {added.map((label, i) => (
                <View key={i} className="bg-accent-muted rounded-sm px-2.5 py-1">
                  <Text className="text-primary text-xs">{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">STRETCH NAME *</Text>
        <TextInput
          className={`${fieldClass} text-[22px] mb-3`}
          value={name}
          onChangeText={setName}
          placeholder="Couch stretch"
          placeholderTextColor={c.elevated}
          maxLength={100}
          autoFocus={!editing}
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />
        {suggestions.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {suggestions.map((s) => (
              <TouchableOpacity key={s} className="bg-elevated rounded-sm px-2.5 py-2" onPress={() => setName(s)}>
                <Text className="text-muted text-xs">{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="flex-row gap-3 mt-2 mb-5">
          {(['hold', 'reps'] as const).map((k) => (
            <Tactile
              key={k}
              variant={kind === k ? 'accent' : 'surface'}
              depth={3}
              className="py-3 rounded items-center"
              containerClassName="flex-1"
              onPress={() => pickKind(k)}
              disabled={isPending}
              accessibilityState={{ selected: kind === k }}
            >
              <Text className={`text-[9px] font-bold tracking-[2px] ${kind === k ? 'text-accent-fg' : 'text-muted'}`}>
                {k === 'hold' ? 'HOLD' : 'REPS'}
              </Text>
            </Tactile>
          ))}
        </View>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">{kind === 'hold' ? 'SECONDS' : 'REPS'}</Text>
        <TextInput
          className={`${fieldClass} text-lg font-mono-bold mb-3`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder={kind === 'hold' ? '30' : '10'}
          placeholderTextColor={c.elevated}
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />
        <View className="flex-row gap-2 mb-5">
          {PRESETS[kind].map((v) => {
            const selected = Number(amount) === v;
            return (
              <Tactile
                key={v}
                variant={selected ? 'accent' : 'surface'}
                depth={3}
                className="py-3 rounded items-center"
                containerClassName="flex-1"
                onPress={() => setAmount(String(v))}
                disabled={isPending}
                accessibilityState={{ selected }}
              >
                <Text className={`text-xs font-mono-bold ${selected ? 'text-accent-fg' : 'text-primary'}`}>
                  {kind === 'hold' ? `${v}s` : `${v}x`}
                </Text>
              </Tactile>
            );
          })}
        </View>

        <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md px-5 py-4 mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-muted text-[10px] tracking-[2px] mb-1">EACH SIDE</Text>
            <Text className="text-primary text-sm font-bold">Left, then right</Text>
          </View>
          <Switch
            value={perSide}
            onValueChange={setPerSide}
            disabled={isPending}
            trackColor={{ false: c.elevated, true: c.accent }}
            thumbColor={perSide ? c.accentFg : c.muted}
            accessibilityLabel="Each side"
          />
        </View>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">NOTE</Text>
        <TextInput
          className="bg-surface border-2 border-edge border-b-4 rounded px-4 py-4 text-primary text-sm mb-6"
          value={note}
          onChangeText={setNote}
          placeholder="Squeeze the glute, keep hips square"
          placeholderTextColor={c.elevated}
          multiline
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />

        {editing ? (
          <Tactile
            className={`rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
            onPress={() => save(true)}
            disabled={isPending}
            activeOpacity={0.85}
          >
            <Text className="text-accent-fg text-sm font-bold tracking-[2px]">{isPending ? 'SAVING...' : 'SAVE CHANGES'}</Text>
          </Tactile>
        ) : (
          <View className="flex-row gap-3">
            <Tactile
              variant="surface"
              className={`rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
              containerClassName="flex-1"
              onPress={() => save(false)}
              disabled={isPending}
            >
              <Text className="text-primary text-sm font-bold tracking-[2px]">ADD + NEXT</Text>
            </Tactile>
            <Tactile
              className={`rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
              containerClassName="flex-1"
              onPress={() => save(true)}
              disabled={isPending}
            >
              <Text className="text-accent-fg text-sm font-bold tracking-[2px]">{isPending ? 'ADDING...' : 'ADD + CLOSE'}</Text>
            </Tactile>
          </View>
        )}
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
