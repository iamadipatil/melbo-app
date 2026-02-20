import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMPACT_STATS = 6;

// PUT /api/me/impact-stats — replace all impact stats (full overwrite)
export async function PUT(request: NextRequest) {
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

  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "items must be an array" },
      { status: 400 }
    );
  }

  if (items.length > MAX_IMPACT_STATS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMPACT_STATS} impact stats allowed` },
      { status: 400 }
    );
  }

  // Delete all existing impact stats
  await supabase.from("impact_stats").delete().eq("profile_id", profile.id);

  // Insert new ones
  if (items.length > 0) {
    const toInsert = items.map(
      (
        item: {
          metric: string;
          before_value?: string;
          after_value: string;
          context?: string;
        },
        i: number
      ) => ({
        profile_id: profile.id,
        metric: item.metric,
        before_value: item.before_value || null,
        after_value: item.after_value,
        context: item.context || null,
        sort_order: i,
      })
    );

    const { error } = await supabase.from("impact_stats").insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Return fresh impact stats
  const { data: impactStats } = await supabase
    .from("impact_stats")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ impact_stats: impactStats || [] });
}
