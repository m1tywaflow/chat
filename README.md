<div align="center">

<img src="public/logo.png" width="88" alt="Nexo" />

# Nexo

### Communication, redesigned.

A modern real-time messaging platform built for fast conversations,
communities, calls, and a seamless desktop experience.

**Chat · Connect · Call · Share**

<br />

[**Live Demo →**](https://chat-vert-nu-34.vercel.app/)

<br />

</div>

---

## Nexo

Nexo is a full-featured real-time messenger designed around one idea:

**communication should feel instant, natural, and connected.**

Private conversations, group chats, channels, voice & video calls,
custom profiles, themes, and a native Windows client come together
in one unified experience.

Built with **Next.js, TypeScript, Firebase, LiveKit, Cloudinary, and Electron.**

---

## What you can do

| | Feature | Description |
| --- | --- | --- |
| 💬 | **Private & Group Chats** | Real-time conversations with instant message synchronization |
| 📢 | **Channels** | Publish posts, build communities, and interact with subscribers |
| 📞 | **Voice & Video** | Start real-time calls directly from conversations |
| 👤 | **Profiles** | Customize your identity with avatars, banners, decorations, and gifts |
| 🎨 | **Themes** | Use dark, light, or fully customized themes |
| 🖥️ | **Desktop App** | Native Windows client with updates and desktop notifications |

---

## 💬 Messaging

Nexo's messaging system is built around real-time Firestore subscriptions
and optimistic UI, making conversations feel immediate even while data
is being synchronized in the background.

- Real-time 1-on-1 conversations
- Real-time group messaging
- Optimistic message sending
- Message editing
- Message forwarding
- Message deletion
- Pinned messages
- Emoji reactions
- Read receipts
- Per-conversation unread counters
- Voice messages
- Image and media sharing
- Source attribution when forwarding content

---

## 📞 Voice & Video

Real-time communication goes beyond text.

Nexo integrates **LiveKit** for voice and video communication directly
inside the messaging experience.

- Voice calls
- Video calls
- Microphone controls
- Camera controls
- Conversation-based calling
- Real-time connection management

No separate application is required to start a call.

---

## 📢 Channels

Channels provide a dedicated space for broadcasting content and building
communities around shared interests.

Creators can publish posts while subscribers can interact through comments
and reactions.

- Public channels
- Broadcast posts
- Subscriber management
- Comments and discussions
- Subscriber-gated interactions
- Post editing
- Pinned posts
- Post deletion
- Forwarding to chats and groups
- Real-time view counters
- Unified sidebar navigation

Chats, groups, and channels are treated as part of the same communication
system rather than isolated features.

---

## 👤 Profiles

Profiles are designed to be more than a username and avatar.

Users can create a visual identity that carries across the application.

- Custom avatars
- Profile banners
- Avatar decorations
- Custom avatar borders
- Profile colors
- Collectible gifts
- Gift rarity tiers
- Featured gifts
- Animated gift presentation

---

## 🎨 Personalization

Nexo provides a flexible theming system so the interface can adapt to
different preferences.

- Dark theme
- Light theme
- Custom themes
- Persistent preferences
- Cross-device synchronization
- Firestore-backed user settings

Your interface stays consistent wherever you use Nexo.

---

## 🖥️ Windows Desktop

Nexo is not limited to the browser.

The project includes a dedicated **Windows desktop application built with Electron**,
designed to provide a more native messaging experience.

### Desktop features

- Native Windows client
- Electron architecture
- NSIS installer
- Automatic updates
- GitHub Releases integration
- Dedicated download page
- Hardened IPC communication
- Version-mismatch protection
- Native desktop notifications

### Notifications

Nexo uses a custom Electron notification system instead of relying
entirely on browser notifications.

Notifications are displayed through a native frameless window with:

- Always-on-top behavior
- Custom interface
- Mouse passthrough
- Native desktop integration

---

## ⚡ Real-Time Architecture

Real-time synchronization is one of the foundations of Nexo.

Firestore subscriptions keep conversations and user state synchronized
between clients without requiring manual refreshes.

Optimistic UI is used wherever possible so actions such as sending messages,
editing content, and interacting with conversations feel immediate.

The result is an interface that stays responsive while the backend handles
synchronization in the background.

---

## ✦ Interaction & UX

A large part of Nexo's experience comes from small details.

- Online / offline presence
- Last seen timestamps
- Context menus
- Pin and unpin actions
- Mark as read
- Leave groups and channels
- Drag-and-drop sidebar organization
- Recency-based conversation ordering
- Optimistic UI updates
- Responsive message interactions
- Persistent preferences
- Custom desktop notifications

The goal is to make the application feel coherent rather than like
a collection of separate features.

---

## 🛠️ Technology

Nexo is built with a modern web and desktop stack.

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js — App Router |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand |
| **Authentication** | Firebase Authentication |
| **Database** | Firebase Firestore |
| **Real-Time Calls** | LiveKit |
| **Media** | Cloudinary |
| **Desktop** | Electron |
| **Packaging** | electron-builder / NSIS |
| **Icons** | Lucide React |

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │         Nexo         │
                         │    Client Interface  │
                         └───────────┬──────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
           ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
           │   Firebase  │    │   LiveKit   │    │ Cloudinary  │
           │ Auth / DB   │    │ Voice/Video │    │   Media     │
           └─────────────┘    └─────────────┘    └─────────────┘
                  │                  │                  │
                  └──────────────────┼──────────────────┘
                                     ▼
                          ┌────────────────────┐
                          │  Electron Client   │
                          │   Windows Desktop  │
                          └────────────────────┘
