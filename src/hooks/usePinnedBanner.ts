import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export interface PinnedBannerState<T extends { id: string }> {
  pins: T[];
  current: T | null;
  currentIndex: number;
  hasMany: boolean;
  listOpen: boolean;
  toggleList: () => void;
  handleBannerClick: () => void;
  handleSelect: (index: number) => void;
}

export function usePinnedBanner<T extends { id: string }>(
  pins: T[],
  onJump: (id: string) => void | Promise<void>,
  resetKey?: string | null
): PinnedBannerState<T> {
  const [pinIndex, setPinIndex] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const prevLenRef = useRef(0);

  useLayoutEffect(() => {
    prevLenRef.current = 0;
    setPinIndex(0);
    setListOpen(false);
  }, [resetKey]);

  useEffect(() => {
    const len = pins.length;
    const prev = prevLenRef.current;
    prevLenRef.current = len;
    if (len > prev) {
      setPinIndex(len - 1);
    } else {
      setPinIndex((i) => Math.min(i, Math.max(0, len - 1)));
    }
  }, [pins.length]);

  useEffect(() => {
    if (!listOpen) return;
    const close = () => setListOpen(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setListOpen(false);
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", handleKey);
    };
  }, [listOpen]);

  useEffect(() => {
    if (pins.length < 2) setListOpen(false);
  }, [pins.length]);

  const currentIndex = Math.min(pinIndex, Math.max(0, pins.length - 1));
  const current = pins[currentIndex] ?? null;
  const hasMany = pins.length > 1;

  const toggleList = useCallback(() => setListOpen((v) => !v), []);

  const handleBannerClick = useCallback(() => {
    const total = pins.length;
    if (!total) return;
    const index = Math.min(pinIndex, total - 1);
    onJump(pins[index].id);
    setListOpen(false);
    if (total > 1) setPinIndex((index - 1 + total) % total);
  }, [pins, pinIndex, onJump]);

  const handleSelect = useCallback(
    (index: number) => {
      const target = pins[index];
      if (!target) return;
      setPinIndex(index);
      setListOpen(false);
      onJump(target.id);
    },
    [pins, onJump]
  );

  return {
    pins,
    current,
    currentIndex,
    hasMany,
    listOpen,
    toggleList,
    handleBannerClick,
    handleSelect,
  };
}
