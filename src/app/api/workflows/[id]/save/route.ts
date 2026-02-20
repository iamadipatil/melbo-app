import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workflowId } = await params;

  // Get IP for dedup
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // Check if already saved by this IP
  const { data: existingSave } = await supabase
    .from("workflow_saves")
    .select("id")
    .eq("workflow_id", workflowId)
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
    .from("workflow_saves")
    .insert({ workflow_id: workflowId, saver_ip: ip });

  if (saveError) {
    if (saveError.code === "23505") {
      return NextResponse.json(
        { error: "Already saved", saved: true },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  // Increment save_count on the workflow
  const { data: workflow } = await supabase
    .from("workflows")
    .select("save_count")
    .eq("id", workflowId)
    .single();

  const newCount = (workflow?.save_count || 0) + 1;

  await supabase
    .from("workflows")
    .update({ save_count: newCount })
    .eq("id", workflowId);

  return NextResponse.json({ saved: true, save_count: newCount });
}
