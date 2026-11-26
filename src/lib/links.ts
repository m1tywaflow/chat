const URL_SOURCE = "https?:\\/\\/[^\\s<>\"'`]+";
const STRIP_END = ".,!?;:'\"»”]}";
const MAX_URL_LENGTH = 2000;

export interface TextSegment {
  type: "text" | "link";
  value: string;
}

function trimUrl(raw: string): string {
  let url = raw;
  while (url.length > 0) {
    const last = url[url.length - 1];
    if (STRIP_END.includes(last)) {
      url = url.slice(0, -1);
      continue;
    }
    if (last === ")") {
      const open = url.split("(").length - 1;
      const close = url.split(")").length - 1;
      if (close > open) {
        url = url.slice(0, -1);
        continue;
      }
    }
    break;
  }
  return url;
}

function isValidUrl(url: string): boolean {
  if (!url || url.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

export function extractFirstUrl(text: unknown): string | null {
  if (typeof text !== "string" || !text) return null;
  const re = new RegExp(URL_SOURCE, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const url = trimUrl(match[0]);
    if (isValidUrl(url)) return url;
  }
  return null;
}

export function splitLinks(text: string): TextSegment[] {
  if (!text) return [];
  const out: TextSegment[] = [];
  const re = new RegExp(URL_SOURCE, "gi");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const url = trimUrl(match[0]);
    if (!isValidUrl(url)) continue;
    if (match.index > last) {
      out.push({ type: "text", value: text.slice(last, match.index) });
    }
    out.push({ type: "link", value: url });
    last = match.index + url.length;
    re.lastIndex = last;
  }
  if (last < text.length) {
    out.push({ type: "text", value: text.slice(last) });
  }
  return out;
}
