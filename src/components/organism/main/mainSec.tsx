// "use client";

// import Header from "../header/header";
// import SideBar from "../side-bar/SideBar";
// import ChatWindow from "../chat-window/ChatWindow";
// import ChannelWindow from "../channel/ChannelWindow";
// import GroupWindow from "../group/groupWindow";
// import PostCommentsView from "../channel/PostCommentsView";
// import { useChannelStore } from "@/store/channel-store";
// import { useGroupStore } from "@/store/group-store";
// import { useCurrentUser } from "@/hooks/useCurrentUser";

// export default function MainSection() {
//   const activeChannelId = useChannelStore((s) => s.activeChannelId);
//   const activeCommentsPostId = useChannelStore((s) => s.activeCommentsPostId);
//   const activeGroupId = useGroupStore((s) => s.activeGroupId);
//   const { firebaseUser } = useCurrentUser();

//   return (
//     <section className="w-full mx-auto h-screen flex flex-col">
//       <Header />

//       <div className="flex flex-1 h-screen overflow-hidden min-w-0">
//         <SideBar />
//         {activeGroupId && firebaseUser ? (
//           <div className="flex-1 min-w-0 overflow-hidden">
//             <GroupWindow />
//           </div>
//         ) : activeChannelId && firebaseUser ? (
//           activeCommentsPostId ? (
//             <div className="flex-1 min-w-0 overflow-hidden">
//               <PostCommentsView
//                 channelId={activeChannelId}
//                 postId={activeCommentsPostId}
//                 myUid={firebaseUser.uid}
//               />
//             </div>
//           ) : (
//             <div className="flex-1 min-w-0 overflow-hidden">
//               <ChannelWindow
//                 channelId={activeChannelId}
//                 myUid={firebaseUser.uid}
//               />
//             </div>
//           )
//         ) : (
//           <div className="flex-1 min-w-0 overflow-hidden">
//             <ChatWindow />
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }
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
import { useCallListener } from "@/hooks/useCallListener";
import IncomingCallModal from "../calls/IncomingCallModal";
import CallWindow from "../calls/CallWindow";

export default function MainSection() {
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const activeCommentsPostId = useChannelStore((s) => s.activeCommentsPostId);
  const activeGroupId = useGroupStore((s) => s.activeGroupId);
  const { firebaseUser } = useCurrentUser();

  useCallListener(firebaseUser?.uid);

  return (
    <section className="w-full mx-auto h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 h-screen overflow-hidden min-w-0">
        <SideBar />
        {activeGroupId && firebaseUser ? (
          <div className="flex-1 min-w-0 overflow-hidden">
            <GroupWindow />
          </div>
        ) : activeChannelId && firebaseUser ? (
          activeCommentsPostId ? (
            <div className="flex-1 min-w-0 overflow-hidden">
              <PostCommentsView
                channelId={activeChannelId}
                postId={activeCommentsPostId}
                myUid={firebaseUser.uid}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0 overflow-hidden">
              <ChannelWindow
                channelId={activeChannelId}
                myUid={firebaseUser.uid}
              />
            </div>
          )
        ) : (
          <div className="flex-1 min-w-0 overflow-hidden">
            <ChatWindow />
          </div>
        )}
      </div>

      <IncomingCallModal />
      <CallWindow />
    </section>
  );
}