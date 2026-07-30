"use client";

import { useEffect, useMemo, useState } from "react";
import { useGroupStore } from "@/store/group-store";
import {
  getUserProfiles,
  setGroupAdmin,
  kickMember,
} from "@/lib/firestore/groups";
import { isOnline, formatLastSeen } from "@/lib/formatLastSeen";
import {
  X,
  Users,
  Crown,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  Loader2,
} from "lucide-react";

interface Props {
  groupId: string;
  myUid: string | null;
  onClose: () => void;
}

interface MemberRow {
  uid: string;
  username: string;
  avatar?: string;
  online: boolean;
  lastSeen: any;
  role: "owner" | "admin" | "member";
}

function ConfirmMini({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-80 rounded-2xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <UserMinus size={18} className="text-red-400" />
          </div>
          <h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex border-t border-white/[0.06]">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors font-medium border-r border-white/[0.06] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors font-semibold cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupModal({ groupId, myUid, onClose }: Props) {
  const group = useGroupStore((s) => s.groups.find((g) => g.id === groupId));

  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [kickTarget, setKickTarget] = useState<MemberRow | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [menuUid, setMenuUid] = useState<string | null>(null);

  const memberIdsKey = useMemo(
    () => (group ? [...group.members].sort().join(",") : ""),
    [group?.members]
  );

  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    setLoadingProfiles(true);
    getUserProfiles(group.members).then((res) => {
      if (!cancelled) {
        setProfiles(res);
        setLoadingProfiles(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [memberIdsKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (kickTarget) setKickTarget(null);
        else if (zoomUrl) setZoomUrl(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kickTarget, zoomUrl, onClose]);

  useEffect(() => {
    if (!menuUid) return;
    const close = () => setMenuUid(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuUid]);

  if (!group) return null;

  const isOwner = myUid === group.ownerId;
  const isAdmin = !!myUid && group.admins.includes(myUid);
  const canManage = isOwner || isAdmin;

  const rows: MemberRow[] = group.members.map((uid) => {
    const p = profiles[uid] || {};
    const role: MemberRow["role"] =
      uid === group.ownerId
        ? "owner"
        : group.admins.includes(uid)
        ? "admin"
        : "member";
    return {
      uid,
      username: p.username || "…",
      avatar: p.avatar,
      online: isOnline(p),
      lastSeen: p.lastSeen,
      role,
    };
  });

  const roleOrder = { owner: 0, admin: 1, member: 2 };
  rows.sort((a, b) => {
    if (roleOrder[a.role] !== roleOrder[b.role])
      return roleOrder[a.role] - roleOrder[b.role];
    return a.username.localeCompare(b.username);
  });

  function canKick(target: MemberRow) {
    if (!canManage) return false;
    if (target.uid === myUid) return false;
    if (target.role === "owner") return false;
    if (target.role === "admin" && !isOwner) return false;
    return true;
  }

  async function handleKickConfirmed() {
    if (!kickTarget) return;
    setBusyUid(kickTarget.uid);
    try {
      await kickMember(groupId, kickTarget.uid);
    } finally {
      setBusyUid(null);
      setKickTarget(null);
    }
  }

  async function toggleAdmin(target: MemberRow) {
    if (!isOwner || target.role === "owner") return;
    setMenuUid(null);
    setBusyUid(target.uid);
    try {
      await setGroupAdmin(groupId, target.uid, target.role !== "admin");
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <>
      <style>{`
        .gm-scroll::-webkit-scrollbar { width: 4px; }
        .gm-scroll::-webkit-scrollbar-track { background: transparent; }
        .gm-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.25); border-radius: 999px; }
        .gm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }
        .gm-row-menu { animation: gmMenuIn 0.12s cubic-bezier(0.34,1.56,0.64,1); transform-origin: top right; }
        @keyframes gmMenuIn { from { opacity:0; transform:scale(0.9) translateY(-4px);} to { opacity:1; transform:scale(1) translateY(0);} }
        .gm-avatar { cursor: zoom-in; transition: opacity 0.15s; }
        .gm-avatar:hover { opacity: 0.85; }
      `}</style>

      <div
        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-[380px] max-h-[85vh] flex flex-col rounded-3xl bg-[#0d0b17] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-24 -left-16 w-[280px] h-[280px] rounded-full bg-[#5b3df0]/12 blur-[100px]" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>

          {/* header */}
          <div className="relative z-10 flex flex-col items-center pt-8 pb-5 px-6 border-b border-white/[0.06]">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-[#1e2a3a] flex items-center justify-center mb-3 gm-avatar"
              onClick={() => group.avatarUrl && setZoomUrl(group.avatarUrl)}
            >
              {group.avatarUrl ? (
                <img
                  src={group.avatarUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users size={28} className="text-[#a893ff]" />
              )}
            </div>
            <h2 className="text-[16px] font-semibold text-white text-center leading-tight">
              {group.name}
            </h2>
            <p className="text-[12.5px] text-zinc-500 mt-1">
              {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
            </p>
          </div>

          {/* members list */}
          <div className="gm-scroll relative z-10 flex-1 overflow-y-auto px-2 py-2">
            {loadingProfiles && rows.every((r) => r.username === "…") ? (
              <div className="flex items-center justify-center py-10 text-zinc-500 gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Loading members…</span>
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.uid}
                  className="group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/[0.04] transition-colors relative"
                >
                  <div
                    className="shrink-0 relative gm-avatar"
                    onClick={() => row.avatar && setZoomUrl(row.avatar)}
                  >
                    {row.avatar ? (
                      <img
                        src={row.avatar}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#1e2a3a] text-[#a893ff]">
                        {row.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span
                      className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-[#0d0b17]"
                      style={{
                        background: row.online ? "#34D399" : "#3f3f46",
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13.5px] font-medium text-white truncate">
                        {row.username}
                      </span>
                      {row.role === "owner" && (
                        <Crown size={12} className="text-yellow-400 shrink-0" />
                      )}
                      {row.role === "admin" && (
                        <ShieldCheck
                          size={12}
                          className="text-[#a893ff] shrink-0"
                        />
                      )}
                    </div>
                    <span className="text-[11.5px] text-zinc-500 truncate block">
                      {row.role === "owner"
                        ? "owner"
                        : row.role === "admin"
                        ? "admin"
                        : row.online
                        ? "online"
                        : formatLastSeen(row.lastSeen)}
                    </span>
                  </div>

                  {busyUid === row.uid ? (
                    <Loader2
                      size={15}
                      className="animate-spin text-zinc-500 shrink-0"
                    />
                  ) : (
                    (isOwner || canKick(row)) &&
                    row.role !== "owner" && (
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuUid((prev) =>
                              prev === row.uid ? null : row.uid
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                        >
                          <UserMinus size={14} />
                        </button>

                        {menuUid === row.uid && (
                          <div
                            className="gm-row-menu absolute right-0 top-8 z-30 min-w-[160px] rounded-xl bg-[#12111f] border border-white/[0.08] shadow-xl shadow-black/50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isOwner && (
                              <button
                                onClick={() => toggleAdmin(row)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-zinc-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                              >
                                {row.role === "admin" ? (
                                  <>
                                    <ShieldOff
                                      size={13}
                                      className="text-zinc-500"
                                    />
                                    Remove admin
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck
                                      size={13}
                                      className="text-zinc-500"
                                    />
                                    Make admin
                                  </>
                                )}
                              </button>
                            )}
                            {canKick(row) && (
                              <button
                                onClick={() => {
                                  setMenuUid(null);
                                  setKickTarget(row);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                              >
                                <UserMinus
                                  size={13}
                                  className="text-red-400/70"
                                />
                                Remove from group
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {zoomUrl && (
        <div
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setZoomUrl(null)}
        >
          <button
            onClick={() => setZoomUrl(null)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
          <img
            src={zoomUrl}
            alt="avatar"
            className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {kickTarget && (
        <ConfirmMini
          title={`Remove ${kickTarget.username}?`}
          description="They will lose access to this group and won't see new messages. They can be re-invited later."
          confirmLabel="Remove"
          onCancel={() => setKickTarget(null)}
          onConfirm={handleKickConfirmed}
        />
      )}
    </>
  );
}
