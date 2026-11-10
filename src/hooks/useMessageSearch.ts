"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

const MAX_SEARCH_PAGES = 20;
const MAX_LOAD_WAIT_FRAMES = 300;
const EMPTY_IDS: string[] = [];
const TOKEN_STRIP_RE = /::[\w-]+::/g;

function nextPaint() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

function searchableText(m: any): string {
  if (m.poll?.question) return String(m.poll.question).toLowerCase();
  if (typeof m.text !== "string" || !m.text) return "";
  return m.text.replace(TOKEN_STRIP_RE, " ").toLowerCase();
}

function clearSearchHighlights() {
  if (typeof CSS === "undefined") return;
  const registry = (CSS as any).highlights;
  if (!registry) return;
  registry.delete("search-match");
  registry.delete("search-current");
}

function applySearchHighlights(
  ids: string[],
  query: string,
  activeId: string | null,
  idPrefix: string
) {
  if (typeof CSS === "undefined") return;
  const registry = (CSS as any).highlights;
  const HighlightCtor = (window as any).Highlight;
  if (!registry || !HighlightCtor) return;

  const all = new HighlightCtor();
  const current = new HighlightCtor();

  for (const id of ids) {
    const el = document.getElementById(`${idPrefix}${id}`);
    if (!el) continue;
    const scope = el.querySelector(".whitespace-pre-wrap") ?? el;
    const target = id === activeId ? current : all;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      const value = node.nodeValue;
      const skip =
        !value ||
        (parent &&
          typeof parent.className === "string" &&
          parent.className.includes("text-[10px]"));
      if (!skip && value) {
        const lower = value.toLowerCase();
        let from = 0;
        let at = lower.indexOf(query, from);
        while (at !== -1) {
          const range = new Range();
          range.setStart(node, at);
          range.setEnd(node, at + query.length);
          target.add(range);
          from = at + query.length;
          at = lower.indexOf(query, from);
        }
      }
      node = walker.nextNode();
    }
  }

  registry.set("search-match", all);
  registry.set("search-current", current);
}

interface UseMessageSearchOptions {
  messages: any[];
  hasMore: boolean;
  isLoadingOlderRef: MutableRefObject<boolean>;
  loadOlderRef: MutableRefObject<() => Promise<void>>;
  scrollToMessage: (id: string) => void;
  idPrefix: string;
  resetKey: string | null;
  enabled?: boolean;
  renderToken?: unknown;
}

export function useMessageSearch({
  messages,
  hasMore,
  isLoadingOlderRef,
  loadOlderRef,
  scrollToMessage,
  idPrefix,
  resetKey,
  enabled = true,
  renderToken,
}: UseMessageSearchOptions) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const hasMoreRef = useRef(hasMore);
  const matchIdsRef = useRef<string[]>(EMPTY_IDS);
  const normalizedQueryRef = useRef("");
  const searchingRef = useRef(false);
  const autoSearchedRef = useRef("");
  const scrollRef = useRef(scrollToMessage);

  useLayoutEffect(() => {
    hasMoreRef.current = hasMore;
    scrollRef.current = scrollToMessage;
  });

  const deferredQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const matchIds = useMemo<string[]>(() => {
    if (!searchOpen || !normalizedQuery) return EMPTY_IDS;
    const out: string[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.deleted) continue;
      if (searchableText(m).includes(normalizedQuery)) out.push(m.id);
    }
    return out.length ? out : EMPTY_IDS;
  }, [searchOpen, normalizedQuery, messages]);

  useLayoutEffect(() => {
    matchIdsRef.current = matchIds;
    normalizedQueryRef.current = normalizedQuery;
  }, [matchIds, normalizedQuery]);

  const rawActiveIdx = activeMatchId ? matchIds.indexOf(activeMatchId) : -1;
  const activeIndex = matchIds.length ? Math.max(rawActiveIdx, 0) : -1;

  const deepen = useCallback(async () => {
    if (searchingRef.current) return;
    searchingRef.current = true;
    setSearching(true);
    const before = matchIdsRef.current.length;
    const startQuery = normalizedQueryRef.current;
    try {
      for (let i = 0; i < MAX_SEARCH_PAGES && hasMoreRef.current; i++) {
        let waited = 0;
        while (isLoadingOlderRef.current && waited < MAX_LOAD_WAIT_FRAMES) {
          await nextPaint();
          waited++;
          if (normalizedQueryRef.current !== startQuery) break;
        }
        if (normalizedQueryRef.current !== startQuery) break;
        await loadOlderRef.current();
        await nextPaint();
        if (normalizedQueryRef.current !== startQuery) break;
        if (matchIdsRef.current.length > before) break;
      }
    } finally {
      searchingRef.current = false;
      setSearching(false);
    }
    if (normalizedQueryRef.current !== startQuery) return;
    const after = matchIdsRef.current;
    if (after.length > before) setActiveMatchId(after[before]);
  }, [isLoadingOlderRef, loadOlderRef]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveMatchId(null);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled]);

  useEffect(() => {
    if (!searchOpen || !normalizedQuery) {
      setActiveMatchId(null);
      return;
    }
    setActiveMatchId(matchIdsRef.current[0] ?? null);
  }, [searchOpen, normalizedQuery]);

  useEffect(() => {
    if (!activeMatchId) return;
    scrollRef.current(activeMatchId);
  }, [activeMatchId]);

  useEffect(() => {
    if (!searchOpen || !normalizedQuery) {
      autoSearchedRef.current = "";
      return;
    }
    if (matchIds.length > 0 || !hasMore || searching) return;
    if (autoSearchedRef.current === normalizedQuery) return;
    autoSearchedRef.current = normalizedQuery;
    deepen();
  }, [
    searchOpen,
    normalizedQuery,
    matchIds.length,
    hasMore,
    searching,
    deepen,
  ]);

  useEffect(() => {
    if (!searchOpen || !normalizedQuery || matchIds.length === 0) {
      clearSearchHighlights();
      return;
    }
    applySearchHighlights(matchIds, normalizedQuery, activeMatchId, idPrefix);
  }, [
    searchOpen,
    normalizedQuery,
    matchIds,
    activeMatchId,
    idPrefix,
    renderToken,
  ]);

  useEffect(() => () => clearSearchHighlights(), []);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveMatchId(null);
  }, []);

  function goOlder() {
    if (activeIndex + 1 < matchIds.length) {
      setActiveMatchId(matchIds[activeIndex + 1]);
    } else if (hasMore) {
      deepen();
    }
  }

  function goNewer() {
    if (activeIndex > 0) setActiveMatchId(matchIds[activeIndex - 1]);
  }

  return {
    searchOpen,
    searchQuery,
    setSearchQuery,
    openSearch,
    closeSearch,
    matchCount: matchIds.length,
    activeIndex,
    searching,
    goOlder,
    goNewer,
  };
}
