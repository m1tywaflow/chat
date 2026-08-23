<div align="center">

<img src="public/logo.png" width="88" alt="Nexo logo" />

# Nexo

**A real-time chat app — now with channels, voice & video calls, a native desktop client, and auto-updates.**

Built with Next.js, TypeScript, Firebase, and Electron.

[**Live demo**](https://chat-vert-nu-34.vercel.app/)

</div>

---

## ✨ Features

### Messaging

* **Real-time messaging** — 1-on-1 and group chats powered by Firestore subscriptions
* **Optimistic sending** — messages appear instantly and reconcile seamlessly once confirmed
* **Message tools** — editing, forwarding (with a dedicated forward picker), deletion, pinning, emoji reactions, and read receipts
* **Custom stickers** — a full sticker/emoji system with Cloudinary-hosted assets, rendered without a bubble background
* **Unread badges** — per-recipient unread counters with race-condition-safe read marking

### Calls 📞

* **Voice calls** — call your contacts directly from the chat
* **Video calls** — make real-time video calls with camera support
* **Call controls** — manage your microphone and camera during an active call
* **Contact calling** — start voice or video calls directly from your conversations

### Channels 📢

* **Telegram-style channels** — create channels, publish posts, and broadcast to subscribers
* **View counters** — real-time, dwell-time-aware view tracking on every post
* **Comments** — full-screen threaded comments with subscriber-gated input
* **Post management** — edit, pin, and delete posts with an inline editor and a pinned-post banner
* **Unified sidebar** — chats and channels merged into one recency-sorted list, with drag-and-drop reordering

### Profiles & customization

* **Custom profiles** — editable avatars and banners with built-in image cropping
* **Avatar decorations & borders**, plus a custom profile card color
* **Gift system** — collectible gifts with rarity tiers, animated details, and a floating "gift cloud" on the full profile view, with a featured-gift badge next to usernames
* **Theming** — dark, light, and fully custom themes synced across devices via Firestore

### UX details

* **Presence** — online/offline status with last-seen timestamps
* **Context menus** — right-click actions (pin, mark as read, delete/leave) across chats and channels
* **Custom desktop notifications** — a native, frameless, always-on-top toast window with mouse passthrough

### Desktop app 🖥️

* **Native Windows app** — packaged with Electron + electron-builder (NSIS installer)
* **Auto-updates** — full GitHub Releases integration with a `/download` page on the web app
* **Robust IPC layer** — hardened against version mismatches between old and new builds

---

## 🛠️ Tech stack

| Layer            | Tech                                 |
| ---------------- | ------------------------------------ |
| Framework        | Next.js (App Router)                 |
| Language         | TypeScript                           |
| Styling          | Tailwind CSS v4                      |
| State management | Zustand                              |
| Backend          | Firebase (Authentication, Firestore) |
| Desktop shell    | Electron + electron-builder          |
| Media storage    | Cloudinary                           |
| Icons            | Lucide React                         |

---

## 📌 Roadmap ideas

* Message search
* Mobile companion app

---

## 📄 License

This project is for personal/portfolio use.
