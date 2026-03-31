import { supabase } from "@/lib/supabase";

export async function uploadProgressPhoto(
  file: File,
  userId: string,
  view: "front" | "side" | "back"
): Promise<string | null> {
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${timestamp}-${view}.${ext}`;

  const { error } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  // Return the path (not public URL) - photos are private
  return path;
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  // Generate a signed URL that expires in 1 hour - only accessible by authenticated users
  const { data, error } = await supabase.storage
    .from("progress-photos")
    .createSignedUrl(path, 3600);

  if (error) return null;
  return data.signedUrl;
}
