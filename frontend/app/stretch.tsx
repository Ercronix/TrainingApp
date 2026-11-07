import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useStretchRoutine } from '@/hooks/useStretchRoutine';
import { useStretchCheckIns } from '@/hooks/useStretchCheckIns';
import { useStretchReminder } from '@/hooks/useStretchReminder';
import { confirm } from '@/utils/confirm';
import { formatAmount, formatClock, routineSeconds } from '@/utils/stretch';
import SwipeableRow from '@/components/SwipeableRow';
import { StretchItem } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { Tactile } from '@/components/Tactile';

/** The daily stretch routine: its stretches in order, swipe to edit or delete. */
export default function StretchRoutineScreen() {
  const router = useRouter();
  const { routine, items, isLoading, isRefetching, refetch, deleteItem, reorderItems } = useStretchRoutine();
  const { streak } = useStretchCheckIns();
  const { reminder } = useStretchReminder();
  const [reorderMode, setReorderMode] = useState(false);
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const name = routine?.name ?? 'Daily stretch';

  const editItem = (item: StretchItem) =>
    router.push({ pathname: '/stretch-item' as any, params: { itemId: item.id.toString() } });

  const handleDelete = (item: StretchItem) => {
    confirm('Delete Stretch', `Delete "${item.name}"?`, () => deleteItem.mutate(item.id), 'Delete');
  };

  const handleDragEnd = ({ data }: { data: StretchItem[] }) => {
    reorderItems.mutate(data.map((item, index) => ({ id: item.id, orderIndex: index })));
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<StretchItem>) => (
    <ScaleDecorator>
      <SwipeableRow
        enabled={!reorderMode}
        rightActions={[
          {
            icon: 'pencil-outline',
            color: c.accent,
            backgroundColor: c.accentMuted,
            label: 'EDIT',
            onPress: () => editItem(item),
          },
          {
            icon: 'trash-outline',
            color: c.danger,
            backgroundColor: c.dangerMuted,
            label: 'DELETE',
            onPress: () => handleDelete(item),
          },
        ]}
      >
        <TouchableOpacity
          // Rows only get the swipeable's gap while it is enabled
          className={`rounded-md border-2 border-b-[6px] px-5 py-5 flex-row items-center gap-3 ${reorderMode ? 'mb-2' : ''} ${isActive ? 'bg-elevated border-accent' : 'bg-surface border-edge'}`}
          onPress={() => {
            if (!reorderMode) editItem(item);
          }}
          onLongPress={reorderMode ? drag : undefined}
          delayLongPress={100}
          disabled={isActive}
          activeOpacity={0.85}
        >
          <Text className="text-dim text-[28px] font-mono-bold tracking-tighter min-w-[36px]">
            {String((getIndex() ?? 0) + 1).padStart(2, '0')}
          </Text>
          <View className="flex-1">
            <Text className="text-primary text-lg font-bold tracking-tight mb-1" numberOfLines={1}>{item.name}</Text>
            <Text className="text-muted text-xs">
              <Text className="font-mono">{formatAmount(item)}</Text>
              {item.perSide ? ' · each side' : ''}
            </Text>
          </View>
          {reorderMode ? (
            <TouchableOpacity onLongPress={drag} delayLongPress={100} accessibilityLabel="Drag to reorder">
              <Ionicons name="reorder-three-outline" size={24} color={c.muted} />
            </TouchableOpacity>
          ) : item.perSide ? (
            <View className="bg-accent-muted rounded-sm h-[18px] pl-1.5 pr-1 justify-center">
              <Text
                className="text-accent-text text-[9px] leading-[12px] font-bold tracking-[2px]"
                style={{ includeFontPadding: false, textAlignVertical: 'center' }}
              >
                L+R
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </SwipeableRow>
    </ScaleDecorator>
  );

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color={c.accent} />
          </TouchableOpacity>
          <View className="flex-row gap-4 items-center">
            {!reorderMode && (
              <TouchableOpacity onPress={() => router.push('/stretch-reminder' as any)} accessibilityLabel="Daily reminder">
                <Ionicons
                  name={reminder?.enabled ? 'notifications' : 'notifications-outline'}
                  size={20}
                  color={reminder?.enabled ? c.accent : c.muted}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setReorderMode((v) => !v)} accessibilityLabel={reorderMode ? 'Done reordering' : 'Reorder'}>
              <Ionicons
                name={reorderMode ? 'checkmark-done-outline' : 'reorder-three-outline'}
                size={22}
                color={reorderMode ? c.accent : c.muted}
              />
            </TouchableOpacity>
            {!reorderMode && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/edit-stretch-routine' as any, params: { currentName: name } })}
                accessibilityLabel="Rename routine"
              >
                <Ionicons name="pencil-outline" size={20} color={c.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">DAILY STRETCH</Text>
        <Text className="text-primary text-[36px] font-bold tracking-tighter mb-1" numberOfLines={1}>{name}</Text>
        <Text className="text-muted text-[10px] tracking-[2px]">
          {items.length} {items.length === 1 ? 'STRETCH' : 'STRETCHES'}
          {items.length > 0 ? ` · ${formatClock(routineSeconds(items))}` : ''}
          {` · ${streak} DAY STREAK`}
          {reminder?.enabled ? ` · REMINDER\u00A0${reminder.time}` : ''}
          {reorderMode ? ' · HOLD TO REORDER' : ''}
        </Text>
      </View>

      {!reorderMode && items.length > 0 && (
        <Tactile
          className="rounded-md py-4 flex-row items-center justify-center gap-2" containerClassName="mx-4 mb-3"
          onPress={() => router.push('/stretch-session' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">START ROUTINE</Text>
        </Tactile>
      )}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={handleDragEnd}
          activationDistance={reorderMode ? 5 : 999}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 + insets.bottom }}
          refreshControl={
            !reorderMode ? <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} /> : undefined
          }
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3 px-6">
              <Ionicons name="body-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">NO STRETCHES YET</Text>
              <Text className="text-dim text-sm text-center">
                Tap + to add your stretches. They stay out of your training stats.
              </Text>
            </View>
          }
        />
      )}

      {!reorderMode && (
        <View style={{ position: 'absolute', right: 24, bottom: 32 + insets.bottom }}>
          <Link href={'/stretch-item' as any} asChild>
            <Tactile className="w-14 py-3 rounded-md items-center" accessibilityLabel="Add stretch">
              <Text className="text-accent-fg text-3xl font-bold leading-8">+</Text>
            </Tactile>
          </Link>
        </View>
      )}
    </View>
  );
}
