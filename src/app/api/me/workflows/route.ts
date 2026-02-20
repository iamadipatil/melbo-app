import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/me/workflows — replace all workflows (full overwrite, preserves save_count)
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

  // Get existing workflows to preserve save_count for matching IDs
  const { data: existing } = await supabase
    .from("workflows")
    .select("id, save_count")
    .eq("profile_id", profile.id);

  const saveCountMap = new Map(
    (existing || []).map((w) => [w.id, w.save_count])
  );

  // Delete all existing workflows (cascades workflow_saves for removed workflows)
  await supabase.from("workflows").delete().eq("profile_id", profile.id);

  // Insert new/updated ones
  if (items.length > 0) {
    const toInsert = items.map(
      (
        item: {
          id?: string;
          title: string;
          description?: string;
          steps: { order: number; tool: string; action: string }[];
        },
        i: number
      ) => ({
        profile_id: profile.id,
        title: item.title,
        description: item.description || null,
        steps: item.steps || [],
        save_count: item.id ? saveCountMap.get(item.id) || 0 : 0,
        sort_order: i,
      })
    );

    const { error } = await supabase.from("workflows").insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Return fresh workflows
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ workflows: workflows || [] });
}
