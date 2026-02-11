import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProfileClient from "./profile-client";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, headline, username")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "Not Found — Melbo" };
  }

  const name = profile.display_name || profile.username;
  return {
    title: `${name} — Melbo`,
    description: profile.headline || `${name}'s AI profile on Melbo`,
    openGraph: {
      title: `${name} — Melbo`,
      description: profile.headline || `${name}'s AI profile on Melbo`,
      siteName: "Melbo",
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  // Fetch profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Fetch stack and prompts in parallel
  const [stackResult, promptsResult] = await Promise.all([
    supabase
      .from("stack_items")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("prompts")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <ProfileClient
      profile={profile}
      stack={stackResult.data || []}
      prompts={promptsResult.data || []}
    />
  );
}
