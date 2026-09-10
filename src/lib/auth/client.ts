import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./public-config";

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  clientPromise ??= getSupabasePublicConfig().then((config) =>
    config
      ? createBrowserClient(config.url, config.anonKey, {
          auth: { detectSessionInUrl: false },
        })
      : null,
  );
  return clientPromise;
}

export const authEnabled = true;

function getOAuthCallbackUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname === "memory-garden-theta.vercel.app") {
    return "https://memory-garden-theta.vercel.app/auth/callback";
  }
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return `${window.location.origin}/auth/callback`;
  }
  return typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "https://memory-garden-theta.vercel.app/auth/callback";
}

export async function signUpEmail(email: string, password: string, name: string): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-up is not configured");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-in is not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signInGoogle(): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-in is not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getOAuthCallbackUrl() },
  });
  if (error) throw new Error(error.message);
}

export async function uploadMemoryPhoto(file: File): Promise<{ path: string; signedUrl: string }> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Photo storage is not configured");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must be signed in to upload a photo.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("memory-photos").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: signedData, error: signedError } = await supabase.storage
    .from("memory-photos")
    .createSignedUrl(path, 60 * 60 * 24);
  if (signedError || !signedData?.signedUrl) {
    await supabase.storage.from("memory-photos").remove([path]);
    throw new Error(signedError?.message ?? "Could not create a photo preview.");
  }

  return { path, signedUrl: signedData.signedUrl };
}

export async function removeMemoryPhoto(path: string | null): Promise<void> {
  if (!path) return;
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.storage.from("memory-photos").remove([path]);
  if (error) throw new Error(error.message);
}

export async function signOut(redirectTo = "/"): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
  window.location.href = redirectTo;
}
