import { View, Text, TextInput, TouchableOpacity, Switch, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStretchReminder } from '@/hooks/useStretchReminder';
import { alert } from '@/utils/confirm';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { Tactile } from '@/components/Tactile';

const PRESETS = ['07:00', '08:00', '12:00', '18:00', '21:00'];

/** "8:5" stays invalid, "8:05" becomes "08:05"; null when it isn't a time of day. */
function normalizeTime(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** ntfy's app link for a topic URL: ntfy://host/topic, with secure=false for plain http. */
function ntfyAppUrl(topicUrl: string): string {
  const insecure = topicUrl.startsWith('http://');
  return `ntfy://${topicUrl.replace(/^https?:\/\//, '')}${insecure ? '?secure=false' : ''}`;
}

/** Turns the daily ntfy reminder on or off, sets its time and shows the topic to subscribe to. */
export default function StretchReminderModal() {
  const router = useRouter();
  const c = useTheme();
  const { reminder, isLoading, updateReminder, sendTest } = useStretchReminder();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('08:00');
  const [testSent, setTestSent] = useState(false);
  const isPending = updateReminder.isPending;

  // Start from the saved settings once they arrive
  useEffect(() => {
    if (!reminder) return;
    setEnabled(reminder.enabled);
    setTime(reminder.time);
  }, [reminder]);

  const save = () => {
    const normalized = normalizeTime(time);
    if (!normalized) {
      alert('Error', 'Enter a time like 08:00');
      return;
    }
    updateReminder.mutate(
      { enabled, time: normalized, timeZone: deviceTimeZone() },
      { onSuccess: () => router.back() },
    );
  };

  const openInNtfy = () => {
    if (!reminder?.topicUrl) return;
    const topicUrl = reminder.topicUrl;
    // Without the ntfy app, the server's web app subscribes too
    Linking.openURL(ntfyAppUrl(topicUrl)).catch(() => Linking.openURL(topicUrl));
  };

  const fieldClass = 'bg-surface border-2 border-edge border-b-4 rounded px-4 py-4 text-primary font-bold tracking-tight';
  const host = reminder?.topicUrl?.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">REMINDER</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingWrapper>
      <View className="flex-1 px-6 pb-10">
        <Text className="text-primary text-[40px] font-bold tracking-tighter leading-[44px] mb-2">
          DAILY{'\n'}REMINDER
        </Text>
        <Text className="text-subtle text-sm mb-6">
          A push through ntfy, skipped on days you already stretched.
        </Text>

        {isLoading || !reminder ? (
          <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
        ) : !reminder.available ? (
          <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md px-5 py-4">
            <Text className="text-muted text-[10px] tracking-[2px] mb-1">NOT SET UP</Text>
            <Text className="text-primary text-sm">
              This server has no ntfy server configured. Set NTFY_BASE_URL on the backend to turn reminders on.
            </Text>
          </View>
        ) : (
          <>
            <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md px-5 py-4 mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-muted text-[10px] tracking-[2px] mb-1">REMIND ME</Text>
                <Text className="text-primary text-sm font-bold">
                  {enabled ? `Every day at ${normalizeTime(time) ?? time}` : 'Off'}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                disabled={isPending}
                trackColor={{ false: c.elevated, true: c.accent }}
                thumbColor={enabled ? c.accentFg : c.muted}
                accessibilityLabel="Remind me"
              />
            </View>

            <Text className="text-muted text-[9px] tracking-[3px] mb-2">TIME</Text>
            <TextInput
              className={`${fieldClass} text-lg font-mono-bold mb-3`}
              value={time}
              onChangeText={setTime}
              placeholder="08:00"
              placeholderTextColor={c.elevated}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              keyboardAppearance={c.keyboardAppearance}
              editable={!isPending}
            />
            <View className="flex-row gap-2 mb-6">
              {PRESETS.map((preset) => {
                const selected = normalizeTime(time) === preset;
                return (
                  <Tactile
                    key={preset}
                    variant={selected ? 'accent' : 'surface'}
                    depth={3}
                    className="py-3 rounded items-center"
                    containerClassName="flex-1"
                    onPress={() => setTime(preset)}
                    disabled={isPending}
                    accessibilityState={{ selected }}
                  >
                    <Text className={`text-xs font-mono-bold ${selected ? 'text-accent-fg' : 'text-primary'}`}>{preset}</Text>
                  </Tactile>
                );
              })}
            </View>

            <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md px-5 py-4 mb-6 gap-3">
              <Text className="text-muted text-[10px] tracking-[2px]">SUBSCRIBE IN NTFY</Text>
              <Text className="text-primary text-sm">
                In the ntfy app, subscribe to this topic on {host}. Keep it to yourself: anyone with the topic gets your reminders.
              </Text>
              <Text className="text-accent-text text-sm font-mono-bold" selectable>{reminder.topic}</Text>
              <View className="flex-row gap-3">
                <Tactile
                  variant="elevated"
                  depth={3}
                  className="py-3 rounded items-center"
                  containerClassName="flex-1"
                  onPress={openInNtfy}
                >
                  <Text className="text-primary text-[10px] font-bold tracking-[2px]">OPEN IN NTFY</Text>
                </Tactile>
                <Tactile
                  variant="elevated"
                  depth={3}
                  className={`py-3 rounded items-center ${sendTest.isPending ? 'opacity-50' : ''}`}
                  containerClassName="flex-1"
                  onPress={() => sendTest.mutate(undefined, { onSuccess: () => setTestSent(true) })}
                  disabled={sendTest.isPending}
                >
                  <Text className="text-primary text-[10px] font-bold tracking-[2px]">
                    {sendTest.isPending ? 'SENDING...' : testSent ? 'SENT, AGAIN?' : 'SEND TEST'}
                  </Text>
                </Tactile>
              </View>
            </View>

            <Tactile
              className={`rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
              onPress={save}
              disabled={isPending}
              activeOpacity={0.85}
            >
              <Text className="text-accent-fg text-sm font-bold tracking-[2px]">{isPending ? 'SAVING...' : 'SAVE REMINDER'}</Text>
            </Tactile>
          </>
        )}
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
