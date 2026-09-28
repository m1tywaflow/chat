export function decoSrc(url: string, w: number) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w},c_limit/`);
}
