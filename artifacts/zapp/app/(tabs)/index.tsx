import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TaskCard from '@/components/TaskCard';
import { Urgency, useTasks } from '@/context/TaskContext';
import { useColors } from '@/hooks/useColors';

const MASCOT_MSGS = [
  "Hey! What do you wanna zap today? ⚡",
  "Even 2 minutes counts. Let's go! 🚀",
  "You've got this. Pick one thing 🎯",
  "Progress > perfection. Start small 💫",
  "Your brain is amazing. Trust it 🧠",
];

const URGENCY_OPTIONS: { key: Urgency; label: string; emoji: string }[] = [
  { key: 'now', label: 'Do it NOW', emoji: '🔥' },
  { key: 'soon', label: 'Do it SOON', emoji: '⏰' },
  { key: 'later', label: 'Later', emoji: '🌙' },
  { key: 'brain', label: 'Brain dump', emoji: '🧠' },
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, xp, addTask, updateTask, deleteTask, completeTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [firstStep, setFirstStep] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('now');
  const [mascotMsg, setMascotMsg] = useState(MASCOT_MSGS[0]);
  const [filter, setFilter] = useState<'all' | Urgency>('all');
  const slideAnim = useRef(new Animated.Value(400)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const i = setInterval(() => {
      setMascotMsg(MASCOT_MSGS[Math.floor(Math.random() * MASCOT_MSGS.length)]);
    }, 8000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (showAdd) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      Animated.timing(slideAnim, { toValue: 400, useNativeDriver: true, duration: 220 }).start();
    }
  }, [showAdd]);

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  const urgent = pending.filter(t => t.urgency === 'now');
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  const filteredPending = filter === 'all' ? pending : pending.filter(t => t.urgency === filter);

  const handleAdd = () => {
    const name = taskName.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTask(name, urgency, firstStep.trim());
    setTaskName('');
    setFirstStep('');
    setUrgency('now');
    setShowAdd(false);
  };

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (task.done) {
      updateTask(id, { done: false });
    } else {
      completeTask(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.logo, { color: colors.foreground }]}>ZAPP!</Text>
          <Text style={styles.logoEmoji}>⚡</Text>
        </View>
        <View style={[styles.xpBadge, { backgroundColor: colors.yellow }]}>
          <Text style={[styles.xpText, { color: colors.foreground }]}>XP {xp}</Text>
        </View>
      </View>

      <View style={styles.mascotRow}>
        <Text style={styles.mascotEmoji}>🦄</Text>
        <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bubbleText, { color: colors.foreground }]}>{mascotMsg}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.success }]}>{done.length}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>DONE ✅</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.soon }]}>{pending.length}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>PENDING ⏳</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.now }]}>{urgent.length}</Text>
          <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>URGENT 🔥</Text>
        </View>
      </View>

      <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.progressHead}>
          <Text style={[styles.progressLabel, { color: colors.foreground }]}>Today's Progress</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{pct}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <LinearGradient
            colors={[colors.primary, colors.yellow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${pct}%` as any }]}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: filter === 'all' ? colors.primary : colors.muted, borderColor: filter === 'all' ? colors.primary : colors.border },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { color: filter === 'all' ? '#fff' : colors.mutedForeground }]}>⚡ All</Text>
        </TouchableOpacity>
        {URGENCY_OPTIONS.map(u => (
          <TouchableOpacity
            key={u.key}
            style={[
              styles.filterChip,
              { backgroundColor: filter === u.key ? colors.primary : colors.muted, borderColor: filter === u.key ? colors.primary : colors.border },
            ]}
            onPress={() => setFilter(u.key)}
          >
            <Text style={[styles.filterText, { color: filter === u.key ? '#fff' : colors.mutedForeground }]}>
              {u.emoji} {u.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={[...filteredPending, ...done]}
        keyExtractor={t => t.id}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="check-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>All clear! Tap + to add a task</Text>
          </View>
        }
        renderItem={({ item: task }) => (
          <TaskCard
            task={task}
            onPress={() => router.push(`/task/${task.id}`)}
            onToggle={() => handleToggle(task.id)}
            onDelete={() => deleteTask(task.id)}
          />
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 90 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAdd(true);
        }}
        activeOpacity={0.85}
        testID="add-task-fab"
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="none" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Pressable onPress={() => {}} style={styles.sheetInner}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add a Zapp ⚡</Text>

              <TextInput
                ref={inputRef}
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="What do you need to do?"
                placeholderTextColor={colors.mutedForeground}
                value={taskName}
                onChangeText={setTaskName}
                returnKeyType="next"
                testID="task-name-input"
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="First tiny step (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={firstStep}
                onChangeText={setFirstStep}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                testID="task-first-step-input"
              />

              <View style={styles.pills}>
                {URGENCY_OPTIONS.map(u => (
                  <TouchableOpacity
                    key={u.key}
                    style={[
                      styles.pill,
                      { backgroundColor: urgency === u.key ? colors.primary : colors.muted, borderColor: urgency === u.key ? colors.primary : colors.border },
                    ]}
                    onPress={() => setUrgency(u.key)}
                    testID={`urgency-${u.key}`}
                  >
                    <Text style={[styles.pillText, { color: urgency === u.key ? '#fff' : colors.mutedForeground }]}>
                      {u.emoji} {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary, opacity: taskName.trim() ? 1 : 0.5 }]}
                onPress={handleAdd}
                disabled={!taskName.trim()}
                testID="submit-task-btn"
              >
                <Text style={styles.addBtnText}>Zap it! ⚡</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  logoEmoji: { fontSize: 24 },
  xpBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  xpText: { fontSize: 13, fontWeight: '900' },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  mascotEmoji: { fontSize: 32 },
  bubble: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 10 },
  bubbleText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  stats: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLbl: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  progressCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 2, padding: 12, marginBottom: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '700' },
  progressPct: { fontSize: 13, fontWeight: '900' },
  progressBar: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingRight: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5 },
  filterText: { fontSize: 12, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff5fa0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
  },
  sheetInner: { padding: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '900', marginBottom: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  pillText: { fontSize: 13, fontWeight: '700' },
  addBtn: { borderRadius: 16, padding: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
