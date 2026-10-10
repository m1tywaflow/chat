// export function decoSrc(url: string, w: number) {
//   if (!url.includes("/upload/")) return url;
//   return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w},c_limit/`);
// }

export function decoSrc(url: string, w: number) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${w},c_limit/`);
}
export function decoStill(url: string, w: number) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/pg_1,f_webp,q_auto,w_${w},c_limit/`);
}
