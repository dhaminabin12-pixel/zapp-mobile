import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Task, Urgency } from '@/context/TaskContext';

const URGENCY_LABELS: Record<Urgency, string> = {
  now: '🔥 NOW',
  soon: '⏰ SOON',
  later: '🌙 LATER',
  brain: '🧠 BRAIN',
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const colors = useColors();
  const bg: Record<Urgency, string> = {
    now: `${colors.now}22`,
    soon: `${colors.soon}22`,
    later: `${colors.later}22`,
    brain: `${colors.brain}22`,
  };
  const fg: Record<Urgency, string> = {
    now: colors.now,
    soon: colors.soon,
    later: colors.later,
    brain: colors.brain,
  };
  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg[urgency] }]}>
      <Text style={[badgeStyles.text, { color: fg[urgency] }]}>{URGENCY_LABELS[urgency]}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});

interface Props {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, onPress, onToggle, onDelete }: Props) {
  const colors = useColors();

  const urgencyColor: Record<string, string> = {
    now: colors.now,
    soon: colors.soon,
    later: colors.later,
    brain: colors.brain,
  };

  const doneSubCount = (task.subs ?? []).filter(s => s.done).length;
  const totalSubCount = (task.subs ?? []).length;
  const subPct = totalSubCount > 0 ? (doneSubCount / totalSubCount) * 100 : 0;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete task?',
      `"${task.name.length > 40 ? task.name.slice(0, 40) + '…' : task.name}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
        task.done && styles.doneCard,
      ]}
      onPress={onPress}
      testID={`task-card-${task.id}`}
    >
      <View style={[styles.accent, { backgroundColor: urgencyColor[task.urgency] }]} />

      <TouchableOpacity
        style={[
          styles.tick,
          { borderColor: colors.border },
          task.done && { backgroundColor: colors.success, borderColor: colors.success },
          task.started && !task.done && { backgroundColor: colors.yellow, borderColor: colors.yellow },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={`task-toggle-${task.id}`}
      >
        {task.done && <Feather name="check" size={13} color="#fff" />}
        {task.started && !task.done && <Feather name="play" size={11} color={colors.foreground} />}
      </TouchableOpacity>

      <View style={styles.mid}>
        <Text
          style={[
            styles.name,
            { color: colors.foreground },
            task.done && { textDecorationLine: 'line-through', color: colors.mutedForeground },
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>

        {!!task.firstStep && !task.done && (
          <Text style={[styles.step, { color: colors.later }]} numberOfLines={1}>
            → {task.firstStep}
          </Text>
        )}

        {totalSubCount > 0 && (
          <View style={styles.subRow}>
            <Text style={[styles.subText, { color: colors.mutedForeground }]}>
              {doneSubCount}/{totalSubCount} steps
            </Text>
            <View style={[styles.subBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.subFill,
                  { width: `${subPct}%` as any, backgroundColor: colors.later },
                ]}
              />
            </View>
          </View>
        )}

        <UrgencyBadge urgency={task.urgency} />
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.deleteBtn, { backgroundColor: colors.muted }]}
          testID={`task-delete-${task.id}`}
        >
          <Feather name="x" size={13} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 10,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 10,
    gap: 10,
  },
  doneCard: { opacity: 0.6 },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    marginLeft: 6,
  },
  mid: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  step: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  subText: { fontSize: 11, fontWeight: '700' },
  subBar: { flex: 1, height: 4, borderRadius: 999, overflow: 'hidden', maxWidth: 80 },
  subFill: { height: '100%', borderRadius: 999 },
  right: { alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 },
  deleteBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
