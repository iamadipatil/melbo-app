import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/me/prompts — replace all prompts (full overwrite, preserves save_count)
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

  // Get existing prompts to preserve save_count for matching IDs
  const { data: existing } = await supabase
    .from("prompts")
    .select("id, save_count")
    .eq("profile_id", profile.id);

  const saveCountMap = new Map(
    (existing || []).map((p) => [p.id, p.save_count])
  );

  // Delete all existing prompts (cascades saves for removed prompts)
  await supabase.from("prompts").delete().eq("profile_id", profile.id);

  // Insert new/updated ones
  if (items.length > 0) {
    const toInsert = items.map(
      (
        item: {
          id?: string;
          title: string;
          prompt_text: string;
          description?: string;
          category?: string;
        },
        i: number
      ) => ({
        profile_id: profile.id,
        title: item.title,
        prompt_text: item.prompt_text,
        description: item.description || null,
        category: item.category || null,
        save_count: item.id ? saveCountMap.get(item.id) || 0 : 0,
        sort_order: i,
      })
    );

    const { error } = await supabase.from("prompts").insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Return fresh prompts
  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ prompts: prompts || [] });
}
