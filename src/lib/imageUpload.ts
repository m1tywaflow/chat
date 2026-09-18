export function readImageSize(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(src);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(src);
    };
    img.src = src;
  });
}
