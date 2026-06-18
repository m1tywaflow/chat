import { User } from "lucide-react";

export default function UserCard() {
  return (
    <>
      <div className="max-w-3xl border mt-7">
        <div className="font-bold text-center">
          <h1>CHATS</h1>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-4 border-2 p-2 hover:bg-white/40 cursor-pointer">
            <User size={40} className="bg-white rounded-2xl" />
            <div>
              <h1 className="font-bold">NickName</h1>
              <p>typing...</p>
            </div>
          </div>
          <div className="flex gap-4 border-2 p-2 hover:bg-white/40 cursor-pointer">
            <User size={40} className="bg-white rounded-2xl" />
            <div>
              <h1 className="font-bold">NickName</h1>
              <p>typing...</p>
            </div>
          </div>
          <div className="flex gap-4 border-2 p-2 hover:bg-white/40 cursor-pointer">
            <User size={40} className="bg-white rounded-2xl" />
            <div>
              <h1 className="font-bold">NickName</h1>
              <p>typing...</p>
            </div>
          </div>
          <div className="flex gap-4 border-2 p-2 hover:bg-white/40 cursor-pointer">
            <User size={40} className="bg-white rounded-2xl" />
            <div>
              <h1 className="font-bold">NickName</h1>
              <p>typing...</p>
            </div>
          </div>
          <div className="flex gap-4 border-2 p-2 hover:bg-white/40 cursor-pointer">
            <User size={40} className="bg-white rounded-2xl" />
            <div>
              <h1 className="font-bold">NickName</h1>
              <p>typing...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
