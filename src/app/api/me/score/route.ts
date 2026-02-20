import { createSupabaseServer } from "@/lib/supabase-server";
import { calculateMelboScore } from "@/lib/calculateMelboScore";
import { NextResponse } from "next/server";

// POST /api/me/score — recalculate and cache Melbo Score
export async function POST() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Always recalculate fresh
  const result = await calculateMelboScore(supabase, profile.id);

  // Update cache
  await supabase
    .from("profiles")
    .update({
      melbo_score: result.total,
      melbo_score_label: result.label,
      melbo_score_updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  return NextResponse.json({ melboScore: result });
}
