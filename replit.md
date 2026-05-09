# ZAPP!

An ADHD-friendly task manager mobile app that helps users track tasks by urgency, build momentum with timers and mini-steps, and understand their brain patterns through a self-assessment.

## Run & Operate

- `pnpm --filter @workspace/zapp run dev` — run the Expo app (accessed via $REPLIT_EXPO_DEV_DOMAIN)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- State: React Context + AsyncStorage (no backend needed)
- UI: StyleSheet, expo-linear-gradient, expo-haptics, expo-blur
- Navigation: expo-router (file-based), tabs + stack

## Where things live

- `artifacts/zapp/` — Expo mobile app
- `artifacts/zapp/app/(tabs)/index.tsx` — Main task list screen
- `artifacts/zapp/app/(tabs)/patterns.tsx` — Brain map / ADHD patterns screen
- `artifacts/zapp/app/task/[id].tsx` — Task detail (timer, mini-steps, notes)
- `artifacts/zapp/app/assessment.tsx` — 7-category ADHD self-assessment
- `artifacts/zapp/context/TaskContext.tsx` — All task state + AsyncStorage persistence
- `artifacts/zapp/components/TaskCard.tsx` — TaskCard + UrgencyBadge components
- `artifacts/zapp/constants/colors.ts` — Design tokens (warm cream + hot pink palette)

## Product

- Task list with 4 urgency levels: NOW 🔥 / SOON ⏰ / LATER 🌙 / BRAIN DUMP 🧠
- Per-task detail view with a Pomodoro-style timer (2/5/15/25 min presets)
- Mini-steps (subtasks) to break overwhelming tasks into tiny pieces
- "Just Start" prompt with "2-minute rule" messaging
- XP gamification system (+10 start, +5 subtask, +25 complete)
- 7-category ADHD self-assessment (Task Initiation, Time Blindness, Impulsivity, Emotional Regulation, Organisation, Consistency, Motivation)
- Brain Map showing assessment results with personalized strategies
- Unicorn mascot with rotating motivational messages
- Seeded with 10 example tasks on first launch

## Architecture decisions

- Frontend-only: all data stored in AsyncStorage, no backend needed
- Urgency-first model instead of priority numbers — maps to ADHD time perception
- Source code ported from user's existing Zapp app (attached_assets/zapp-mobile-source_*.zip)

## User preferences

- App name: ZAPP!
- Source: user provided existing mobile source code

## Gotchas

- Use `restart_workflow` not `npx expo start` to restart the dev server
- The `useNativeDriver` warning on web is harmless — only affects the slide-up modal animation on web
