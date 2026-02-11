import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/me/stack — replace all stack items (full overwrite)
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

  // Delete existing stack items
  await supabase.from("stack_items").delete().eq("profile_id", profile.id);

  // Insert new ones
  if (items.length > 0) {
    const toInsert = items.map(
      (
        item: {
          tool_name: string;
          description: string;
          is_primary: boolean;
        },
        i: number
      ) => ({
        profile_id: profile.id,
        tool_name: item.tool_name,
        description: item.description || null,
        is_primary: item.is_primary || false,
        sort_order: i,
      })
    );

    const { error } = await supabase.from("stack_items").insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Return fresh stack
  const { data: stack } = await supabase
    .from("stack_items")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ stack: stack || [] });
}
