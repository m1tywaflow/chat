
"use client";

import Header from "../header/header";
import SideBar from "../side-bar/SideBar";
import ChatWindow from "../chat-window/ChatWindow";
import ChannelWindow from "../channel/ChannelWindow";
import { useChannelStore } from "@/store/channel-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function MainSection() {
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const { firebaseUser } = useCurrentUser();

  return (
    <section className=" w-7xl mx-auto h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 h-screen overflow-hidden">
        <SideBar />
        {activeChannelId && firebaseUser ? (
          <ChannelWindow channelId={activeChannelId} myUid={firebaseUser.uid} />
        ) : (
          <ChatWindow />
        )}
      </div>
    </section>
  );
}
