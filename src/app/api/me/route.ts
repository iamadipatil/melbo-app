import { createSupabaseServer } from "@/lib/supabase-server";
import { getOrCalculateMelboScore } from "@/lib/calculateMelboScore";
import { NextRequest, NextResponse } from "next/server";

// GET /api/me — get current user's profile
export async function GET() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Find profile by email
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!profile) {
    // No profile yet — return email so edit page can handle onboarding
    return NextResponse.json({
      profile: null,
      email: user.email,
      needsProfile: true,
    });
  }

  // Fetch stack, prompts, impact stats, and workflows
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

  // Calculate Melbo Score
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
    email: user.email,
    needsProfile: false,
    melboScore,
  });
}

// PUT /api/me — update profile fields
export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { display_name, headline, bio, username, onboarding_completed } = body;

  // Check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .single();

  if (existing) {
    // Update existing
    const updates: Record<string, string | boolean> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updates.display_name = display_name;
    if (headline !== undefined) updates.headline = headline;
    if (bio !== undefined) updates.bio = bio;
    if (onboarding_completed !== undefined) updates.onboarding_completed = onboarding_completed;

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ profile: data });
  } else {
    // Create new profile
    if (!username) {
      return NextResponse.json(
        { error: "Username is required for new profiles" },
        { status: 400 }
      );
    }

    // Check username availability
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (taken) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username,
        email: user.email,
        display_name: display_name || null,
        headline: headline || null,
        bio: bio || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ profile: data });
  }
}
