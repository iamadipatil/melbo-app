import { supabase } from "@/lib/supabase";
import { getOrCalculateMelboScore } from "@/lib/calculateMelboScore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch stack items, prompts, impact stats, and workflows in parallel
  const [stackResult, promptsResult, impactResult, workflowsResult] = await Promise.all([
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
  ]);

  // Calculate or retrieve cached Melbo Score
  const melboScore = await getOrCalculateMelboScore(
    supabase,
    profile.id,
    profile.melbo_score,
    profile.melbo_score_label,
    profile.melbo_score_updated_at
  );

  return NextResponse.json({
    profile,
    stack: stackResult.data || [],
    prompts: promptsResult.data || [],
    impact_stats: impactResult.data || [],
    workflows: workflowsResult.data || [],
    melboScore,
  });
}
