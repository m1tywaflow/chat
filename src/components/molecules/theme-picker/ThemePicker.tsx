"use client";

import {
  useThemeStore,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  ThemeMode,
  CustomTheme,
} from "@/store/theme-store";
import { saveThemeToFirestore } from "@/hooks/useTheme";
import { auth } from "@/lib/firebase";
import { Moon, Sun, Palette } from "lucide-react";

const MODES: { id: ThemeMode; label: string; Icon: any }[] = [
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "light", label: "Light", Icon: Sun },
  { id: "custom", label: "Custom", Icon: Palette },
];

const COLOR_FIELDS: { key: keyof CustomTheme; label: string }[] = [
  { key: "chatBg", label: "Chat background" },
  { key: "msgBg", label: "Message background" },
  { key: "text", label: "Text color" },
];

export default function ThemePicker() {
  const { mode, customTheme, setMode, setCustomTheme } = useThemeStore();

  async function handleMode(m: ThemeMode) {
    setMode(m);
    if (m === "dark") setCustomTheme(DEFAULT_DARK);
    else if (m === "light") setCustomTheme(DEFAULT_LIGHT);
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const base =
      m === "dark" ? DEFAULT_DARK : m === "light" ? DEFAULT_LIGHT : customTheme;
    await saveThemeToFirestore(uid, m, base);
  }

  async function handleColor(key: keyof CustomTheme, value: string) {
    const updated = { ...customTheme, [key]: value };
    setCustomTheme({ [key]: value });
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await saveThemeToFirestore(uid, mode, updated);
  }

  return (
    <div>
      <div className="text-[11px] text-white/30 tracking-widest mb-3">
        THEME
      </div>
      <div className="flex gap-2 mb-4">
        {MODES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleMode(id)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              mode === id
                ? "border-[#A78BFA]/60 bg-[#A78BFA]/10 text-[#A78BFA]"
                : "border-white/[0.08] bg-[#0f1520] text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === "custom" && (
        <div className="space-y-3 p-4 rounded-xl bg-[#0f1520] border border-white/[0.07]">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-white/50">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 font-mono">
                  {customTheme[key]}
                </span>
                <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 cursor-pointer">
                  <div
                    className="absolute inset-0"
                    style={{ background: customTheme[key] }}
                  />
                  <input
                    type="color"
                    value={customTheme[key]}
                    onChange={(e) => handleColor(key, e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
