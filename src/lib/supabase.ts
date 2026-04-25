import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const MENU_BUCKET = "menu";

export async function uploadMenuImageSupabase(file: File, itemId: string, category: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("itemId", itemId);
  formData.append("category", category);

  const res = await fetch("/api/upload-menu-image", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Upload failed");
  }

  const { url } = await res.json();
  return url;
}
