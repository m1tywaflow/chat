<div align="center">

<img src="public/logo.png" width="88" alt="Nexo" />

# Nexo

### Communication, redesigned.

A modern communication platform for conversations, communities, voice & video calls, and desktop.

**Chat · Connect · Call · Share**

<br />

[**Live Demo →**](https://chat-vert-nu-34.vercel.app/)

</div>

---

## Overview

**Nexo** brings messaging, communities, calls, and personalization together in a single platform designed for everyday communication.

Built with **Next.js, TypeScript, Firebase, LiveKit, Cloudinary, and Electron.**

---

## Features

|     | Feature           | Description                                                     |
| --- | ----------------- | --------------------------------------------------------------- |
| 💬  | **Chats**         | Private and group conversations with rich messaging and media   |
| 📢  | **Channels**      | Posts, discussions, subscribers, reactions, and content sharing |
| 📞  | **Voice & Video** | Audio and video calls within conversations                      |
| 👤  | **Profiles**      | Avatars, banners, decorations, colors, and collectible gifts    |
| 🎨  | **Themes**        | Dark, light, and custom themes                                  |
| 🖥️ | **Desktop**       | Native Windows client with notifications and automatic updates  |

---

## Messaging

* Private & group conversations
* Message editing and deletion
* Forwarding and pinned messages
* Emoji reactions
* Read receipts
* Voice messages
* Image & media sharing
* Unread counters

---

## Channels

* Public channels
* Posts and discussions
* Subscriber management
* Reactions and view counters
* Pinned posts
* Content forwarding

---

## Desktop

Nexo includes a dedicated **Windows application built with Electron**.

* Native notifications
* Automatic updates
* NSIS installer
* GitHub Releases integration
* Secure IPC communication

---

## Architecture

Nexo uses **Firebase Firestore** to synchronize conversations and user state across clients, with optimistic updates for a responsive interface.

**LiveKit** powers voice and video communication, while **Cloudinary** provides media storage and delivery.

```text
                    ┌───────────────┐
                    │     Nexo      │
                    │ Next.js / TS  │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │ Firebase │      │ LiveKit  │      │Cloudinary│
     │ Auth/DB  │      │  Calls   │      │  Media   │
     └──────────┘      └──────────┘      └──────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Electron    │
                    │ Windows App   │
                    └───────────────┘
```

---

## Technology

|               |                         |
| ------------- | ----------------------- |
| **Framework** | Next.js · App Router    |
| **Language**  | TypeScript              |
| **Styling**   | Tailwind CSS v4         |
| **State**     | Zustand                 |
| **Backend**   | Firebase                |
| **Calls**     | LiveKit                 |
| **Media**     | Cloudinary              |
| **Desktop**   | Electron                |
| **Packaging** | electron-builder / NSIS |

---

## Development

```bash
git clone https://github.com/m1tywaflow/chat.git
cd chat
npm install
npm run dev
```

Create `.env.local` with your Firebase, Cloudinary, and LiveKit configuration.

---

<div align="center">

### Nexo

**Communication, redesigned.**

[**Open Nexo →**](https://chat-vert-nu-34.vercel.app/)

</div>
