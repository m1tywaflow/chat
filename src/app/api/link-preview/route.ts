import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";

const MAX_BYTES = 600 * 1024;
const MAX_REDIRECTS = 4;
const USER_AGENT =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) {
      return true;
    }
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
    return false;
  }
  return true;
}

async function assertPublic(u: URL) {
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("bad protocol");
  }
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("private ip");
    return;
  }
  const records = await lookup(host, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("private ip");
  }
}

async function readLimited(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8");
  let html = "";
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (size > MAX_BYTES || /<\/head>/i.test(html)) {
      await reader.cancel();
      break;
    }
  }
  return html;
}

async function fetchPage(startUrl: string) {
  let current = startUrl;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const u = new URL(current);
    await assertPublic(u);
    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(6000),
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en,ru;q=0.8",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      current = new URL(location, u).toString();
      continue;
    }
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("application/xhtml")) {
      return null;
    }
    return { html: await readLimited(res), finalUrl: u.toString() };
  }
  return null;
}

function decodeEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function parseMeta(html: string) {
  const map = new Map<string, string>();
  const tags = html.match(/<meta\s[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    const re = /([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(tag))) {
      attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
    }
    const key = (attrs.property || attrs.name || "").toLowerCase();
    if (key && attrs.content && !map.has(key)) {
      map.set(key, decodeEntities(attrs.content).trim());
    }
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return {
    map,
    title: titleMatch ? decodeEntities(titleMatch[1]).trim() : "",
  };
}

function absoluteHttp(value: string | undefined, base: string) {
  if (!value) return null;
  try {
    const u = new URL(value, base);
    return u.protocol === "http:" || u.protocol === "https:"
      ? u.toString()
      : null;
  } catch {
    return null;
  }
}

function isYouTube(u: URL) {
  const host = u.hostname.toLowerCase();
  return (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com")
  );
}

async function youtubePreview(rawUrl: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
        rawUrl
      )}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.title) return null;
    return {
      url: rawUrl,
      title: String(data.title).slice(0, 150),
      description: data.author_name
        ? String(data.author_name).slice(0, 300)
        : "",
      image: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
      siteName: "YouTube",
    };
  } catch {
    return null;
  }
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  if (!raw || raw.length > 2000) {
    return NextResponse.json({ preview: null }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ preview: null }, { status: 400 });
  }

  try {
    if (isYouTube(parsed)) {
      const yt = await youtubePreview(raw);
      if (yt) {
        return NextResponse.json({ preview: yt }, { headers: CACHE_HEADERS });
      }
    }

    const page = await fetchPage(raw);
    if (!page) return NextResponse.json({ preview: null });

    const { map, title: docTitle } = parseMeta(page.html);
    const title = (
      map.get("og:title") ||
      map.get("twitter:title") ||
      docTitle
    ).slice(0, 150);
    const description = (
      map.get("og:description") ||
      map.get("twitter:description") ||
      map.get("description") ||
      ""
    ).slice(0, 300);
    const image = absoluteHttp(
      map.get("og:image") ||
        map.get("og:image:url") ||
        map.get("twitter:image") ||
        map.get("twitter:image:src"),
      page.finalUrl
    );
    const siteName =
      map.get("og:site_name") ||
      new URL(page.finalUrl).hostname.replace(/^www\./, "");

    if (!title && !image) return NextResponse.json({ preview: null });

    return NextResponse.json(
      {
        preview: {
          url: page.finalUrl,
          title,
          description,
          image,
          siteName,
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json({ preview: null });
  }
}
