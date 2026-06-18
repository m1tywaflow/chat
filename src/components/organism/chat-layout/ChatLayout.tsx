"use client";

import SideBar from "../side-bar/SideBar";
import ChatWindow from "../chat-window/ChatWindow";

export default function ChatLayout() {
  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <div className="w-[320px] border-r border-zinc-800 bg-zinc-950">
        <SideBar />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
    </div>
  );
}
