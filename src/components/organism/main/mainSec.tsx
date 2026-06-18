import Header from "../header/header";
import SideBar from "../side-bar/SideBar";
import ChatWindow from "../chat-window/ChatWindow";

export default function MainSection() {
  return (
    <section className=" w-7xl mx-auto h-screen border-2 flex flex-col">
      <Header />

      <div className="flex flex-1 h-screen overflow-hidden">
        <SideBar />
        <ChatWindow />
      </div>
    </section>
  );
}
