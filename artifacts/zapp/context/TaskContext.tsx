import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type Urgency = 'now' | 'soon' | 'later' | 'brain';

export interface Sub {
  id: string;
  name: string;
  done: boolean;
}

export interface Task {
  id: string;
  name: string;
  urgency: Urgency;
  done: boolean;
  started: boolean;
  priority: boolean;
  firstStep: string;
  notes: string;
  subs: Sub[];
  createdAt: number;
  startedAt: number | null;
  emoji: string;
}

export interface PatternResult {
  category: string;
  score: number;
  color: string;
  solutions: string[];
}

interface TaskContextType {
  tasks: Task[];
  xp: number;
  streak: number;
  patterns: PatternResult[] | null;
  loaded: boolean;
  addTask: (name: string, urgency: Urgency, firstStep?: string) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addSub: (taskId: string, name: string) => void;
  toggleSub: (taskId: string, subId: string) => void;
  deleteSub: (taskId: string, subId: string) => void;
  savePatterns: (results: PatternResult[]) => void;
  addXP: (amount: number) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

const SEEDS: { name: string; urgency: Urgency; firstStep: string }[] = [
  { name: 'Drink a glass of water 💧', urgency: 'now', firstStep: 'Walk to the kitchen' },
  { name: 'Stretch for 2 minutes 🧘', urgency: 'now', firstStep: 'Stand up right now' },
  { name: 'Reply to that one message 💬', urgency: 'soon', firstStep: 'Open the app' },
  { name: 'Tidy your desk a little 🗂', urgency: 'soon', firstStep: 'Pick up one thing' },
  { name: 'Plan tomorrow (just 3 things) 📝', urgency: 'soon', firstStep: '' },
  { name: 'Take a 10 min walk outside 🌳', urgency: 'later', firstStep: 'Put on your shoes' },
  { name: 'Read 1 page of a book 📖', urgency: 'later', firstStep: 'Open to any page' },
  { name: 'Idea: weekend trip somewhere ✈️', urgency: 'brain', firstStep: '' },
  { name: 'Maybe try a new recipe 🍳', urgency: 'brain', firstStep: '' },
  { name: 'Remember to breathe 🌬', urgency: 'now', firstStep: 'In for 4, out for 6' },
];

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [patterns, setPatterns] = useState<PatternResult[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [t, x, s, p, seeded] = await Promise.all([
          AsyncStorage.getItem('zm_tasks'),
          AsyncStorage.getItem('zm_xp'),
          AsyncStorage.getItem('zm_streak'),
          AsyncStorage.getItem('zm_patterns'),
          AsyncStorage.getItem('zm_seeded'),
        ]);
        const loadedTasks: Task[] = t ? JSON.parse(t) : [];
        const loadedXp = x ? parseInt(x) : 0;
        const loadedStreak = s ? parseInt(s) : 0;
        const loadedPatterns = p ? JSON.parse(p) : null;

        if (loadedTasks.length === 0 && !seeded) {
          const now = Date.now();
          const seededTasks: Task[] = SEEDS.map((seed, i) => ({
            id: String(now + i),
            name: seed.name,
            urgency: seed.urgency,
            done: false,
            started: false,
            priority: false,
            firstStep: seed.firstStep,
            notes: '',
            subs: [],
            createdAt: now - i * 60000,
            startedAt: null,
            emoji: '🎯',
          }));
          setTasks(seededTasks);
          await AsyncStorage.multiSet([
            ['zm_tasks', JSON.stringify(seededTasks)],
            ['zm_seeded', '1'],
          ]);
        } else {
          setTasks(loadedTasks);
        }
        setXp(loadedXp);
        setStreak(loadedStreak);
        setPatterns(loadedPatterns);
      } catch (_) {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (newTasks: Task[], newXp?: number) => {
    try {
      await AsyncStorage.setItem('zm_tasks', JSON.stringify(newTasks));
      if (newXp !== undefined) await AsyncStorage.setItem('zm_xp', String(newXp));
    } catch (_) {}
  }, []);

  const addTask = useCallback((name: string, urgency: Urgency, firstStep = ''): Task => {
    const task: Task = {
      id: makeId(),
      name: name.trim(),
      urgency,
      done: false,
      started: false,
      priority: false,
      firstStep,
      notes: '',
      subs: [],
      createdAt: Date.now(),
      startedAt: null,
      emoji: '🎯',
    };
    setTasks(prev => {
      const next = [task, ...prev];
      persist(next);
      return next;
    });
    return task;
  }, [persist]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const addXP = useCallback((amount: number) => {
    setXp(prev => {
      const next = prev + amount;
      AsyncStorage.setItem('zm_xp', String(next)).catch(() => {});
      return next;
    });
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, done: true, startedAt: t.startedAt ?? Date.now() } : t);
      persist(next);
      return next;
    });
    addXP(25);
  }, [persist, addXP]);

  const addSub = useCallback((taskId: string, name: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subs: [...(t.subs ?? []), { id: makeId(), name: name.trim(), done: false }] };
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const toggleSub = useCallback((taskId: string, subId: string) => {
    let wasDone = false;
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId) return t;
        const subs = (t.subs ?? []).map(s => {
          if (s.id !== subId) return s;
          wasDone = s.done;
          return { ...s, done: !s.done };
        });
        return { ...t, subs };
      });
      persist(next);
      return next;
    });
    if (!wasDone) addXP(5);
  }, [persist, addXP]);

  const deleteSub = useCallback((taskId: string, subId: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subs: (t.subs ?? []).filter(s => s.id !== subId) };
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const savePatterns = useCallback((results: PatternResult[]) => {
    setPatterns(results);
    AsyncStorage.setItem('zm_patterns', JSON.stringify(results)).catch(() => {});
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks, xp, streak, patterns, loaded,
      addTask, updateTask, deleteTask, completeTask,
      addSub, toggleSub, deleteSub, savePatterns, addXP,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
