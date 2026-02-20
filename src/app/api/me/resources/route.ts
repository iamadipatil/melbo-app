import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const MAX_RESOURCES = 12;

// PUT /api/me/resources — replace all resources (full overwrite)
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

  if (items.length > MAX_RESOURCES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_RESOURCES} resources allowed` },
      { status: 400 }
    );
  }

  // Delete all existing resources
  await supabase.from("resources").delete().eq("profile_id", profile.id);

  // Insert new ones
  if (items.length > 0) {
    const toInsert = items.map(
      (
        item: {
          title: string;
          url: string;
          resource_type?: string;
        },
        i: number
      ) => ({
        profile_id: profile.id,
        title: item.title,
        url: item.url,
        resource_type: item.resource_type || "article",
        sort_order: i,
      })
    );

    const { error } = await supabase.from("resources").insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Return fresh resources
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ resources: resources || [] });
}
