import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PatternResult, useTasks } from '@/context/TaskContext';
import { useColors } from '@/hooks/useColors';

const CATEGORIES = [
  {
    category: 'Task Initiation',
    color: '#ff5fa0',
    questions: [
      'I delay starting tasks even when I know I should begin',
      'I need the "perfect moment" before I can start',
      'Getting started feels harder than actually doing the work',
      'I procrastinate on important tasks',
      'I wait until the last minute before starting',
      'Small tasks feel overwhelming to begin',
      "I can't start if the environment isn't right",
      'I make excuses to delay starting',
      'Even easy tasks feel hard to initiate',
      'I need external pressure to get moving',
    ],
    solutions: [
      'Use the 2-minute rule: if it takes less than 2 min, do it now',
      'Commit to just starting, not finishing',
      'Set a visual countdown timer before beginning',
      'Create "if-then" plans: "If it\'s 9am, I will start X"',
      'Use external accountability — tell someone your plan',
    ],
  },
  {
    category: 'Time Blindness',
    color: '#ff8c42',
    questions: [
      'I underestimate how long tasks will take',
      'I lose track of time while doing something',
      "I'm often late to appointments or deadlines",
      "I don't notice time passing when absorbed in something",
      'I forget to take breaks',
      'I misjudge how much time is left for a deadline',
      "I'm surprised when it's much later than I thought",
      'I struggle to plan time for multiple tasks',
      'I often run out of time before finishing',
      "I can't sense how long 15 minutes feels",
    ],
    solutions: [
      'Use visual timers (Time Timer or analog clock)',
      'Set alarms 15 minutes before every appointment',
      'Practice "time audits" — track how long tasks actually take',
      'Build in buffer time — double your estimates',
      'Use transition alarms to signal when to shift tasks',
    ],
  },
  {
    category: 'Impulsivity',
    color: '#c084fc',
    questions: [
      'I say things without thinking them through',
      'I interrupt others mid-sentence',
      'I act before considering consequences',
      "I make purchases I didn't plan to make",
      'I change plans impulsively',
      'I give up tasks when something more interesting appears',
      'I react emotionally before calming down',
      'I switch activities without finishing the current one',
      'I send messages I later regret',
      "I take risks without fully thinking them through",
    ],
    solutions: [
      'Use a 24-hour waiting rule for purchases',
      'Write thoughts down instead of saying them immediately',
      'Practice the STOP technique: Stop, Think, Observe, Plan',
      'Create a "parking lot" list for random thoughts mid-task',
      'Delay responses — draft messages but wait before sending',
    ],
  },
  {
    category: 'Emotional Regulation',
    color: '#4ddd88',
    questions: [
      'Small frustrations trigger big emotional reactions',
      'I feel overwhelmed by feedback or criticism',
      "I get deeply affected by others' moods",
      'My emotions shift rapidly',
      'I struggle to calm down after being upset',
      'I feel emotions more intensely than others',
      'Rejection hurts me more than it should',
      "I get irritable when things don't go as planned",
      'I feel guilt or shame more than others',
      'My emotions interfere with my daily functioning',
    ],
    solutions: [
      'Practice box breathing: 4 counts in, hold, out, hold',
      'Name your emotion to reduce its intensity ("name it to tame it")',
      'Create a personal "calm down" toolkit',
      'Identify emotional triggers before they escalate',
      'Build self-compassion: ADHD affects emotion regulation',
    ],
  },
  {
    category: 'Organisation',
    color: '#ffdb3b',
    questions: [
      'My living or work space is often disorganised',
      'I lose items like keys or phone regularly',
      'I struggle to maintain systems and routines',
      'I forget where I put things',
      'My files and documents are hard to manage',
      "I can't keep up with daily maintenance tasks",
      "I start organising but don't finish",
      'My bag or desk is usually cluttered',
      "I miss appointments I haven't written down",
      'I struggle to maintain a consistent routine',
    ],
    solutions: [
      'Use a "landing zone" — a single spot for keys, wallet, phone',
      'Adopt "a place for everything, everything in its place"',
      'Use visual storage — clear boxes and open shelves',
      'Reset your space for 10 minutes every evening',
      'Keep only what you currently need on your desk',
    ],
  },
  {
    category: 'Consistency',
    color: '#00d4b4',
    questions: [
      "I'm productive some days and not at all others",
      'I do well for a while then fall off completely',
      'My performance is unpredictable',
      'I struggle to maintain habits long-term',
      'I start projects enthusiastically but lose momentum',
      'People find me unreliable even when I try hard',
      'I often forget commitments I made recently',
      "I can't maintain the same effort daily",
      'My mood affects my ability to function',
      'I go through phases of productivity and burnout',
    ],
    solutions: [
      'Stack new habits onto existing ones ("habit stacking")',
      'Aim for consistency over perfection — 50% is better than 0%',
      'Track streaks visually to build momentum',
      'Identify your peak performance hours and protect them',
      'Plan for bad days — have a minimal viable routine',
    ],
  },
  {
    category: 'Motivation',
    color: '#5b9fff',
    questions: [
      'I can only do tasks that genuinely interest me',
      'Boring but important tasks feel impossible',
      'I need urgency or a deadline to feel motivated',
      "I procrastinate because nothing feels worth doing",
      'Interest-based motivation overrides importance',
      'I get excited about ideas but rarely follow through',
      'I lose motivation midway through projects',
      "External rewards don't motivate me effectively",
      'I struggle to do things for future benefits',
      'I need novelty to stay engaged',
    ],
    solutions: [
      'Create artificial urgency with self-imposed deadlines',
      'Gamify boring tasks — score points, beat your own time',
      'Pair unpleasant tasks with something enjoyable',
      'Find the interesting angle in any task',
      'Use the "body double" method for low-motivation tasks',
    ],
  },
];

