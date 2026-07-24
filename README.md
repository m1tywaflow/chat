# Pislk

A real-time, Telegram-inspired chat application built with Next.js, TypeScript, and Firebase.

## Features

- **Real-time messaging** — 1-on-1 and group chats powered by Firestore subscriptions
- **Authentication** — username-based auth with Firebase Auth
- **Message tools** — editing, forward, deletion, pinning, emoji reactions, and read receipts
- **Media sharing** — images, GIFs, and videos via Cloudinary, with an in-chat media gallery
- **Custom profiles** — editable avatars and banners with image cropping, avatar borders, avatar decorations, and a custom card color
- **Gift system** — a collectible gift/sticker system with rarity tiers, animated gift details, and a Telegram-style floating "gift cloud" on the full profile view
- **Theming** — dark, light, and custom themes synced across devices via Firestore
- **Presence** — online/offline status with last-seen timestamps
- **Unread badges** — per-recipient unread message counters

## Tech stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State management**: Zustand
- **Backend**: Firebase (Authentication, Firestore)
- **Media storage**: Cloudinary
- **Icons**: Lucide React

## Getting started

### Prerequisites

- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Cloudinary account with an unsigned upload preset

### Installation

```bash
git clone https://github.com/your-username/chatik.git
cd chatik
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Cloudinary cloud name and upload preset are configured directly in the code.

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project structure

```
src/
  app/              Next.js App Router pages
  components/       UI components (chat, profile, gifts, theming, etc.)
  lib/              Firebase config, gifts data, avatar decorations, utilities
  store/            Zustand stores
```

## License

This project is for personal/portfolio use.
