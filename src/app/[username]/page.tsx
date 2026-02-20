import { supabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getOrCalculateMelboScore } from "@/lib/calculateMelboScore";
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
    .select("display_name, headline, username, melbo_score, melbo_score_label")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "Not Found — Melbo" };
  }

  const name = profile.display_name || profile.username;
  const scoreLabel = profile.melbo_score_label || "Starter";
  const score = profile.melbo_score || 0;

  // Count prompts and workflows for OG description
  const [promptsCount, workflowsCount, stackResult] = await Promise.all([
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("profile_id", profile.username),
    supabase.from("workflows").select("id", { count: "exact", head: true }).eq("profile_id", profile.username),
    supabase.from("stack_items").select("tool_name").eq("profile_id", profile.username).order("sort_order", { ascending: true }).limit(3),
  ]);

  const stackNames = (stackResult.data || []).map((s: { tool_name: string }) => s.tool_name).join(", ");
  const description = `${name}'s Melbo — ${scoreLabel} (Score: ${score}/100).${stackNames ? ` AI Stack: ${stackNames}.` : ""} ${profile.headline || ""}`.trim();

  return {
    title: `${name} — Melbo`,
    description,
    openGraph: {
      title: `${name} — Melbo`,
      description,
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

  // Fetch stack, prompts, impact stats, workflows, and score in parallel
  const [stackResult, promptsResult, impactResult, workflowsResult, melboScore] = await Promise.all([
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
    supabase
      .from("impact_stats")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("workflows")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    getOrCalculateMelboScore(
      supabase,
      profile.id,
      profile.melbo_score,
      profile.melbo_score_label,
      profile.melbo_score_updated_at
    ),
  ]);

  // Check if the logged-in user is viewing their own profile
  let isOwnProfile = false;
  try {
    const supabaseAuth = await createSupabaseServer();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) {
      isOwnProfile = user.id === profile.user_id;
    }
  } catch {
    // Not logged in or error — leave as false
  }

  return (
    <ProfileClient
      profile={profile}
      stack={stackResult.data || []}
      prompts={promptsResult.data || []}
      impactStats={impactResult.data || []}
      workflows={workflowsResult.data || []}
      melboScore={melboScore}
      isOwnProfile={isOwnProfile}
    />
  );
}
