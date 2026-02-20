import { SupabaseClient } from "@supabase/supabase-js";

export interface MelboScoreResult {
  total: number;
  label: string;
  pillars: {
    profile: { score: number; max: 20 };
    content: { score: number; max: 35 };
    stackImpact: { score: number; max: 25 };
    engagement: { score: number; max: 20 };
  };
}

function getLabel(score: number): string {
  if (score >= 80) return "AI Native";
  if (score >= 60) return "Power User";
  if (score >= 40) return "Builder";
  if (score >= 20) return "Explorer";
  return "Starter";
}

/**
 * Calculate the Melbo Score for a given profile.
 * Accepts a Supabase client (public or server) and a profile ID.
 */
export async function calculateMelboScore(
  supabase: SupabaseClient,
  profileId: string
): Promise<MelboScoreResult> {
  // Fetch all data in parallel
  const [profileResult, stackResult, promptsResult, impactResult, workflowsResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("stack_items").select("*").eq("profile_id", profileId),
      supabase.from("prompts").select("*").eq("profile_id", profileId),
      supabase.from("impact_stats").select("*").eq("profile_id", profileId),
      supabase.from("workflows").select("*").eq("profile_id", profileId),
    ]);

  const profile = profileResult.data;
  const stackItems = stackResult.data || [];
  const prompts = promptsResult.data || [];
  const impactStats = impactResult.data || [];
  const workflows = workflowsResult.data || [];

  if (!profile) {
    return {
      total: 0,
      label: "Starter",
      pillars: {
        profile: { score: 0, max: 20 },
        content: { score: 0, max: 35 },
        stackImpact: { score: 0, max: 25 },
        engagement: { score: 0, max: 20 },
      },
    };
  }

  // ===== PILLAR 1: PROFILE COMPLETENESS (20 max) =====
  let profileScore = 0;
  if (profile.display_name && profile.display_name.trim()) profileScore += 3;
  if (profile.headline && profile.headline.trim()) profileScore += 3;
  if (profile.bio && profile.bio.trim()) profileScore += 4;
  if (profile.bio && profile.bio.trim().length >= 50) profileScore += 2;
  if (profile.avatar_url && profile.avatar_url.trim()) profileScore += 3;
  if (stackItems.length >= 1) profileScore += 3;
  if (stackItems.some((s: { description: string | null }) => s.description && s.description.trim())) profileScore += 2;

  // ===== PILLAR 2: PROMPTS & CONTENT DEPTH (35 max) =====
  let contentScore = 0;
  const promptCount = prompts.length;
  // Diminishing returns for prompt count
  if (promptCount >= 1) contentScore += 5;
  if (promptCount >= 2) contentScore += 4;
  if (promptCount >= 3) contentScore += 3;
  if (promptCount >= 4) contentScore += 2;
  if (promptCount >= 5) contentScore += 2;
  // 6th through 9th: +1 each (max +4)
  const extraPrompts = Math.min(promptCount - 5, 4);
  if (extraPrompts > 0) contentScore += extraPrompts;

  // All prompts have category
  if (prompts.length > 0 && prompts.every((p: { category: string | null }) => p.category && p.category.trim())) {
    contentScore += 3;
  }
  // At least 1 prompt has description
  if (prompts.some((p: { description: string | null }) => p.description && p.description.trim())) {
    contentScore += 2;
  }
  // Average prompt_text length >= 100
  if (prompts.length > 0) {
    const avgLength =
      prompts.reduce((sum: number, p: { prompt_text: string }) => sum + (p.prompt_text || "").length, 0) /
      prompts.length;
    if (avgLength >= 100) contentScore += 3;
  }
  // Workflows
  if (workflows.length >= 1) contentScore += 4;
  // At least 1 workflow with 3+ steps
  if (
    workflows.some((w: { steps: unknown }) => {
      const steps = Array.isArray(w.steps) ? w.steps : [];
      return steps.length >= 3;
    })
  ) {
    contentScore += 3;
  }

  // ===== PILLAR 3: STACK & IMPACT (25 max) =====
  let stackImpactScore = 0;
  if (stackItems.length >= 3) stackImpactScore += 3;
  if (stackItems.length >= 5) stackImpactScore += 3;
  // At least 2 stack items with descriptions
  const stackWithDesc = stackItems.filter(
    (s: { description: string | null }) => s.description && s.description.trim()
  ).length;
  if (stackWithDesc >= 2) stackImpactScore += 3;
  // At least 1 primary
  if (stackItems.some((s: { is_primary: boolean }) => s.is_primary)) stackImpactScore += 2;
  // Impact stats
  if (impactStats.length >= 1) stackImpactScore += 4;
  if (impactStats.length >= 2) stackImpactScore += 3;
  if (impactStats.length >= 3) stackImpactScore += 2;
  // At least 1 with both before and after
  if (
    impactStats.some(
      (s: { before_value: string | null; after_value: string | null }) =>
        s.before_value && s.before_value.trim() && s.after_value && s.after_value.trim()
    )
  ) {
    stackImpactScore += 3;
  }
  // At least 1 with context
  if (impactStats.some((s: { context: string | null }) => s.context && s.context.trim())) {
    stackImpactScore += 2;
  }

  // ===== PILLAR 4: ENGAGEMENT (20 max) =====
  let engagementScore = 0;
  const promptSaves = prompts.reduce(
    (sum: number, p: { save_count: number }) => sum + (p.save_count || 0),
    0
  );
  const workflowSaves = workflows.reduce(
    (sum: number, w: { save_count: number }) => sum + (w.save_count || 0),
    0
  );
  const totalSaves = promptSaves + workflowSaves;
  // Cumulative thresholds
  if (totalSaves >= 5) engagementScore += 3;
  if (totalSaves >= 25) engagementScore += 4;
  if (totalSaves >= 100) engagementScore += 5;
  if (totalSaves >= 500) engagementScore += 4;
  if (totalSaves >= 1000) engagementScore += 4;

  const total = Math.min(
    profileScore + contentScore + stackImpactScore + engagementScore,
    100
  );

  return {
    total,
    label: getLabel(total),
    pillars: {
      profile: { score: Math.min(profileScore, 20), max: 20 },
      content: { score: Math.min(contentScore, 35), max: 35 },
      stackImpact: { score: Math.min(stackImpactScore, 25), max: 25 },
      engagement: { score: Math.min(engagementScore, 20), max: 20 },
    },
  };
}

/**
 * Calculate and cache the score. Returns the score result.
 * If cached score is fresh (< 5 minutes), returns cached value.
 */
export async function getOrCalculateMelboScore(
  supabase: SupabaseClient,
  profileId: string,
  cachedScore?: number | null,
  cachedLabel?: string | null,
  cachedUpdatedAt?: string | null
): Promise<MelboScoreResult> {
  // Check if cached score is still fresh (< 5 minutes)
  if (cachedUpdatedAt && cachedScore !== null && cachedScore !== undefined) {
    const age = Date.now() - new Date(cachedUpdatedAt).getTime();
    if (age < 5 * 60 * 1000) {
      // Return cached but still need pillar breakdown — recalculate
      // Actually we need pillars for the tooltip, so always calculate
      // But we can skip the DB update if fresh
      const result = await calculateMelboScore(supabase, profileId);
      return result;
    }
  }

  // Calculate fresh
  const result = await calculateMelboScore(supabase, profileId);

  // Update cache in profiles table
  await supabase
    .from("profiles")
    .update({
      melbo_score: result.total,
      melbo_score_label: result.label,
      melbo_score_updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  return result;
}
