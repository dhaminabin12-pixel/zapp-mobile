import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UrgencyBadge } from '@/components/TaskCard';
import { useTasks } from '@/context/TaskContext';
import { useColors } from '@/hooks/useColors';

const TIMER_PRESETS = [
  { label: '2 min', secs: 120 },
  { label: '5 min', secs: 300 },
  { label: '15 min', secs: 900 },
  { label: '25 min', secs: 1500 },
];

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, updateTask, deleteTask, completeTask, addSub, toggleSub, deleteSub, addXP } = useTasks();

  const task = tasks.find(t => t.id === id);

  const [notes, setNotes] = useState(task?.notes ?? '');
  const [newSub, setNewSub] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(task?.name ?? '');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (task) {
      setNotes(task.notes ?? '');
      setNameVal(task.name);
    }
  }, [task?.id]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSecs(prev => {
          if (prev <= 0) {
            setTimerRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          if (prev % 60 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  if (!task) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Task not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeTask(task.id);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete task?', task.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteTask(task.id);
          router.back();
        }
      },
    ]);
  };

  const handleStart = () => {
    if (!task.started) {
      updateTask(task.id, { started: true, startedAt: Date.now() });
      addXP(10);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    if (selectedPreset !== null && timerSecs === 0) {
      setTimerSecs(selectedPreset);
    }
    setTimerRunning(r => !r);
  };

  const handleAddSub = () => {
    const val = newSub.trim();
    if (!val) return;
    addSub(task.id, val);
    setNewSub('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveNotes = (v: string) => {
    setNotes(v);
    updateTask(task.id, { notes: v });
  };

  const saveName = () => {
    const v = nameVal.trim();
    if (v) updateTask(task.id, { name: v });
    setEditName(false);
  };

  const doneSubCount = (task.subs ?? []).filter(s => s.done).length;
  const subPct = task.subs?.length ? (doneSubCount / task.subs.length) * 100 : 0;
  const timerPct = selectedPreset ? ((selectedPreset - timerSecs) / selectedPreset) * 100 : 0;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topbar, { paddingTop: topPad + 4, backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]} numberOfLines={1}>
          {task.name.length > 22 ? task.name.slice(0, 22) + '…' : task.name}
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => setEditName(true)}
        >
          <Feather name="edit-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.heroEmoji}>{task.emoji ?? '🎯'}</Text>
          {editName ? (
            <TextInput
              style={[styles.heroNameInput, { color: colors.foreground, borderColor: colors.primary }]}
              value={nameVal}
              onChangeText={setNameVal}
              onBlur={saveName}
              onSubmitEditing={saveName}
              autoFocus
              multiline
            />
          ) : (
            <Text style={[styles.heroName, { color: colors.foreground }]}>{task.name}</Text>
          )}
          <View style={styles.heroBadges}>
            <UrgencyBadge urgency={task.urgency} />
            {task.done && (
              <View style={[styles.doneBadge, { backgroundColor: `${colors.success}22` }]}>
                <Text style={[styles.doneBadgeText, { color: colors.success }]}>✅ Done</Text>
              </View>
            )}
            {task.started && !task.done && (
              <View style={[styles.startedBadge, { backgroundColor: `${colors.yellow}33` }]}>
                <Text style={[styles.startedBadgeText, { color: '#a78013' }]}>🚀 Started</Text>
              </View>
            )}
          </View>
        </View>

        {!!task.firstStep && (
          <LinearGradient colors={['#52e8c8', '#00d4b4']} style={styles.fsBlock} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.fsLabel}>👣 FIRST TINY STEP</Text>
            <Text style={styles.fsText}>{task.firstStep}</Text>
          </LinearGradient>
        )}

        {!task.done && (
          <TouchableOpacity
            style={styles.justStart}
            onPress={() => {
              updateTask(task.id, { started: true, startedAt: task.startedAt ?? Date.now() });
              addXP(10);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={task.started ? [colors.success, colors.later] : [colors.soon, colors.yellow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.justStartGrad}
            >
              <Text style={styles.justStartText}>
                {task.started ? '🔥 Keep going!' : '🚀 Just Start — 2 min!'}
              </Text>
              <Text style={styles.justStartSub}>
                {task.started ? 'You already started — amazing! 💪' : "Seriously — just 2 minutes. That's all."}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>⏱ Timer</Text>
          </View>

          <View style={styles.timerPresets}>
            {TIMER_PRESETS.map(p => (
              <TouchableOpacity
                key={p.secs}
                style={[
                  styles.timerPreset,
                  { backgroundColor: selectedPreset === p.secs ? colors.primary : colors.muted, borderColor: selectedPreset === p.secs ? colors.primary : colors.border },
                ]}
                onPress={() => {
                  setSelectedPreset(p.secs);
                  setTimerSecs(p.secs);
                  setTimerRunning(false);
                }}
              >
                <Text style={[styles.timerPresetText, { color: selectedPreset === p.secs ? '#fff' : colors.mutedForeground }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPreset !== null && (
            <>
              <Text style={[styles.timerDisplay, { color: timerSecs < 60 && timerSecs > 0 ? colors.now : colors.foreground }]}>
                {fmt(timerSecs)}
              </Text>
              <View style={[styles.timerBar, { backgroundColor: colors.muted }]}>
                <LinearGradient
                  colors={[colors.soon, colors.yellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.timerFill, { width: `${timerPct}%` as any }]}
                />
              </View>
              <View style={styles.timerBtns}>
                <TouchableOpacity
                  style={[styles.timerBtn, styles.timerBtnStart, { backgroundColor: timerRunning ? colors.yellow : colors.success }]}
                  onPress={handleStart}
                >
                  <Feather name={timerRunning ? 'pause' : 'play'} size={16} color={timerRunning ? colors.foreground : '#fff'} />
                  <Text style={[styles.timerBtnText, { color: timerRunning ? colors.foreground : '#fff' }]}>
                    {timerRunning ? 'Pause' : 'Start'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: colors.muted }]}
                  onPress={() => {
                    setTimerRunning(false);
                    setTimerSecs(selectedPreset ?? 0);
                  }}
                >
                  <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>🪜 Mini-steps</Text>
            {(task.subs?.length ?? 0) > 0 && (
              <View style={[styles.subCountBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.subCountText, { color: colors.mutedForeground }]}>{doneSubCount}/{task.subs!.length}</Text>
              </View>
            )}
          </View>

          {(task.subs ?? []).length === 0 && (
            <Text style={[styles.subsEmpty, { color: colors.mutedForeground }]}>
              Break it down ✨ e.g. "drink 250ml" instead of "drink 2L"
            </Text>
          )}

          {(task.subs ?? []).map(sub => (
            <View key={sub.id} style={[styles.subRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.subTick, sub.done && { backgroundColor: colors.success, borderColor: colors.success }, { borderColor: colors.border }]}
                onPress={() => {
                  toggleSub(task.id, sub.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {sub.done && <Feather name="check" size={11} color="#fff" />}
              </TouchableOpacity>
              <Text style={[styles.subName, { color: sub.done ? colors.mutedForeground : colors.foreground, textDecorationLine: sub.done ? 'line-through' : 'none' }]}>
                {sub.name}
              </Text>
              <TouchableOpacity onPress={() => deleteSub(task.id, sub.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}

          {(task.subs ?? []).length > 0 && (
            <View style={[styles.subProgress, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={[colors.success, colors.later]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.subProgressFill, { width: `${subPct}%` as any }]}
              />
            </View>
          )}

          {!task.done && (
            <View style={styles.subAddRow}>
              <TextInput
                style={[styles.subInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Add a mini-step…"
                placeholderTextColor={colors.mutedForeground}
                value={newSub}
                onChangeText={setNewSub}
                returnKeyType="done"
                onSubmitEditing={handleAddSub}
              />
              <TouchableOpacity
                style={[styles.subAddBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddSub}
              >
                <Feather name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 8 }]}>📝 Notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Add a quick note…"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={saveNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {!task.done ? (
          <TouchableOpacity style={[styles.completeBtn, { backgroundColor: colors.success }]} onPress={handleComplete} activeOpacity={0.85}>
            <Text style={styles.completeBtnText}>✅ Mark as Complete!</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.completeBtn, { backgroundColor: colors.muted }]}>
            <Text style={[styles.completeBtnText, { color: colors.mutedForeground }]}>Already done! Great job! 🎉</Text>
          </View>
        )}

        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete}>
          <Text style={[styles.deleteLinkText, { color: colors.now }]}>Delete this task</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontWeight: '600' },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topTitle: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  scroll: { paddingHorizontal: 14, paddingTop: 4 },
  hero: { borderRadius: 18, borderWidth: 2, padding: 16, alignItems: 'center', marginBottom: 10 },
  heroEmoji: { fontSize: 42, marginBottom: 6 },
  heroName: { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  heroNameInput: { fontSize: 20, fontWeight: '800', textAlign: 'center', borderBottomWidth: 2, paddingBottom: 4, width: '100%' },
  heroBadges: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  doneBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  doneBadgeText: { fontSize: 11, fontWeight: '800' },
  startedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  startedBadgeText: { fontSize: 11, fontWeight: '800' },
  fsBlock: { borderRadius: 16, padding: 14, marginBottom: 10 },
  fsLabel: { fontSize: 10, fontWeight: '900', color: '#003e34', opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.8 },
  fsText: { fontSize: 17, fontWeight: '900', color: '#003e34', marginTop: 4 },
  justStart: { marginBottom: 10, borderRadius: 18, overflow: 'hidden' },
  justStartGrad: { padding: 18, alignItems: 'center' },
  justStartText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  justStartSub: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 2, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  timerPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timerPreset: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  timerPresetText: { fontSize: 13, fontWeight: '700' },
  timerDisplay: { fontSize: 48, fontWeight: '900', textAlign: 'center', marginBottom: 8, letterSpacing: 2 },
  timerBar: { height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 12 },
  timerFill: { height: '100%', borderRadius: 999 },
  timerBtns: { flexDirection: 'row', gap: 10 },
  timerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  timerBtnStart: { flex: 1, justifyContent: 'center' },
  timerBtnText: { fontSize: 15, fontWeight: '800' },
  subCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subCountText: { fontSize: 12, fontWeight: '700' },
  subsEmpty: { fontSize: 13, fontWeight: '600', fontStyle: 'italic', marginBottom: 8 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  subTick: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  subName: { flex: 1, fontSize: 14, fontWeight: '600' },
  subProgress: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 10 },
  subProgressFill: { height: '100%', borderRadius: 999 },
  subAddRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  subInput: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  subAddBtn: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notesInput: { borderRadius: 10, borderWidth: 1.5, padding: 12, fontSize: 14, minHeight: 80 },
  completeBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 10 },
  completeBtnText: { fontSize: 17, fontWeight: '900', color: '#fff' },
  deleteLink: { alignItems: 'center', paddingVertical: 12 },
  deleteLinkText: { fontSize: 14, fontWeight: '700' },
});
