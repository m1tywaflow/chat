"use client";

import Header from "../header/header";
import SideBar from "../side-bar/SideBar";
import ChatWindow from "../chat-window/ChatWindow";
import ChannelWindow from "../channel/ChannelWindow";
import GroupWindow from "../group/groupWindow";
import PostCommentsView from "../channel/PostCommentsView";
import { useChannelStore } from "@/store/channel-store";
import { useGroupStore } from "@/store/group-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function MainSection() {
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const activeCommentsPostId = useChannelStore((s) => s.activeCommentsPostId);
  const activeGroupId = useGroupStore((s) => s.activeGroupId);
  const { firebaseUser } = useCurrentUser();

  return (
    <section className="w-full mx-auto h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 h-screen overflow-hidden">
        <SideBar />
        {activeGroupId && firebaseUser ? (
          <GroupWindow />
        ) : activeChannelId && firebaseUser ? (
          activeCommentsPostId ? (
            <PostCommentsView
              channelId={activeChannelId}
              postId={activeCommentsPostId}
              myUid={firebaseUser.uid}
            />
          ) : (
            <ChannelWindow
              channelId={activeChannelId}
              myUid={firebaseUser.uid}
            />
          )
        ) : (
          <ChatWindow />
        )}
      </div>
    </section>
  );
}
