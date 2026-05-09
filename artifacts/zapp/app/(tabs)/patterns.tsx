import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatternResult, useTasks } from '@/context/TaskContext';
import { useColors } from '@/hooks/useColors';

function ScoreBar({ score, color }: { score: number; color: string }) {
  const colors = useColors();
  const pct = ((score - 1) / 4) * 100;
  const label = score < 2 ? 'Low' : score < 3 ? 'Mild' : score < 4 ? 'Moderate' : 'High';
  return (
    <View style={barStyles.wrap}>
      <View style={[barStyles.track, { backgroundColor: colors.muted }]}>
        <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={[barStyles.badge, { backgroundColor: `${color}22` }]}>
        <Text style={[barStyles.badgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  track: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});

function PatternCard({ result }: { result: PatternResult }) {
  const colors = useColors();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={[styles.patternCard, { backgroundColor: colors.card, borderColor: `${result.color}44` }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      <View style={[styles.patternHeader, { borderLeftColor: result.color }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.patternName, { color: result.color }]}>{result.category}</Text>
          <ScoreBar score={result.score} color={result.color} />
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
      </View>

      {expanded && (
        <View style={styles.solutions}>
          <Text style={[styles.solutionsTitle, { color: colors.foreground }]}>💡 What helps</Text>
          {result.solutions.map((sol, i) => (
            <View key={i} style={[styles.solutionRow, { borderColor: colors.border }]}>
              <View style={[styles.dot, { backgroundColor: result.color }]} />
              <Text style={[styles.solutionText, { color: colors.foreground }]}>{sol}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function PatternsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { patterns } = useTasks();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!patterns) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>🧠 Brain Map</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🧠</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Discover Your Patterns</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Take the ADHD self-assessment to build your personal brain map. It takes about 5 minutes.
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/assessment')}
          >
            <Text style={styles.startBtnText}>Start Assessment →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sorted = [...patterns].sort((a, b) => b.score - a.score);
  const topArea = sorted[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>🧠 Brain Map</Text>
        <TouchableOpacity
          style={[styles.retakeBtn, { backgroundColor: colors.muted }]}
          onPress={() => router.push('/assessment')}
        >
          <Text style={[styles.retakeBtnText, { color: colors.mutedForeground }]}>Retake</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topCard, { backgroundColor: `${topArea.color}18`, borderColor: `${topArea.color}44` }]}>
          <Text style={[styles.topLabel, { color: topArea.color }]}>🔬 Biggest challenge</Text>
          <Text style={[styles.topArea, { color: topArea.color }]}>{topArea.category}</Text>
          <Text style={[styles.topSub, { color: colors.mutedForeground }]}>
            Focus your energy here for the biggest improvement
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All patterns</Text>

        {sorted.map((result, i) => (
          <PatternCard key={i} result={result} />
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>💬 Remember</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            These patterns are not a diagnosis. They are a map of how your brain tends to work. Understanding them is your superpower.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900' },
  retakeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  retakeBtnText: { fontSize: 13, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  startBtn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, marginTop: 8 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  scroll: { paddingHorizontal: 16 },
  topCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  topLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  topArea: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  topSub: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  patternCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    marginBottom: 10,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  patternName: { fontSize: 16, fontWeight: '800' },
  solutions: { marginTop: 12, gap: 8 },
  solutionsTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  solutionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 999, marginTop: 5, flexShrink: 0 },
  solutionText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  infoCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  infoText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
});
