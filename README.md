<div align="center">

<img src="public/logo.png" width="88" alt="Nexo" />

# Nexo

### Communication, redesigned.

A modern real-time messaging platform built for conversations, communities, calls, and a seamless desktop experience.

**Chat · Connect · Call · Share**

<br />

[**Live Demo →**](https://chat-vert-nu-34.vercel.app/)

</div>

---

## Overview

**Nexo** is a full-featured real-time messaging platform designed around one principle:

> **Communication should feel instant, natural, and connected.**

Private conversations, group chats, channels, voice & video calls, customizable profiles, themes, and a native Windows client are combined into one unified experience.

Built with **Next.js, TypeScript, Firebase, LiveKit, Cloudinary, and Electron**.

---

## Features

|     | Feature                   | Description                                                       |
| --- | ------------------------- | ----------------------------------------------------------------- |
| 💬  | **Private & Group Chats** | Real-time conversations with instant synchronization              |
| 📢  | **Channels**              | Broadcast posts, build communities, and interact with subscribers |
| 📞  | **Voice & Video**         | Real-time calls directly inside conversations                     |
| 👤  | **Profiles**              | Avatars, banners, decorations, colors, and collectible gifts      |
| 🎨  | **Themes**                | Dark, light, and fully customizable themes                        |
| 🖥️ | **Desktop App**           | Native Windows client with updates and desktop notifications      |

---

## Messaging

Nexo's messaging system combines **Firestore real-time subscriptions** with **optimistic UI** to keep conversations responsive while data is synchronized in the background.

### Supported

* Real-time 1-on-1 conversations
* Real-time group messaging
* Optimistic message sending
* Message editing
* Message forwarding
* Message deletion
* Pinned messages
* Emoji reactions
* Read receipts
* Per-conversation unread counters
* Voice messages
* Image and media sharing
* Forwarding source attribution

---

## Channels

Channels provide a dedicated space for broadcasting content and building communities around shared interests.

Creators can publish posts while subscribers can interact through comments, reactions, and discussions.

### Supported

* Public channels
* Broadcast posts
* Subscriber management
* Comments and discussions
* Subscriber-gated interactions
* Post editing
* Pinned posts
* Post deletion
* Forwarding to chats and groups
* Real-time view counters
* Unified sidebar navigation

Chats, groups, and channels are treated as part of the same communication system rather than isolated features.

---

## Voice & Video

Nexo integrates **LiveKit** to provide real-time voice and video communication directly inside the messaging experience.

### Supported

* Voice calls
* Video calls
* Microphone controls
* Camera controls
* Conversation-based calling
* Real-time connection management

No separate application is required to start a call.

---

## Profiles & Personalization

Nexo provides a flexible profile and theming system designed to make each user's experience feel personal.

### Profiles

* Custom avatars
* Profile banners
* Avatar decorations
* Custom avatar borders
* Profile colors
* Collectible gifts
* Gift rarity tiers
* Featured gifts
* Animated gift presentation

### Themes

* Dark theme
* Light theme
* Custom themes
* Persistent preferences
* Cross-device synchronization
* Firestore-backed user settings

---

## Real-Time Architecture

Real-time synchronization is one of the core foundations of Nexo.

Firestore subscriptions keep conversations and user state synchronized between clients without requiring manual refreshes.

Optimistic updates are used wherever possible so actions such as sending messages, editing content, and interacting with conversations feel immediate.

```text
                           NEXO CLIENT
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌───────────┐    ┌───────────┐    ┌───────────┐
        │ Firebase  │    │  LiveKit  │    │ Cloudinary│
        │ Auth/DB   │    │ Calls     │    │ Media     │
        └───────────┘    └───────────┘    └───────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │ Electron Desktop  │
                     │  Windows Client   │
                     └───────────────────┘
```

The result is an interface that remains responsive while the backend handles synchronization in the background.

---

## Interaction & UX

Nexo focuses on the small details that make a messaging application feel cohesive.

* Online / offline presence
* Last seen timestamps
* Context menus
* Pin and unpin actions
* Mark as read
* Leave groups and channels
* Drag-and-drop sidebar organization
* Recency-based conversation ordering
* Optimistic UI updates
* Responsive message interactions
* Persistent preferences
* Custom desktop notifications

The goal is to make Nexo feel like a single communication platform rather than a collection of disconnected features.

---

## Windows Desktop

Nexo is not limited to the browser.

The project includes a dedicated **Windows desktop application built with Electron**, providing a more native messaging experience.

### Desktop

* Native Windows client
* Electron architecture
* NSIS installer
* Automatic updates
* GitHub Releases integration
* Dedicated download page
* Hardened IPC communication
* Version-mismatch protection
* Native desktop notifications

### Desktop Notifications

Nexo uses a custom Electron notification system instead of relying entirely on browser notifications.

Notifications are displayed through a native frameless window with:

* Always-on-top behavior
* Custom interface
* Mouse passthrough
* Native desktop integration

---

## Technology Stack

| Layer                        | Technology              |
| :--------------------------- | :---------------------- |
| **Framework**                | Next.js — App Router    |
| **Language**                 | TypeScript              |
| **Styling**                  | Tailwind CSS v4         |
| **State Management**         | Zustand                 |
| **Authentication**           | Firebase Authentication |
| **Database**                 | Firebase Firestore      |
| **Real-Time Communication**  | LiveKit                 |
| **Media Storage & Delivery** | Cloudinary              |
| **Desktop Runtime**          | Electron                |
| **Packaging**                | electron-builder / NSIS |
| **Icons**                    | Lucide React            |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         NEXO                                │
│                  Next.js / TypeScript                       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Chats     │  │  Channels   │  │   Voice / Video  │   │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘   │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                │
│                    ┌──────▼──────┐                         │
│                    │    State    │                         │
│                    │   Zustand   │                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │   Firebase  │   │   LiveKit   │   │ Cloudinary  │
   │ Auth/       │   │ Voice/Video │   │    Media    │
   │ Firestore   │   │             │   │             │
   └─────────────┘   └─────────────┘   └─────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    Electron     │
                   │ Windows Client  │
                   └─────────────────┘
```

---

## Project Highlights

Nexo combines several systems into a single messaging experience:

* ⚡ **Real-time synchronization** with Firebase Firestore
* 🚀 **Optimistic UI** for responsive interactions
* 💬 **Multi-format messaging** across private chats and groups
* 📢 **Community channels** with posts, subscribers, and discussions
* 📞 **Integrated voice & video** powered by LiveKit
* 🎨 **Deep personalization** with themes and profile customization
* 🖥️ **Native Windows experience** powered by Electron
* 🔔 **Native desktop notifications**
* 🔄 **Automatic desktop updates**
* ☁️ **Cloud media delivery** through Cloudinary

---

## Development

### Requirements

* Node.js
* npm
* Firebase project
* Cloudinary account
* LiveKit server

### Installation

```bash
git clone https://github.com/m1tywaflow/chat.git
cd chat
npm install
```

Create a `.env.local` file with the required Firebase, Cloudinary, and LiveKit configuration.

Then start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Desktop Development

The Windows client is built with Electron and packaged using **electron-builder / NSIS**.

Production desktop builds can be distributed through GitHub Releases and delivered to users through the built-in update system.

---

## Project Status

Nexo is an actively developed messaging platform.

The project continues to evolve across its messaging, channels, calling, personalization, and desktop systems.

---

## License

This project is currently maintained as a personal project.

---

<div align="center">

### Nexo

**Communication, redesigned.**

[**Open Nexo →**](https://chat-vert-nu-34.vercel.app/)

</div>
