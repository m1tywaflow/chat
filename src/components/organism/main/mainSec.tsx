// "use client";

// import Header from "../header/header";
// import SideBar from "../side-bar/SideBar";
// import ChatWindow from "../chat-window/ChatWindow";
// import ChannelWindow from "../channel/ChannelWindow";
// import GroupWindow from "../group/groupWindow";
// import PostCommentsView from "../channel/PostCommentsView";
// import { useChannelStore } from "@/store/channel-store";
// import { useGroupStore } from "@/store/group-store";
// import { useCallStore } from "@/store/call-store";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
// import { useCallListener } from "@/hooks/useCallListener";
// import IncomingCallModal from "../calls/IncomingCallModal";
// import CallWindow from "../calls/CallWindow";

// export default function MainSection() {
//   const activeChannelId = useChannelStore((s) => s.activeChannelId);
//   const activeCommentsPostId = useChannelStore((s) => s.activeCommentsPostId);
//   const activeGroupId = useGroupStore((s) => s.activeGroupId);
//   const { firebaseUser } = useCurrentUser();
//   const activeCallId = useCallStore((s) => s.activeCall?.id);

//   useCallListener(firebaseUser?.uid);

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

//       <IncomingCallModal />
//       <CallWindow key={activeCallId} />
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
import { useCallStore } from "@/store/call-store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCallListener } from "@/hooks/useCallListener";
import { useResizableSidebar } from "@/hooks/useResizableSidebar";
import IncomingCallModal from "../calls/IncomingCallModal";
import CallWindow from "../calls/CallWindow";

export default function MainSection() {
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const activeCommentsPostId = useChannelStore((s) => s.activeCommentsPostId);
  const activeGroupId = useGroupStore((s) => s.activeGroupId);
  const { firebaseUser } = useCurrentUser();
  const activeCallId = useCallStore((s) => s.activeCall?.id);

  useCallListener(firebaseUser?.uid);

  const { width: sidebarWidth, isDragging, onHandleMouseDown } = useResizableSidebar();

  return (
    <section className="w-full mx-auto h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 h-screen overflow-hidden min-w-0">
        <div
          style={{ width: sidebarWidth }}
          className={`relative flex-none h-full overflow-hidden ${isDragging ? "" : "transition-[width] duration-100"
            }`}
        >
          <SideBar />

          <div
            onMouseDown={onHandleMouseDown}
            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize z-20 ${isDragging ? "bg-[#7c5cff]/60" : "bg-transparent hover:bg-[#7c5cff]/30"
              } transition-colors`}
          >
            {/* хитбокс шире полоски, чтобы легче было поймать курсором */}
            <div className="absolute top-0 -right-1.5 w-4 h-full" />
          </div>
        </div>

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
              <ChannelWindow channelId={activeChannelId} myUid={firebaseUser.uid} />
            </div>
          )
        ) : (
          <div className="flex-1 min-w-0 overflow-hidden">
            <ChatWindow />
          </div>
        )}
      </div>

      <IncomingCallModal />
      <CallWindow key={activeCallId} />
    </section>
  );
}