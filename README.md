# LOCKIN ⚡

A minimal, modern productivity web app designed for focused work and deep focus sessions.

## Features

- **Pomodoro Timer** — 25/5 work/break cycles with session tracking
- **To-Do List** — Priority-based tasks with weekly auto-reset
- **Calendar** — Day notes + time-based reminders with notification bell
- **Notification Bell** — Shows triggered & upcoming reminders in real-time
- **Notes** — Colorizable, searchable, pinnable notes
- **Daily Goals** — Set 3 goals/day (blocks dismiss until completed)
- **Streak Tracker** — Track consecutive focus days
- **Weekly Review** — Stats, charts, and reflection for weekly progress
- **Lofi Player** — YouTube embedded focus music (5 stations)
- **Dark Theme** — Apple/Stripe-inspired minimal aesthetic
- **Offline First** — All data persists in localStorage

## Tech Stack

- **React 19** + **Vite**
- **React Router v7** for navigation
- **Context API** for state management
- **Web Audio API** for notification sounds
- **CSS Custom Properties** design tokens

## Getting Started

### Prerequisites
- Node.js 16+
- npm

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/lockin.git
cd lockin
npm install
```

### Development

```bash
npm run dev
```

Runs at `http://localhost:5173`

### Build

```bash
npm run build
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect your repo to Vercel
3. Set Environment Variables (Project Settings → Environment Variables):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Vercel auto-detects Vite configuration → Deploy

### Firestore Rules

`Study Together` and cloud sync need Firestore rules deployed for the Firebase project.

1. Install Firebase CLI
2. Log in with `firebase login`
3. Deploy rules with `firebase deploy --only firestore:rules`

The repo includes:
- `firebase.json`
- `firestore.rules`

Or use Vercel CLI:
```bash
npm i -g vercel
vercel --prod
```

## Usage

1. **Set Daily Goals** — App blocks you until 3 goals are set
2. **Start Pomodoro** — Click play, set work/break durations in settings
3. **Add Tasks** — Track todos by priority and date
4. **Create Reminders** — Open Calendar → select day → add time + message
5. **Review Weekly** — Check progress, streaks, and reflection

## Design Philosophy

**Obsidian Terminal Aesthetic** — Dark, minimal, high-contrast interface with electric cyan accents. No distractions. Just focus.

---

Built with ⚡ for deep work
