export async function sendVoiceMessage(
  chatId: string,
  data: { audioUrl: string; duration: number; waveform: number[] }
) {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) return;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId: currentUser.uid,
    type: "voice",
    audioUrl: data.audioUrl,
    duration: data.duration,
    waveform: data.waveform,
    createdAt: serverTimestamp(),
    read: false,
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: "🎤 Голосовое сообщение",
    lastMessageAt: serverTimestamp(),
  });
}
