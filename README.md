<div align="center">

<img src="public/logo.png" width="96" alt="Nexo logo" />

# Nexo

### A modern real-time messaging platform built for seamless communication.

**Chat. Connect. Call. Share.**

Nexo is a full-featured real-time messenger designed around fast communication, rich interactions, and a modern desktop experience. It combines private conversations, group chats, channels, voice & video calls, customizable profiles, and a native Windows application in one unified platform.

Built with **Next.js, TypeScript, Firebase, and Electron**.

[**🚀 Live Demo**](https://chat-vert-nu-34.vercel.app/)

</div>

---

## ✨ Overview

Nexo is more than a simple chat application.

The platform is designed to provide a complete communication experience — from instant private messaging and communities to public channels and real-time voice & video calls.

The interface focuses on **speed, responsiveness, customization, and a consistent experience across web and desktop**.

---

## 💬 Messaging

A powerful real-time messaging system built around Firestore subscriptions and optimistic UI.

* **Real-time conversations** — instant 1-on-1 and group messaging
* **Optimistic sending** — messages appear immediately while synchronization happens in the background
* **Message editing** — update sent messages without breaking the conversation flow
* **Message forwarding** — forward messages between chats, groups, and channels with source attribution
* **Message deletion** — remove messages with synchronized updates
* **Pinned messages** — keep important information easily accessible
* **Emoji reactions** — react to messages with a custom reaction system
* **Read receipts** — track message delivery and reading status
* **Unread counters** — per-conversation unread tracking with race-condition-safe read handling
* **Voice messages** — record and send audio directly inside conversations
* **Media sharing** — send images and other media with Cloudinary-powered storage

---

## 📞 Voice & Video Calls

Real-time communication goes beyond text.

Nexo includes integrated **voice and video calling**, allowing users to start a call directly from their conversations.

* **Voice calls** — communicate without leaving the messenger
* **Video calls** — real-time camera communication
* **Microphone controls** — enable or disable your microphone during a call
* **Camera controls** — toggle video whenever needed
* **Conversation-based calling** — start calls directly from a chat or contact
* **Real-time communication** — powered by LiveKit

---

## 📢 Channels

A dedicated broadcasting system inspired by modern community platforms.

Channels allow creators and communities to publish content to their subscribers while keeping discussions organized.

* **Public channels** — create and manage dedicated communities
* **Broadcast posts** — publish updates to all subscribers
* **Real-time view counters** — track post engagement using dwell-time-aware view tracking
* **Comments** — dedicated threaded discussion under channel posts
* **Subscriber-gated interactions** — control who can participate in discussions
* **Post editing** — modify published content with an inline editor
* **Pinned posts** — highlight important announcements
* **Post deletion** — remove outdated or unwanted content
* **Forwarding** — forward channel posts into private chats and groups while preserving their original source
* **Unified navigation** — channels, groups, and chats live together inside the main sidebar

---

## 👤 Profiles & Customization

Nexo puts a strong focus on personalization.

Users can customize their profiles and create a visual identity that feels unique to them.

* **Custom avatars** — upload and crop profile images
* **Profile banners** — personalized profile headers
* **Avatar decorations** — additional visual customization
* **Avatar borders** — customizable profile styling
* **Custom profile colors** — personalize the appearance of your profile card
* **Collectible gifts** — gifts with different rarity tiers and animated details
* **Featured gifts** — highlight a favorite collectible directly next to your profile
* **Gift cloud** — animated gift presentation inside the full profile view

---

## 🎨 Themes

A flexible theming system designed to keep the interface personal.

* **Dark theme**
* **Light theme**
* **Custom themes**
* **Cross-device synchronization**
* **Persistent user preferences powered by Firestore**

Your interface follows you across devices.

---

## 🖥️ Native Desktop Experience

Nexo isn't limited to the browser.

The project includes a dedicated **Windows desktop application built with Electron**, providing a more native messaging experience.

* **Native Windows client**
* **Electron-based desktop architecture**
* **NSIS installer**
* **Automatic updates**
* **GitHub Releases integration**
* **Dedicated web download page**
* **Hardened IPC communication**
* **Version-mismatch protection between application builds**
* **Native desktop notifications**

### 🔔 Desktop Notifications

Nexo uses a custom notification system instead of relying solely on browser notifications.

Notifications are rendered through a **native frameless Electron window** with:

* Always-on-top behavior
* Custom UI
* Mouse passthrough
* Native desktop integration

---

## ⚡ Real-Time Experience

Real-time synchronization is one of the core principles behind Nexo.

The application uses Firebase Firestore subscriptions to keep conversations and user state synchronized without requiring manual refreshes.

The interface also uses **optimistic UI patterns** wherever possible, allowing actions such as sending messages to feel instant even while the backend is processing the request.

This combination provides a responsive experience while maintaining synchronization between clients.

---

## 🧩 UX & Interaction

A large part of Nexo is built around small interaction details that make the application feel polished.

* **Online / offline presence**
* **Last seen timestamps**
* **Context menus**
* **Pin / unpin actions**
* **Mark as read**
* **Leave groups and channels**
* **Drag-and-drop sidebar organization**
* **Recency-based conversation ordering**
* **Responsive message interactions**
* **Optimistic UI updates**
* **Custom desktop notifications**
* **Persistent preferences**

Chats, groups, and channels are designed to behave as one unified communication system rather than separate parts of the application.

---

## 🛠️ Tech Stack

| Layer                       | Technology              |
| :-------------------------- | :---------------------- |
| **Framework**               | Next.js — App Router    |
| **Language**                | TypeScript              |
| **Styling**                 | Tailwind CSS v4         |
| **State Management**        | Zustand                 |
| **Authentication**          | Firebase Authentication |
| **Database**                | Firebase Firestore      |
| **Real-Time Communication** | LiveKit                 |
| **Media Storage**           | Cloudinary              |
| **Desktop Client**          | Electron                |
| **Application Packaging**   | electron-builder / NSIS |
| **Icons**                   | Lucide React            |

---

## 🏗️ Architecture

Nexo follows a modern web application architecture built around a real-time client and cloud-backed services.

```text
                         ┌─────────────────────┐
                         │        Nexo         │
                         │   Client Interface  │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
          │   Firebase  │   │   LiveKit   │   │ Cloudinary  │
          │ Auth/DB     │   │ Calls       │   │ Media       │
          └─────────────┘   └─────────────┘   └─────────────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                           ┌─────────────────┐
                           │ Electron Client │
                           │ Windows Desktop │
                           └─────────────────┘
```

---

## 🚀 Highlights

Nexo currently brings together:

**💬 Real-time messaging**
Private chats, groups, forwarding, reactions, read receipts, voice messages and media sharing.

**📢 Channels**
Broadcasting, subscribers, comments, pinned posts, views and post management.

**📞 Voice & Video**
Real-time calls directly from conversations.

**👤 Custom Profiles**
Avatars, banners, decorations, borders, colors and collectible gifts.

**🎨 Personalization**
Dark, light and custom themes synchronized across devices.

**🖥️ Desktop Application**
A native Windows client with automatic updates and custom notifications.

---

## 📈 Project Status

Nexo is an actively developed personal project focused on exploring how a modern real-time communication platform can be designed and built from the ground up.

The project is continuously evolving with new features, UI improvements, performance optimizations, and infrastructure updates.

---

## 📄 License

This project is intended for **personal and portfolio use**.

---

<div align="center">

### Built with ❤️ and a lot of code.

**Nexo — communication, redesigned.**

</div>
