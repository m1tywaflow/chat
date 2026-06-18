export async function uploadAvatar(file: File, uid: string) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "jhravxtb");
  formData.append("folder", "avatars");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgylh67ms/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();

  return data.secure_url;
}
