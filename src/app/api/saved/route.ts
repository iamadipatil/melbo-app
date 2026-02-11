import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get IP for lookup
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // Fetch all saves for this IP, with the prompt and profile info
  const { data: saves, error } = await supabase
    .from("saves")
    .select(
      `
      id,
      created_at,
      prompt_id,
      prompts (
        id,
        title,
        prompt_text,
        description,
        category,
        save_count,
        profile_id,
        profiles (
          username,
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("saver_ip", ip)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch saves", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ saves: saves || [] });
}
