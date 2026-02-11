import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: promptId } = await params;

  // Get IP for dedup
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // Check if already saved by this IP
  const { data: existingSave } = await supabase
    .from("saves")
    .select("id")
    .eq("prompt_id", promptId)
    .eq("saver_ip", ip)
    .single();

  if (existingSave) {
    return NextResponse.json(
      { error: "Already saved", saved: true },
      { status: 409 }
    );
  }

  // Insert save
  const { error: saveError } = await supabase
    .from("saves")
    .insert({ prompt_id: promptId, saver_ip: ip });

  if (saveError) {
    // Likely a unique constraint violation (race condition)
    if (saveError.code === "23505") {
      return NextResponse.json(
        { error: "Already saved", saved: true },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }

  // Increment save_count on the prompt
  const { data: prompt } = await supabase
    .from("prompts")
    .select("save_count")
    .eq("id", promptId)
    .single();

  const newCount = (prompt?.save_count || 0) + 1;

  await supabase
    .from("prompts")
    .update({ save_count: newCount })
    .eq("id", promptId);

  return NextResponse.json({ saved: true, save_count: newCount });
}
