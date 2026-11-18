export function decoSrc(url: string, w: number) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w},c_limit/`);
}
export function decoStill(url: string, w: number) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/pg_1,f_webp,q_auto,w_${w},c_limit/`);
}
export function videoPoster(url: string, w: number): string | null {
  if (!url.includes("/video/upload/")) return null;
  return url
    .replace("/video/upload/", `/video/upload/so_0,q_auto,w_${w},c_limit/`)
    .replace(/\.[a-z0-9]+(?=$|\?)/i, ".jpg");
}
