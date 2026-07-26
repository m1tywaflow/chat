export async function getWaveform(blob: Blob, samples = 40): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++)
      sum += Math.abs(rawData[start + j] || 0);
    waveform.push(sum / blockSize);
  }

  const max = Math.max(...waveform, 0.0001);
  return waveform.map((v) => Math.min(1, v / max));
}

export async function uploadVoice(
  blob: Blob
): Promise<{ url: string; duration: number }> {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "chat_voice");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/video/upload",
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Voice upload failed");

  const data = await res.json();
  return { url: data.secure_url as string, duration: data.duration as number };
}
