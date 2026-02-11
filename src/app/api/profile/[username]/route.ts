import { supabase } from "@/lib/supabase";
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

  // Fetch stack items
  const { data: stack } = await supabase
    .from("stack_items")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  // Fetch prompts
  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    profile,
    stack: stack || [],
    prompts: prompts || [],
  });
}
