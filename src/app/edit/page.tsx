"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { getToolIcon, KNOWN_TOOLS } from "@/lib/tool-icons";
import type { MelboScoreResult } from "@/lib/calculateMelboScore";
import Onboarding from "./onboarding";

interface StackItem {
  id?: string;
  tool_name: string;
  description: string;
  is_primary: boolean;
}

interface PromptItem {
  id?: string;
  title: string;
  prompt_text: string;
  description: string;
  category: string;
}

interface ImpactStatItem {
  id?: string;
  metric: string;
  before_value: string;
  after_value: string;
  context: string;
}

interface WorkflowStepItem {
  tool: string;
  action: string;
}

interface WorkflowItem {
  id?: string;
  title: string;
  description: string;
  steps: WorkflowStepItem[];
}

interface ResourceItem {
  id?: string;
  title: string;
  url: string;
  resource_type: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  headline: string;
  bio: string;
}

export default function EditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [email, setEmail] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);

  // Profile fields
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);

  // Stack
  const [stack, setStack] = useState<StackItem[]>([]);
  const [showAddStack, setShowAddStack] = useState(false);
  const [newTool, setNewTool] = useState("");
  const [newToolDesc, setNewToolDesc] = useState("");

  // Prompts
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("");

  // Impact stats
  const [impactStats, setImpactStats] = useState<ImpactStatItem[]>([]);
  const [showAddImpact, setShowAddImpact] = useState(false);
  const [newImpactMetric, setNewImpactMetric] = useState("");
  const [newImpactBefore, setNewImpactBefore] = useState("");
  const [newImpactAfter, setNewImpactAfter] = useState("");
  const [newImpactContext, setNewImpactContext] = useState("");

  // Workflows
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<number | null>(null);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newWorkflowDesc, setNewWorkflowDesc] = useState("");
  const [newWorkflowSteps, setNewWorkflowSteps] = useState<WorkflowStepItem[]>([
    { tool: "", action: "" },
  ]);

  // Resources
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceType, setNewResourceType] = useState("article");

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Melbo Score
  const [melboScore, setMelboScore] = useState<MelboScoreResult | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<"profile" | "stack" | "impact" | "workflows" | "prompts" | "resources">(
    "profile"
  );

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (data.error === "Not authenticated") {
        router.push("/login");
        return;
      }

      setEmail(data.email || "");

      if (data.needsProfile) {
        setNeedsProfile(true);
        setShowOnboarding(true);
      } else if (data.profile) {
        // Show onboarding if not completed
        if (!data.profile.onboarding_completed) {
          setShowOnboarding(true);
        }
        setProfileId(data.profile.id);
        setUsername(data.profile.username);
        setDisplayName(data.profile.display_name || "");
        setHeadline(data.profile.headline || "");
        setBio(data.profile.bio || "");
        setStack(
          (data.stack || []).map((s: StackItem & { id: string }) => ({
            id: s.id,
            tool_name: s.tool_name,
            description: s.description || "",
            is_primary: s.is_primary,
          }))
        );
        setPrompts(
          (data.prompts || []).map(
            (p: PromptItem & { id: string }) => ({
              id: p.id,
              title: p.title,
              prompt_text: p.prompt_text,
              description: p.description || "",
              category: p.category || "",
            })
          )
        );
        setImpactStats(
          (data.impact_stats || []).map(
            (s: ImpactStatItem & { id: string }) => ({
              id: s.id,
              metric: s.metric,
              before_value: s.before_value || "",
              after_value: s.after_value,
              context: s.context || "",
            })
          )
        );
        setWorkflows(
          (data.workflows || []).map(
            (w: WorkflowItem & { id: string; steps: WorkflowStepItem[] }) => ({
              id: w.id,
              title: w.title,
              description: w.description || "",
              steps: w.steps || [],
            })
          )
        );
        setResources(
          (data.resources || []).map(
            (r: ResourceItem & { id: string }) => ({
              id: r.id,
              title: r.title,
              url: r.url,
              resource_type: r.resource_type || "article",
            })
          )
        );
        if (data.melboScore) {
          setMelboScore(data.melboScore);
        }
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveAll() {
    setSaving(true);
    setSaveMsg("");

    try {
      // 1. Save profile
      const profileRes = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          headline,
          bio,
          ...(needsProfile ? { username } : {}),
        }),
      });

      const profileData = await profileRes.json();

      if (profileData.error) {
        setSaveMsg(`Error: ${profileData.error}`);
        setSaving(false);
        return;
      }

      if (profileData.profile) {
        setProfileId(profileData.profile.id);
        setUsername(profileData.profile.username);
        setNeedsProfile(false);
      }

      // 2. Save stack
      const stackRes = await fetch("/api/me/stack", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: stack }),
      });

      const stackData = await stackRes.json();
      if (stackData.error) {
        setSaveMsg(`Stack error: ${stackData.error}`);
        setSaving(false);
        return;
      }

      // 3. Save prompts
      const promptsRes = await fetch("/api/me/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: prompts }),
      });

      const promptsData = await promptsRes.json();
      if (promptsData.error) {
        setSaveMsg(`Prompts error: ${promptsData.error}`);
        setSaving(false);
        return;
      }

      // 4. Save impact stats
      const impactRes = await fetch("/api/me/impact-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: impactStats }),
      });

      const impactData = await impactRes.json();
      if (impactData.error) {
        setSaveMsg(`Impact error: ${impactData.error}`);
        setSaving(false);
        return;
      }

      // 5. Save workflows
      const workflowsRes = await fetch("/api/me/workflows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: workflows.map((w) => ({
            ...w,
            steps: w.steps.map((s, i) => ({ ...s, order: i + 1 })),
          })),
        }),
      });

      const workflowsData = await workflowsRes.json();
      if (workflowsData.error) {
        setSaveMsg(`Workflows error: ${workflowsData.error}`);
        setSaving(false);
        return;
      }

      // 6. Save resources
      const resourcesRes = await fetch("/api/me/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: resources }),
      });

      const resourcesData = await resourcesRes.json();
      if (resourcesData.error) {
        setSaveMsg(`Resources error: ${resourcesData.error}`);
        setSaving(false);
        return;
      }

      // Recalculate Melbo Score after save
      try {
        const scoreRes = await fetch("/api/me/score", { method: "POST" });
        const scoreData = await scoreRes.json();
        if (scoreData.melboScore) {
          setMelboScore(scoreData.melboScore);
        }
      } catch {
        // Score calc failed, not critical
      }

      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 3000);

      // Reload to get fresh IDs
      await loadData();
    } catch {
      setSaveMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
  }

  // Stack helpers
  function addStackItem() {
    if (!newTool.trim()) return;
    setStack((prev) => [
      ...prev,
      {
        tool_name: newTool.trim(),
        description: newToolDesc.trim(),
        is_primary: false,
      },
    ]);
    setNewTool("");
    setNewToolDesc("");
    setShowAddStack(false);
  }

  function removeStackItem(index: number) {
    setStack((prev) => prev.filter((_, i) => i !== index));
  }

  function togglePrimary(index: number) {
    setStack((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, is_primary: !item.is_primary } : item
      )
    );
  }

  function moveStack(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stack.length) return;
    const newStack = [...stack];
    [newStack[index], newStack[newIndex]] = [newStack[newIndex], newStack[index]];
    setStack(newStack);
  }

  // Prompt helpers
  function addPrompt() {
    if (!newPromptTitle.trim() || !newPromptText.trim()) return;
    setPrompts((prev) => [
      ...prev,
      {
        title: newPromptTitle.trim(),
        prompt_text: newPromptText.trim(),
        description: "",
        category: newPromptCategory.trim(),
      },
    ]);
    setNewPromptTitle("");
    setNewPromptText("");
    setNewPromptCategory("");
    setShowAddPrompt(false);
  }

  function removePrompt(index: number) {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
    if (editingPrompt === index) setEditingPrompt(null);
  }

  function updatePrompt(index: number, field: keyof PromptItem, value: string) {
    setPrompts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function movePrompt(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= prompts.length) return;
    const newPrompts = [...prompts];
    [newPrompts[index], newPrompts[newIndex]] = [
      newPrompts[newIndex],
      newPrompts[index],
    ];
    setPrompts(newPrompts);
    if (editingPrompt === index) setEditingPrompt(newIndex);
    else if (editingPrompt === newIndex) setEditingPrompt(index);
  }

  // Impact stat helpers
  function addImpactStat() {
    if (!newImpactMetric.trim() || !newImpactAfter.trim()) return;
    if (impactStats.length >= 6) return;
    setImpactStats((prev) => [
      ...prev,
      {
        metric: newImpactMetric.trim(),
        before_value: newImpactBefore.trim(),
        after_value: newImpactAfter.trim(),
        context: newImpactContext.trim(),
      },
    ]);
    setNewImpactMetric("");
    setNewImpactBefore("");
    setNewImpactAfter("");
    setNewImpactContext("");
    setShowAddImpact(false);
  }

  function removeImpactStat(index: number) {
    setImpactStats((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImpactStat(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= impactStats.length) return;
    const newStats = [...impactStats];
    [newStats[index], newStats[newIndex]] = [newStats[newIndex], newStats[index]];
    setImpactStats(newStats);
  }

  // Workflow helpers
  function addWorkflow() {
    if (!newWorkflowTitle.trim()) return;
    const validSteps = newWorkflowSteps.filter((s) => s.tool.trim() && s.action.trim());
    if (validSteps.length === 0) return;
    setWorkflows((prev) => [
      ...prev,
      {
        title: newWorkflowTitle.trim(),
        description: newWorkflowDesc.trim(),
        steps: validSteps,
      },
    ]);
    setNewWorkflowTitle("");
    setNewWorkflowDesc("");
    setNewWorkflowSteps([{ tool: "", action: "" }]);
    setShowAddWorkflow(false);
  }

  function removeWorkflow(index: number) {
    setWorkflows((prev) => prev.filter((_, i) => i !== index));
    if (editingWorkflow === index) setEditingWorkflow(null);
  }

  function moveWorkflow(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workflows.length) return;
    const newWf = [...workflows];
    [newWf[index], newWf[newIndex]] = [newWf[newIndex], newWf[index]];
    setWorkflows(newWf);
    if (editingWorkflow === index) setEditingWorkflow(newIndex);
    else if (editingWorkflow === newIndex) setEditingWorkflow(index);
  }

  function updateWorkflow(index: number, field: keyof WorkflowItem, value: string | WorkflowStepItem[]) {
    setWorkflows((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addStepToWorkflow(workflowIndex: number) {
    setWorkflows((prev) =>
      prev.map((w, i) =>
        i === workflowIndex
          ? { ...w, steps: [...w.steps, { tool: "", action: "" }] }
          : w
      )
    );
  }

  function removeStepFromWorkflow(workflowIndex: number, stepIndex: number) {
    setWorkflows((prev) =>
      prev.map((w, i) =>
        i === workflowIndex
          ? { ...w, steps: w.steps.filter((_, si) => si !== stepIndex) }
          : w
      )
    );
  }

  function updateWorkflowStep(
    workflowIndex: number,
    stepIndex: number,
    field: "tool" | "action",
    value: string
  ) {
    setWorkflows((prev) =>
      prev.map((w, i) =>
        i === workflowIndex
          ? {
              ...w,
              steps: w.steps.map((s, si) =>
                si === stepIndex ? { ...s, [field]: value } : s
              ),
            }
          : w
      )
    );
  }

  function moveWorkflowStep(workflowIndex: number, stepIndex: number, direction: "up" | "down") {
    const newStepIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;
    setWorkflows((prev) =>
      prev.map((w, i) => {
        if (i !== workflowIndex) return w;
        if (newStepIndex < 0 || newStepIndex >= w.steps.length) return w;
        const newSteps = [...w.steps];
        [newSteps[stepIndex], newSteps[newStepIndex]] = [newSteps[newStepIndex], newSteps[stepIndex]];
        return { ...w, steps: newSteps };
      })
    );
  }

  // Resource helpers
  const RESOURCE_TYPES = ["article", "video", "podcast", "guide", "tool", "book", "newsletter", "course"];

  function addResource() {
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    if (resources.length >= 12) return;
    setResources((prev) => [
      ...prev,
      {
        title: newResourceTitle.trim(),
        url: newResourceUrl.trim(),
        resource_type: newResourceType,
      },
    ]);
    setNewResourceTitle("");
    setNewResourceUrl("");
    setNewResourceType("article");
    setShowAddResource(false);
  }

  function removeResource(index: number) {
    setResources((prev) => prev.filter((_, i) => i !== index));
  }

  function moveResource(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= resources.length) return;
    const newRes = [...resources];
    [newRes[index], newRes[newIndex]] = [newRes[newIndex], newRes[index]];
    setResources(newRes);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-text-muted mt-3">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Onboarding
        email={email}
        profileId={profileId}
        username={username}
        existingDisplayName={displayName}
        existingHeadline={headline}
        existingBio={bio}
        existingStack={stack.map((s) => ({
          tool_name: s.tool_name,
          description: s.description,
          is_primary: s.is_primary,
        }))}
        existingPrompts={prompts.map((p) => ({
          title: p.title,
          prompt_text: p.prompt_text,
          category: p.category,
        }))}
        onComplete={() => {
          setShowOnboarding(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-border sticky top-0 bg-bg/90 backdrop-blur-xl z-50">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </a>
        <div className="flex items-center gap-3">
          {profileId && (
            <a
              href={`/${username}`}
              target="_blank"
              className="font-mono text-[0.72rem] font-medium text-text-muted hover:text-accent transition-colors"
            >
              Preview ↗
            </a>
          )}
          <button
            onClick={handleLogout}
            className="font-mono text-[0.72rem] font-medium text-text-muted hover:text-accent-deep transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-[640px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {needsProfile ? "Set up your Melbo" : "Edit your Melbo"}
            </h1>
            <p className="text-xs text-text-muted mt-1 font-mono">{email}</p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="font-sans text-sm font-semibold py-2.5 px-6 bg-accent text-white rounded-xl cursor-pointer transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {saveMsg && (
          <div
            className={`mb-6 font-mono text-xs font-medium py-2.5 px-4 rounded-lg ${
              saveMsg.startsWith("Error") || saveMsg.includes("error")
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {saveMsg}
          </div>
        )}

        {/* Melbo Score Card */}
        {melboScore && !needsProfile && (
          <div className="mb-6 bg-surface border border-border rounded-xl p-5 animate-[fadeInUp_0.2s_ease]">
            <div className="flex items-start gap-5">
              {/* Score Ring */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative w-[60px] h-[60px]">
                  <svg
                    viewBox="0 0 70 70"
                    width="60"
                    height="60"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle cx="35" cy="35" r="30" fill="none" stroke="var(--color-border)" strokeWidth="5" />
                    <circle
                      cx="35" cy="35" r="30"
                      fill="none" stroke="var(--color-accent)" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 30}
                      strokeDashoffset={2 * Math.PI * 30 * (1 - melboScore.total / 100)}
                      style={{
                        filter: "drop-shadow(0 0 4px rgba(224, 115, 78, 0.3))",
                        transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[17px] font-bold text-text">
                    {melboScore.total}
                  </div>
                </div>
                <span className="font-mono text-[9px] font-semibold uppercase text-accent" style={{ letterSpacing: "0.8px" }}>
                  {melboScore.label}
                </span>
              </div>

              {/* Pillar Breakdown */}
              <div className="flex-1 min-w-0">
                <h3 className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-3">
                  Your Melbo Score
                </h3>
                <div className="space-y-2.5">
                  {[
                    { name: "Profile", ...melboScore.pillars.profile },
                    { name: "Content", ...melboScore.pillars.content },
                    { name: "Stack & Impact", ...melboScore.pillars.stackImpact },
                    { name: "Engagement", ...melboScore.pillars.engagement },
                  ].map((pillar) => (
                    <div key={pillar.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-text-secondary">{pillar.name}</span>
                        <span className="font-mono text-[0.65rem] font-semibold text-text">
                          {pillar.score}/{pillar.max}
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${(pillar.score / pillar.max) * 100}%`,
                            transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Improvement Suggestions */}
                {(() => {
                  const suggestions: { text: string; points: number }[] = [];
                  if (!bio || !bio.trim()) suggestions.push({ text: "Add a bio", points: 4 });
                  else if (bio.trim().length < 50) suggestions.push({ text: "Write a longer bio (50+ chars)", points: 2 });
                  if (prompts.length === 0) suggestions.push({ text: "Add your first prompt", points: 5 });
                  else if (prompts.length === 1) suggestions.push({ text: "Add a second prompt", points: 4 });
                  if (workflows.length === 0) suggestions.push({ text: "Add a workflow", points: 4 });
                  if (impactStats.length === 0) suggestions.push({ text: "Add an impact stat", points: 4 });
                  if (stack.length < 3) suggestions.push({ text: "Add more tools to your stack", points: 3 });
                  if (!displayName || !displayName.trim()) suggestions.push({ text: "Set your display name", points: 3 });
                  if (!headline || !headline.trim()) suggestions.push({ text: "Add a headline", points: 3 });
                  if (stack.length > 0 && !stack.some(s => s.is_primary)) suggestions.push({ text: "Mark a primary tool in your stack", points: 2 });

                  // Sort by points desc, take top 4
                  const top = suggestions.sort((a, b) => b.points - a.points).slice(0, 4);
                  if (top.length === 0) return null;

                  return (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2">
                        How to improve
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {top.map((s, i) => (
                          <span
                            key={i}
                            className="inline-block font-mono text-[0.6rem] py-1 px-2.5 rounded-lg bg-accent-light text-accent border border-accent/15"
                          >
                            {s.text} <span className="font-bold">+{s.points}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Section tabs */}
        <div className="flex gap-1 mb-6 bg-surface border border-border rounded-xl p-1 overflow-x-auto">
          {(["profile", "stack", "impact", "workflows", "prompts", "resources"] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 px-2 rounded-lg font-mono text-[0.65rem] font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "profile"
                ? "Profile"
                : tab === "stack"
                ? `Stack (${stack.length})`
                : tab === "impact"
                ? `Impact (${impactStats.length})`
                : tab === "workflows"
                ? `Workflows (${workflows.length})`
                : tab === "prompts"
                ? `Prompts (${prompts.length})`
                : `Resources (${resources.length})`}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-5 animate-[fadeInUp_0.2s_ease]">
            {needsProfile && (
              <div>
                <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                  Username
                </label>
                <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
                  <span className="font-mono text-sm text-text-muted pl-4 select-none">
                    melbo.ai/
                  </span>
                  <input
                    type="text"
                    className="flex-1 font-mono text-sm font-medium text-text bg-transparent py-3.5 px-1 outline-none"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9._-]/g, "")
                          .substring(0, 30)
                      )
                    }
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                Display Name
              </label>
              <input
                type="text"
                className="w-full text-sm font-medium text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)]"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                Headline
              </label>
              <input
                type="text"
                className="w-full text-sm font-medium text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)]"
                placeholder="e.g. Head of CX · AI-powered support nerd"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div>
              <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                Bio
              </label>
              <textarea
                className="w-full text-sm text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)] resize-none leading-relaxed"
                placeholder="Tell people about your AI journey..."
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STACK TAB */}
        {activeTab === "stack" && (
          <div className="animate-[fadeInUp_0.2s_ease]">
            {stack.length === 0 && !showAddStack ? (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted mb-4">
                  No tools in your stack yet.
                </p>
                <button
                  className="font-sans text-sm font-semibold py-2.5 px-5 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
                  onClick={() => setShowAddStack(true)}
                >
                  + Add your first tool
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {stack.map((item, i) => (
                    <div
                      key={i}
                      className="bg-surface border border-border rounded-xl py-3 px-4 flex items-center gap-3"
                    >
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                          onClick={() => moveStack(i, "up")}
                          disabled={i === 0}
                        >
                          ▲
                        </button>
                        <button
                          className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                          onClick={() => moveStack(i, "down")}
                          disabled={i === stack.length - 1}
                        >
                          ▼
                        </button>
                      </div>

                      {/* Tool info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{getToolIcon(item.tool_name).emoji}</span>
                          <span className="font-mono text-sm font-medium">
                            {item.tool_name}
                          </span>
                          {item.is_primary && (
                            <span className="font-mono text-[0.55rem] bg-accent-light text-accent px-2 py-0.5 rounded-full">
                              primary
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        className={`font-mono text-[0.6rem] px-2 py-1 rounded-lg border transition-all ${
                          item.is_primary
                            ? "border-accent text-accent bg-accent-light"
                            : "border-border text-text-muted hover:border-accent hover:text-accent"
                        }`}
                        onClick={() => togglePrimary(i)}
                        title="Toggle primary"
                      >
                        ★
                      </button>
                      <button
                        className="text-text-muted hover:text-accent-deep text-sm transition-colors"
                        onClick={() => removeStackItem(i)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {!showAddStack && (
                  <button
                    className="w-full py-3 bg-surface border border-dashed border-border rounded-xl font-mono text-[0.75rem] text-text-muted hover:border-accent hover:text-accent transition-all"
                    onClick={() => setShowAddStack(true)}
                  >
                    + Add tool
                  </button>
                )}
              </>
            )}

            {/* Add stack form */}
            {showAddStack && (
              <div className="bg-surface border border-accent/20 rounded-xl p-4 mt-3 animate-[fadeInUp_0.2s_ease]">
                <div className="relative mb-2">
                  <div className="flex items-center bg-bg border border-border rounded-lg overflow-hidden focus-within:border-accent">
                    {newTool.trim() && (
                      <span className="pl-3 text-base leading-none">{getToolIcon(newTool).emoji}</span>
                    )}
                    <input
                      type="text"
                      className="w-full text-sm font-medium text-text bg-transparent py-2.5 px-3 outline-none"
                      placeholder="Tool name (e.g. Claude, Cursor)"
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {/* Tool suggestions */}
                  {newTool.trim().length >= 1 && (
                    (() => {
                      const suggestions = KNOWN_TOOLS.filter(
                        (t) =>
                          t.toLowerCase().includes(newTool.toLowerCase()) &&
                          !stack.some((s) => s.tool_name.toLowerCase() === t.toLowerCase())
                      ).slice(0, 5);
                      return suggestions.length > 0 ? (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                          {suggestions.map((tool) => (
                            <button
                              key={tool}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm font-mono flex items-center gap-2 hover:bg-accent-light transition-colors"
                              onClick={() => setNewTool(tool)}
                            >
                              <span className="text-base leading-none">{getToolIcon(tool).emoji}</span>
                              {tool}
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
                <textarea
                  className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-3 resize-none focus:border-accent"
                  placeholder="How do you use it? (optional)"
                  rows={2}
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="font-sans text-xs font-semibold py-2 px-4 bg-accent text-white rounded-lg transition-all hover:bg-accent-deep disabled:opacity-50"
                    onClick={addStackItem}
                    disabled={!newTool.trim()}
                  >
                    Add
                  </button>
                  <button
                    className="font-sans text-xs py-2 px-4 text-text-muted hover:text-text transition-colors"
                    onClick={() => {
                      setShowAddStack(false);
                      setNewTool("");
                      setNewToolDesc("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMPACT TAB */}
        {activeTab === "impact" && (
          <div className="animate-[fadeInUp_0.2s_ease]">
            {impactStats.length === 0 && !showAddImpact ? (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted mb-4">
                  No impact stats yet. Show the results of your AI usage.
                </p>
                <button
                  className="font-sans text-sm font-semibold py-2.5 px-5 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
                  onClick={() => setShowAddImpact(true)}
                >
                  + Add your first impact stat
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {impactStats.map((stat, i) => (
                    <div
                      key={i}
                      className="bg-surface border border-border rounded-xl py-3 px-4 flex items-center gap-3"
                    >
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                          onClick={() => moveImpactStat(i, "up")}
                          disabled={i === 0}
                        >
                          ▲
                        </button>
                        <button
                          className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                          onClick={() => moveImpactStat(i, "down")}
                          disabled={i === impactStats.length - 1}
                        >
                          ▼
                        </button>
                      </div>

                      {/* Stat info */}
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs font-medium">
                          {stat.metric}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {stat.before_value && (
                            <>
                              <span className="font-mono text-[0.65rem] text-text-muted line-through">
                                {stat.before_value}
                              </span>
                              <span className="text-accent text-[0.65rem] font-bold">→</span>
                            </>
                          )}
                          <span className="font-mono text-[0.65rem] font-semibold text-accent">
                            {stat.after_value}
                          </span>
                        </div>
                        {stat.context && (
                          <p className="text-[0.6rem] text-text-muted mt-0.5 truncate">
                            {stat.context}
                          </p>
                        )}
                      </div>

                      {/* Remove */}
                      <button
                        className="text-text-muted hover:text-accent-deep text-sm transition-colors"
                        onClick={() => removeImpactStat(i)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {!showAddImpact && impactStats.length < 6 && (
                  <button
                    className="w-full py-3 bg-surface border border-dashed border-border rounded-xl font-mono text-[0.75rem] text-text-muted hover:border-accent hover:text-accent transition-all"
                    onClick={() => setShowAddImpact(true)}
                  >
                    + Add impact stat ({6 - impactStats.length} remaining)
                  </button>
                )}
                {impactStats.length >= 6 && (
                  <p className="text-center font-mono text-[0.65rem] text-text-muted mt-2">
                    Maximum 6 impact stats reached
                  </p>
                )}
              </>
            )}

            {/* Add impact stat form */}
            {showAddImpact && (
              <div className="bg-surface border border-accent/20 rounded-xl p-4 mt-3 animate-[fadeInUp_0.2s_ease]">
                <input
                  type="text"
                  className="w-full text-sm font-medium text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-2 focus:border-accent"
                  placeholder="What did you improve?"
                  value={newImpactMetric}
                  onChange={(e) => setNewImpactMetric(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none focus:border-accent"
                    placeholder="Before AI (optional)"
                    value={newImpactBefore}
                    onChange={(e) => setNewImpactBefore(e.target.value)}
                  />
                  <span className="text-accent font-bold flex items-center">→</span>
                  <input
                    type="text"
                    className="flex-1 text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none focus:border-accent"
                    placeholder="After AI"
                    value={newImpactAfter}
                    onChange={(e) => setNewImpactAfter(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-3 focus:border-accent"
                  placeholder="How did you do it? (optional)"
                  value={newImpactContext}
                  onChange={(e) => setNewImpactContext(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="font-sans text-xs font-semibold py-2 px-4 bg-accent text-white rounded-lg transition-all hover:bg-accent-deep disabled:opacity-50"
                    onClick={addImpactStat}
                    disabled={!newImpactMetric.trim() || !newImpactAfter.trim()}
                  >
                    Add
                  </button>
                  <button
                    className="font-sans text-xs py-2 px-4 text-text-muted hover:text-text transition-colors"
                    onClick={() => {
                      setShowAddImpact(false);
                      setNewImpactMetric("");
                      setNewImpactBefore("");
                      setNewImpactAfter("");
                      setNewImpactContext("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORKFLOWS TAB */}
        {activeTab === "workflows" && (
          <div className="animate-[fadeInUp_0.2s_ease]">
            {workflows.length === 0 && !showAddWorkflow ? (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted mb-4">
                  No workflows yet. Show how you chain AI tools together.
                </p>
                <button
                  className="font-sans text-sm font-semibold py-2.5 px-5 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
                  onClick={() => setShowAddWorkflow(true)}
                >
                  + Add your first workflow
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {workflows.map((workflow, i) => (
                    <div
                      key={i}
                      className="bg-surface border border-border rounded-xl overflow-hidden"
                    >
                      {/* Workflow header */}
                      <div className="py-3 px-4 flex items-center gap-3">
                        {/* Reorder */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                            onClick={() => moveWorkflow(i, "up")}
                            disabled={i === 0}
                          >
                            ▲
                          </button>
                          <button
                            className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                            onClick={() => moveWorkflow(i, "down")}
                            disabled={i === workflows.length - 1}
                          >
                            ▼
                          </button>
                        </div>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() =>
                            setEditingWorkflow(editingWorkflow === i ? null : i)
                          }
                        >
                          <span className="font-medium text-sm tracking-tight">
                            {workflow.title || "Untitled workflow"}
                          </span>
                          <span className="font-mono text-[0.6rem] text-text-muted ml-2">
                            {workflow.steps.length} steps
                          </span>
                        </div>

                        <button
                          className="font-mono text-[0.65rem] text-text-muted hover:text-accent transition-colors"
                          onClick={() =>
                            setEditingWorkflow(editingWorkflow === i ? null : i)
                          }
                        >
                          {editingWorkflow === i ? "Close" : "Edit"}
                        </button>
                        <button
                          className="text-text-muted hover:text-accent-deep text-sm transition-colors"
                          onClick={() => removeWorkflow(i)}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Edit form */}
                      {editingWorkflow === i && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 animate-[fadeInUp_0.15s_ease]">
                          <input
                            type="text"
                            className="w-full text-sm font-medium text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none focus:border-accent"
                            placeholder="Workflow title"
                            value={workflow.title}
                            onChange={(e) => updateWorkflow(i, "title", e.target.value)}
                          />
                          <textarea
                            className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none resize-none focus:border-accent"
                            placeholder="Description (optional)"
                            rows={2}
                            value={workflow.description}
                            onChange={(e) => updateWorkflow(i, "description", e.target.value)}
                          />
                          <div className="space-y-2">
                            <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
                              Steps
                            </p>
                            {workflow.steps.map((step, si) => (
                              <div key={si} className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    className="text-text-muted hover:text-accent text-[0.5rem] leading-none disabled:opacity-20"
                                    onClick={() => moveWorkflowStep(i, si, "up")}
                                    disabled={si === 0}
                                  >
                                    ▲
                                  </button>
                                  <button
                                    className="text-text-muted hover:text-accent text-[0.5rem] leading-none disabled:opacity-20"
                                    onClick={() => moveWorkflowStep(i, si, "down")}
                                    disabled={si === workflow.steps.length - 1}
                                  >
                                    ▼
                                  </button>
                                </div>
                                <span className="font-mono text-[0.6rem] text-text-muted w-4 text-center shrink-0">
                                  {si + 1}
                                </span>
                                <input
                                  type="text"
                                  className="w-28 shrink-0 font-mono text-xs text-text bg-bg border border-border rounded-lg py-2 px-2 outline-none focus:border-accent"
                                  placeholder="Tool"
                                  value={step.tool}
                                  onChange={(e) => updateWorkflowStep(i, si, "tool", e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="flex-1 text-xs text-text bg-bg border border-border rounded-lg py-2 px-2 outline-none focus:border-accent"
                                  placeholder="What this step does"
                                  value={step.action}
                                  onChange={(e) => updateWorkflowStep(i, si, "action", e.target.value)}
                                />
                                <button
                                  className="text-text-muted hover:text-accent-deep text-xs transition-colors shrink-0"
                                  onClick={() => removeStepFromWorkflow(i, si)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              className="font-mono text-[0.65rem] text-accent hover:text-accent-deep transition-colors"
                              onClick={() => addStepToWorkflow(i)}
                            >
                              + Add step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!showAddWorkflow && (
                  <button
                    className="w-full py-3 bg-surface border border-dashed border-border rounded-xl font-mono text-[0.75rem] text-text-muted hover:border-accent hover:text-accent transition-all"
                    onClick={() => setShowAddWorkflow(true)}
                  >
                    + Add workflow
                  </button>
                )}
              </>
            )}

            {/* Add workflow form */}
            {showAddWorkflow && (
              <div className="bg-surface border border-accent/20 rounded-xl p-4 mt-3 animate-[fadeInUp_0.2s_ease]">
                <input
                  type="text"
                  className="w-full text-sm font-medium text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-2 focus:border-accent"
                  placeholder="Workflow title"
                  value={newWorkflowTitle}
                  onChange={(e) => setNewWorkflowTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-3 resize-none focus:border-accent"
                  placeholder="Description (optional)"
                  rows={2}
                  value={newWorkflowDesc}
                  onChange={(e) => setNewWorkflowDesc(e.target.value)}
                />
                <div className="space-y-2 mb-3">
                  <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
                    Steps
                  </p>
                  {newWorkflowSteps.map((step, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <span className="font-mono text-[0.6rem] text-text-muted w-4 text-center shrink-0">
                        {si + 1}
                      </span>
                      <input
                        type="text"
                        className="w-28 shrink-0 font-mono text-xs text-text bg-bg border border-border rounded-lg py-2 px-2 outline-none focus:border-accent"
                        placeholder="Tool"
                        value={step.tool}
                        onChange={(e) => {
                          const updated = [...newWorkflowSteps];
                          updated[si] = { ...updated[si], tool: e.target.value };
                          setNewWorkflowSteps(updated);
                        }}
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs text-text bg-bg border border-border rounded-lg py-2 px-2 outline-none focus:border-accent"
                        placeholder="What this step does"
                        value={step.action}
                        onChange={(e) => {
                          const updated = [...newWorkflowSteps];
                          updated[si] = { ...updated[si], action: e.target.value };
                          setNewWorkflowSteps(updated);
                        }}
                      />
                      {newWorkflowSteps.length > 1 && (
                        <button
                          className="text-text-muted hover:text-accent-deep text-xs transition-colors shrink-0"
                          onClick={() =>
                            setNewWorkflowSteps((prev) => prev.filter((_, i) => i !== si))
                          }
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className="font-mono text-[0.65rem] text-accent hover:text-accent-deep transition-colors"
                    onClick={() =>
                      setNewWorkflowSteps((prev) => [...prev, { tool: "", action: "" }])
                    }
                  >
                    + Add step
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="font-sans text-xs font-semibold py-2 px-4 bg-accent text-white rounded-lg transition-all hover:bg-accent-deep disabled:opacity-50"
                    onClick={addWorkflow}
                    disabled={
                      !newWorkflowTitle.trim() ||
                      !newWorkflowSteps.some((s) => s.tool.trim() && s.action.trim())
                    }
                  >
                    Add workflow
                  </button>
                  <button
                    className="font-sans text-xs py-2 px-4 text-text-muted hover:text-text transition-colors"
                    onClick={() => {
                      setShowAddWorkflow(false);
                      setNewWorkflowTitle("");
                      setNewWorkflowDesc("");
                      setNewWorkflowSteps([{ tool: "", action: "" }]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROMPTS TAB */}
        {activeTab === "prompts" && (
          <div className="animate-[fadeInUp_0.2s_ease]">
            {prompts.length === 0 && !showAddPrompt ? (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted mb-4">
                  No prompts yet. Add the ones you&apos;re proud of.
                </p>
                <button
                  className="font-sans text-sm font-semibold py-2.5 px-5 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
                  onClick={() => setShowAddPrompt(true)}
                >
                  + Add your first prompt
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {prompts.map((prompt, i) => (
                    <div
                      key={i}
                      className="bg-surface border border-border rounded-xl overflow-hidden"
                    >
                      {/* Prompt header */}
                      <div className="py-3 px-4 flex items-center gap-3">
                        {/* Reorder */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                            onClick={() => movePrompt(i, "up")}
                            disabled={i === 0}
                          >
                            ▲
                          </button>
                          <button
                            className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                            onClick={() => movePrompt(i, "down")}
                            disabled={i === prompts.length - 1}
                          >
                            ▼
                          </button>
                        </div>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() =>
                            setEditingPrompt(editingPrompt === i ? null : i)
                          }
                        >
                          <span className="font-medium text-sm tracking-tight">
                            {prompt.title || "Untitled prompt"}
                          </span>
                          {prompt.category && (
                            <span className="font-mono text-[0.6rem] text-text-muted ml-2">
                              {prompt.category}
                            </span>
                          )}
                        </div>

                        <button
                          className="font-mono text-[0.65rem] text-text-muted hover:text-accent transition-colors"
                          onClick={() =>
                            setEditingPrompt(editingPrompt === i ? null : i)
                          }
                        >
                          {editingPrompt === i ? "Close" : "Edit"}
                        </button>
                        <button
                          className="text-text-muted hover:text-accent-deep text-sm transition-colors"
                          onClick={() => removePrompt(i)}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Edit form */}
                      {editingPrompt === i && (
                        <div className="px-4 pb-4 space-y-2 border-t border-border pt-3 animate-[fadeInUp_0.15s_ease]">
                          <input
                            type="text"
                            className="w-full text-sm font-medium text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none focus:border-accent"
                            placeholder="Prompt title"
                            value={prompt.title}
                            onChange={(e) =>
                              updatePrompt(i, "title", e.target.value)
                            }
                          />
                          <textarea
                            className="w-full font-mono text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none resize-none focus:border-accent leading-relaxed"
                            placeholder="The full prompt text..."
                            rows={6}
                            value={prompt.prompt_text}
                            onChange={(e) =>
                              updatePrompt(i, "prompt_text", e.target.value)
                            }
                          />
                          <input
                            type="text"
                            className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none focus:border-accent"
                            placeholder="Category (optional, e.g. Writing, Strategy)"
                            value={prompt.category}
                            onChange={(e) =>
                              updatePrompt(i, "category", e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!showAddPrompt && (
                  <button
                    className="w-full py-3 bg-surface border border-dashed border-border rounded-xl font-mono text-[0.75rem] text-text-muted hover:border-accent hover:text-accent transition-all"
                    onClick={() => setShowAddPrompt(true)}
                  >
                    + Add prompt
                  </button>
                )}
              </>
            )}

            {/* Add prompt form */}
            {showAddPrompt && (
              <div className="bg-surface border border-accent/20 rounded-xl p-4 mt-3 animate-[fadeInUp_0.2s_ease]">
                <input
                  type="text"
                  className="w-full text-sm font-medium text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-2 focus:border-accent"
                  placeholder="Prompt title"
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  className="w-full font-mono text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-2 resize-none focus:border-accent leading-relaxed"
                  placeholder="The full prompt text..."
                  rows={5}
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-3 focus:border-accent"
                  placeholder="Category (optional)"
                  value={newPromptCategory}
                  onChange={(e) => setNewPromptCategory(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="font-sans text-xs font-semibold py-2 px-4 bg-accent text-white rounded-lg transition-all hover:bg-accent-deep disabled:opacity-50"
                    onClick={addPrompt}
                    disabled={!newPromptTitle.trim() || !newPromptText.trim()}
                  >
                    Add prompt
                  </button>
                  <button
                    className="font-sans text-xs py-2 px-4 text-text-muted hover:text-text transition-colors"
                    onClick={() => {
                      setShowAddPrompt(false);
                      setNewPromptTitle("");
                      setNewPromptText("");
                      setNewPromptCategory("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === "resources" && (
          <div className="animate-[fadeInUp_0.2s_ease]">
            {resources.length === 0 && !showAddResource ? (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted mb-4">
                  No resources yet. Share links to your best content.
                </p>
                <button
                  className="font-sans text-sm font-semibold py-2.5 px-5 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
                  onClick={() => setShowAddResource(true)}
                >
                  + Add your first resource
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {resources.map((resource, i) => (
                    <div
                      key={i}
                      className="bg-surface border border-border rounded-xl py-3 px-4 flex items-center gap-3"
                    >
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                          onClick={() => moveResource(i, "up")}
                          disabled={i === 0}
                        >
                          ▲
                        </button>
                        <button
                          className="text-text-muted hover:text-accent text-[0.6rem] leading-none disabled:opacity-20"
                          onClick={() => moveResource(i, "down")}
                          disabled={i === resources.length - 1}
                        >
                          ▼
                        </button>
                      </div>

                      {/* Resource info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-[0.55rem] font-semibold uppercase px-2 py-0.5 rounded"
                            style={{
                              letterSpacing: "0.5px",
                              background:
                                resource.resource_type === "video" ? "#fef2f2" :
                                resource.resource_type === "podcast" ? "#faf5ff" :
                                resource.resource_type === "article" || resource.resource_type === "guide" ? "#f0fdf4" :
                                resource.resource_type === "tool" || resource.resource_type === "course" ? "#eff6ff" :
                                resource.resource_type === "book" ? "#fefce8" :
                                resource.resource_type === "newsletter" ? "#fdf0eb" : "#f5f0eb",
                              color:
                                resource.resource_type === "video" ? "#dc2626" :
                                resource.resource_type === "podcast" ? "#9333ea" :
                                resource.resource_type === "article" || resource.resource_type === "guide" ? "#16a34a" :
                                resource.resource_type === "tool" || resource.resource_type === "course" ? "#2563eb" :
                                resource.resource_type === "book" ? "#ca8a04" :
                                resource.resource_type === "newsletter" ? "#e0734e" : "#5c524a",
                            }}
                          >
                            {resource.resource_type}
                          </span>
                          <span className="font-mono text-sm font-medium truncate">
                            {resource.title}
                          </span>
                        </div>
                        <p className="text-[0.6rem] text-text-muted mt-0.5 truncate">
                          {resource.url}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        className="text-text-muted hover:text-accent-deep text-sm transition-colors"
                        onClick={() => removeResource(i)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {!showAddResource && resources.length < 12 && (
                  <button
                    className="w-full py-3 bg-surface border border-dashed border-border rounded-xl font-mono text-[0.75rem] text-text-muted hover:border-accent hover:text-accent transition-all"
                    onClick={() => setShowAddResource(true)}
                  >
                    + Add resource ({12 - resources.length} remaining)
                  </button>
                )}
                {resources.length >= 12 && (
                  <p className="text-center font-mono text-[0.65rem] text-text-muted mt-2">
                    Maximum 12 resources reached
                  </p>
                )}
              </>
            )}

            {/* Add resource form */}
            {showAddResource && (
              <div className="bg-surface border border-accent/20 rounded-xl p-4 mt-3 animate-[fadeInUp_0.2s_ease]">
                <input
                  type="text"
                  className="w-full text-sm font-medium text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-2 focus:border-accent"
                  placeholder="Resource title"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  autoFocus
                />
                <input
                  type="url"
                  className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2.5 px-3 outline-none mb-2 focus:border-accent"
                  placeholder="https://..."
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                />
                <div className="mb-3">
                  <label className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-1.5 block">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {RESOURCE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`font-mono text-[0.6rem] py-1 px-2.5 rounded-lg border transition-all capitalize ${
                          newResourceType === type
                            ? "border-accent text-accent bg-accent-light"
                            : "border-border text-text-muted hover:border-accent hover:text-accent"
                        }`}
                        onClick={() => setNewResourceType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="font-sans text-xs font-semibold py-2 px-4 bg-accent text-white rounded-lg transition-all hover:bg-accent-deep disabled:opacity-50"
                    onClick={addResource}
                    disabled={!newResourceTitle.trim() || !newResourceUrl.trim()}
                  >
                    Add
                  </button>
                  <button
                    className="font-sans text-xs py-2 px-4 text-text-muted hover:text-text transition-colors"
                    onClick={() => {
                      setShowAddResource(false);
                      setNewResourceTitle("");
                      setNewResourceUrl("");
                      setNewResourceType("article");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom save bar */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
          {profileId && (
            <a
              href={`/${username}`}
              target="_blank"
              className="font-mono text-[0.75rem] font-medium text-text-muted hover:text-accent transition-colors"
            >
              Preview your Melbo ↗
            </a>
          )}
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="font-sans text-sm font-semibold py-2.5 px-6 bg-accent text-white rounded-xl cursor-pointer transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-60 ml-auto"
          >
            {saving ? "Saving..." : "Save all changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