export default function AssessmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savePatterns } = useTasks();

  const [page, setPage] = useState(0);
  const [scores, setScores] = useState<Record<string, number[]>>(
    () => Object.fromEntries(CATEGORIES.map(c => [c.category, new Array(c.questions.length).fill(0)]))
  );
  const [submitted, setSubmitted] = useState(false);

  const cat = CATEGORIES[page];
  const catScores = scores[cat.category];
  const answeredAll = catScores.every(s => s > 0);
  const totalPages = CATEGORIES.length;
  const overallProgress = CATEGORIES.reduce((acc, c) => {
    const s = scores[c.category];
    const answered = s.filter((v: number) => v > 0).length;
    return acc + answered / c.questions.length / totalPages;
  }, 0);

  const handleRate = (qIdx: number, val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScores(prev => ({
      ...prev,
      [cat.category]: prev[cat.category].map((v: number, i: number) => i === qIdx ? val : v),
    }));
  };

  const handleNext = () => {
    if (page < totalPages - 1) {
      setPage(p => p + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const results: PatternResult[] = CATEGORIES.map(c => {
      const catScore = scores[c.category];
      const avg = catScore.reduce((a: number, b: number) => a + b, 0) / catScore.length;
      return {
        category: c.category,
        score: parseFloat(avg.toFixed(2)),
        color: c.color,
        solutions: c.solutions,
      };
    });
    savePatterns(results);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.doneWrap, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 40 }]}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>Assessment Complete!</Text>
          <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
            Your brain map is ready. Understanding your patterns is the first step.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => { router.dismissAll(); router.push('/(tabs)/patterns'); }}
          >
            <Text style={styles.doneBtnText}>View My Brain Map →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topbar, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => page > 0 ? setPage(p => p - 1) : router.back()}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[styles.topTitle, { color: colors.foreground }]}>{cat.category}</Text>
          <Text style={[styles.topSub, { color: colors.mutedForeground }]}>{page + 1} of {totalPages}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFg, { width: `${overallProgress * 100}%` as any, backgroundColor: cat.color }]} />
        </View>
        <Text style={[styles.progressTxt, { color: colors.mutedForeground }]}>
          {Math.round(overallProgress * 100)}% complete
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.catHeader, { backgroundColor: `${cat.color}18`, borderColor: `${cat.color}44` }]}>
          <Text style={[styles.catTitle, { color: cat.color }]}>🧩 {cat.category}</Text>
          <Text style={[styles.catSub, { color: colors.mutedForeground }]}>Rate how often each applies to you</Text>
        </View>

        {cat.questions.map((q, qi) => (
          <View key={qi} style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.qNum, { color: colors.mutedForeground }]}>Q{qi + 1}</Text>
            <Text style={[styles.qText, { color: colors.foreground }]}>{q}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.ratingBtn,
                    catScores[qi] === val && { backgroundColor: cat.color },
                    { borderColor: catScores[qi] === val ? cat.color : colors.border },
                  ]}
                  onPress={() => handleRate(qi, val)}
                >
                  <Text style={[styles.ratingNum, { color: catScores[qi] === val ? '#fff' : colors.mutedForeground }]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ratingLabels}>
              <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>Never</Text>
              <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>Always</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.nextWrap, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: answeredAll ? cat.color : colors.muted, opacity: answeredAll ? 1 : 0.7 }]}
          onPress={handleNext}
          disabled={!answeredAll}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: answeredAll ? '#fff' : colors.mutedForeground }]}>
            {page < totalPages - 1 ? `Next: ${CATEGORIES[page + 1].category} →` : '🎉 Complete Assessment'}
          </Text>
        </TouchableOpacity>
        {!answeredAll && (
          <Text style={[styles.nextHint, { color: colors.mutedForeground }]}>
            Answer all {cat.questions.length} questions to continue
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '800' },
  topSub: { fontSize: 12, fontWeight: '600' },
  progressWrap: { paddingHorizontal: 16, marginBottom: 12, gap: 4 },
  progressBg: { height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFg: { height: '100%', borderRadius: 999 },
  progressTxt: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  scroll: { paddingHorizontal: 14 },
  catHeader: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  catTitle: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  catSub: { fontSize: 13, fontWeight: '600' },
  qCard: { borderRadius: 14, borderWidth: 2, padding: 12, marginBottom: 10 },
  qNum: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  qText: { fontSize: 15, fontWeight: '600', lineHeight: 20, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  ratingBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNum: { fontSize: 16, fontWeight: '900' },
  ratingLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  ratingLabel: { fontSize: 10, fontWeight: '600' },
  nextWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  nextBtn: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '900' },
  nextHint: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  doneEmoji: { fontSize: 72 },
  doneTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  doneSub: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  doneBtn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, marginTop: 8 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
