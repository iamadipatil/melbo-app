"use client";

import { useState } from "react";
import type { Profile, StackItem, Prompt, ImpactStat, Workflow, Resource } from "@/lib/types";
import type { MelboScoreResult } from "@/lib/calculateMelboScore";

interface Props {
  profile: Profile;
  stack: StackItem[];
  prompts: Prompt[];
  impactStats: ImpactStat[];
  workflows: Workflow[];
  resources: Resource[];
  melboScore: MelboScoreResult;
  isOwnProfile?: boolean;
}

const RESOURCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  video: { bg: "#fef2f2", text: "#dc2626" },
  podcast: { bg: "#faf5ff", text: "#9333ea" },
  article: { bg: "#f0fdf4", text: "#16a34a" },
  guide: { bg: "#f0fdf4", text: "#16a34a" },
  tool: { bg: "#eff6ff", text: "#2563eb" },
  book: { bg: "#fefce8", text: "#ca8a04" },
  newsletter: { bg: "#fdf0eb", text: "#e0734e" },
  course: { bg: "#eff6ff", text: "#2563eb" },
};

function getResourceSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname;
  } catch {
    return "";
  }
}

export default function ProfileClient({
  profile,
  stack,
  prompts,
  impactStats,
  workflows,
  resources,
  melboScore,
  isOwnProfile = false,
}: Props) {
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({
    ...Object.fromEntries(prompts.map((p) => [p.id, p.save_count])),
    ...Object.fromEntries(workflows.map((w) => [w.id, w.save_count])),
  });
  const [savedPrompts, setSavedPrompts] = useState<Set<string>>(new Set());
  const [savedWorkflows, setSavedWorkflows] = useState<Set<string>>(new Set());
  const [savingPrompt, setSavingPrompt] = useState<string | null>(null);
  const [savingWorkflow, setSavingWorkflow] = useState<string | null>(null);

  const initial = (profile.display_name || profile.username || "?")
    .charAt(0)
    .toUpperCase();

  // Score ring math
  const circumference = 2 * Math.PI * 30;
  const dashoffset = circumference * (1 - melboScore.total / 100);

  async function handleSave(promptId: string) {
    if (savedPrompts.has(promptId) || savingPrompt === promptId) return;
    setSavingPrompt(promptId);
    try {
      const res = await fetch(`/api/prompts/${promptId}/save`, { method: "POST" });
      const data = await res.json();
      if (data.saved) {
        setSavedPrompts((prev) => new Set([...prev, promptId]));
        if (data.save_count !== undefined) {
          setSaveCounts((prev) => ({ ...prev, [promptId]: data.save_count }));
        }
      }
    } catch {
      // Silently fail
    } finally {
      setSavingPrompt(null);
    }
  }

  async function handleSaveWorkflow(workflowId: string) {
    if (savedWorkflows.has(workflowId) || savingWorkflow === workflowId) return;
    setSavingWorkflow(workflowId);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/save`, { method: "POST" });
      const data = await res.json();
      if (data.saved) {
        setSavedWorkflows((prev) => new Set([...prev, workflowId]));
        if (data.save_count !== undefined) {
          setSaveCounts((prev) => ({ ...prev, [workflowId]: data.save_count }));
        }
      }
    } catch {
      // Silently fail
    } finally {
      setSavingWorkflow(null);
    }
  }

  function formatSaveCount(count: number): string {
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return count.toString();
  }

  function toggleCard(type: "prompt" | "workflow", id: string) {
    if (type === "prompt") {
      setExpandedPrompt(expandedPrompt === id ? null : id);
    } else {
      setExpandedWorkflow(expandedWorkflow === id ? null : id);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#f6f3ef" }}>
      {/* Top nav */}
      <nav className="px-6 py-4 flex justify-between items-center border-b" style={{ borderColor: "#e8e2db" }}>
        <a href="/" className="text-lg font-bold tracking-tight" style={{ color: "#1c1410" }}>
          melbo<span style={{ color: "#e0734e" }}>.</span>
        </a>
        <div className="flex items-center gap-4">
          {isOwnProfile && (
            <a
              href="/edit"
              className="font-mono text-[0.75rem] font-medium transition-colors hover:opacity-80"
              style={{ color: "#9a8f86" }}
            >
              Edit profile
            </a>
          )}
          <a
            href="/saved"
            className="font-mono text-[0.75rem] font-medium transition-colors hover:opacity-80"
            style={{ color: "#9a8f86" }}
          >
            My saves
          </a>
        </div>
      </nav>

      {/* Profile Page Container */}
      <div className="max-w-[760px] mx-auto pt-6 px-4 sm:px-0">
        {/* ===== HERO ===== */}
        <div
          className="relative"
          style={{
            background: "#1c1410",
            borderRadius: "16px 16px 0 0",
            padding: "32px 32px 28px",
          }}
        >
          {/* Subtle gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 80% 10%, rgba(224, 115, 78, 0.05) 0%, transparent 55%)",
              borderRadius: "16px 16px 0 0",
            }}
          />

          <div
            className="relative flex flex-col sm:flex-row justify-between items-center sm:items-start gap-5"
            style={{ animation: "fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
          >
            {/* Left: Avatar + Name */}
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start flex-1 min-w-0 text-center sm:text-left">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="w-16 h-16 object-cover shrink-0"
                  style={{ borderRadius: "14px" }}
                />
              ) : (
                <div
                  className="w-16 h-16 flex items-center justify-center text-[26px] font-semibold text-white shrink-0"
                  style={{
                    borderRadius: "14px",
                    background: "#e0734e",
                    boxShadow: "0 4px 14px rgba(224, 115, 78, 0.3)",
                  }}
                >
                  {initial}
                </div>
              )}
              <div>
                <h1
                  className="text-[21px] font-bold leading-tight mb-1"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  {profile.display_name || profile.username}
                </h1>
                {profile.headline && (
                  <div
                    className="text-[13px] leading-[1.55] max-w-[400px]"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {profile.headline}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Score Badge */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative w-[70px] h-[70px]">
                <svg
                  viewBox="0 0 70 70"
                  width="70"
                  height="70"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="35" cy="35" r="30"
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5"
                  />
                  <circle
                    cx="35" cy="35" r="30"
                    fill="none" stroke="#e0734e" strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(224, 115, 78, 0.35))",
                      transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[20px] font-bold text-white">
                  {melboScore.total}
                </div>
              </div>
              <div
                className="text-[10px] font-semibold uppercase"
                style={{ letterSpacing: "1px", color: "#e0734e" }}
              >
                {melboScore.label}
              </div>
            </div>
          </div>
        </div>

        {/* ===== BENTO GRID ===== */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden"
          style={{
            gap: "1px",
            background: "#e8e2db",
            border: "1px solid #e8e2db",
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
          }}
        >
          {/* About Card */}
          {profile.bio && (
            <div
              className={stack.length === 0 ? "col-span-1 sm:col-span-2" : ""}
              style={{
                background: "#ffffff",
                padding: "24px 28px",
                animation: "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both",
              }}
            >
              <div
                className="font-mono text-[10px] font-medium uppercase mb-3.5"
                style={{ letterSpacing: "1.6px", color: "#9a8f86" }}
              >
                About
              </div>
              <div className="text-[14px] leading-[1.78] flex flex-col gap-3" style={{ color: "#5c524a" }}>
                {profile.bio.split(/\n\s*\n/).map((paragraph, i) => (
                  <p key={i} className="m-0">
                    {paragraph.split(/\n/).map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* AI Stack Card */}
          {stack.length > 0 && (
            <div
              className={!profile.bio ? "col-span-1 sm:col-span-2" : ""}
              style={{
                background: "#ffffff",
                padding: "24px 28px",
                animation: "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
              }}
            >
              <div
                className="font-mono text-[10px] font-medium uppercase mb-3.5"
                style={{ letterSpacing: "1.6px", color: "#9a8f86" }}
              >
                AI Stack
              </div>
              <div className="flex flex-col">
                {stack.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-[9px]"
                    style={{
                      borderBottom: i < stack.length - 1 ? "1px solid #f0ebe5" : "none",
                      paddingTop: i === 0 ? "0" : undefined,
                    }}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full shrink-0"
                      style={{
                        background: item.is_primary ? "#e0734e" : "#c8bfb6",
                        boxShadow: item.is_primary ? "0 0 0 3px #fdf0eb" : "none",
                      }}
                    />
                    <span className="text-[13.5px] font-semibold" style={{ color: "#1c1410", whiteSpace: "nowrap" }}>
                      {item.tool_name}
                    </span>
                    {item.description && (
                      <span
                        className="text-[11.5px] ml-auto text-right"
                        style={{
                          color: "#9a8f86",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "180px",
                        }}
                      >
                        {(() => {
                          const desc = item.description.trim();
                          // Split on first period or comma, take the first chunk
                          const firstChunk = desc.split(/[.,]/)?.at(0)?.trim() || desc;
                          return firstChunk.length > 35 ? firstChunk.slice(0, 35) + "…" : firstChunk;
                        })()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Card — full width */}
          {impactStats.length > 0 && (
            <div
              className="col-span-1 sm:col-span-2"
              style={{
                background: "#ffffff",
                padding: "24px 28px",
                animation: "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both",
              }}
            >
              <div
                className="font-mono text-[10px] font-medium uppercase mb-3.5"
                style={{ letterSpacing: "1.6px", color: "#9a8f86" }}
              >
                Impact
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "16px 36px" }}>
                {impactStats.map((stat) => (
                  <div key={stat.id}>
                    <div
                      className="text-[10.5px] font-medium uppercase mb-2 leading-[1.4]"
                      style={{ letterSpacing: "0.4px", color: "#9a8f86" }}
                    >
                      {stat.metric}
                    </div>
                    <div className="flex items-baseline gap-2 mb-1.5">
                      {stat.before_value && (
                        <>
                          <span
                            className="font-mono text-[17px] font-medium line-through"
                            style={{ color: "#9a8f86", textDecorationColor: "rgba(154, 143, 134, 0.35)" }}
                          >
                            {stat.before_value}
                          </span>
                          <span className="text-[13px]" style={{ color: "#9a8f86" }}>→</span>
                        </>
                      )}
                      <span className="font-mono text-[22px] font-bold" style={{ color: "#e0734e" }}>
                        {stat.after_value}
                      </span>
                    </div>
                    {stat.context && (
                      <div className="text-[12px] leading-[1.5]" style={{ color: "#9a8f86" }}>
                        {stat.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflows Card — full width */}
          {workflows.length > 0 && (
            <div
              className="col-span-1 sm:col-span-2"
              style={{
                background: "#ffffff",
                padding: "24px 28px",
                animation: "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both",
              }}
            >
              <div className="flex justify-between items-center mb-3.5">
                <div
                  className="font-mono text-[10px] font-medium uppercase"
                  style={{ letterSpacing: "1.6px", color: "#9a8f86" }}
                >
                  Workflows
                </div>
                <span className="font-mono text-[10px]" style={{ color: "#9a8f86" }}>
                  {workflows.length} total
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="rounded-[10px] overflow-hidden cursor-pointer transition-colors"
                    style={{ background: "#f5f0eb" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf0eb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = expandedWorkflow === workflow.id ? "#fdf0eb" : "#f5f0eb")}
                  >
                    <div
                      className="py-3.5 px-[18px] flex items-start justify-between gap-3"
                      onClick={() => toggleCard("workflow", workflow.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14.5px] font-semibold leading-[1.3] mb-0.5" style={{ color: "#1c1410" }}>
                          {workflow.title}
                        </h3>
                        {workflow.description && (
                          <div className="text-[12.5px] leading-[1.45]" style={{ color: "#9a8f86" }}>
                            {workflow.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: "#9a8f86" }}>
                          {workflow.steps.length} steps
                        </span>
                        <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: "#9a8f86" }}>
                          {formatSaveCount(saveCounts[workflow.id] || 0)} saves
                        </span>
                        <span
                          className="text-[16px] leading-none"
                          style={{
                            color: "#9a8f86",
                            transform: expandedWorkflow === workflow.id ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                            display: "inline-block",
                          }}
                        >
                          ›
                        </span>
                      </div>
                    </div>
                    {expandedWorkflow === workflow.id && (
                      <div className="px-[18px] pb-4">
                        <div className="pt-3" style={{ borderTop: "1px solid #f0ebe5" }}>
                          <div className="flex flex-wrap gap-[5px] items-center">
                            {workflow.steps.map((step, si) => (
                              <div key={si} className="flex items-center gap-[5px]">
                                <div
                                  className="flex items-center gap-[5px] py-[5px] px-[11px] rounded-[7px] text-[11.5px] font-medium"
                                  style={{ background: "#ffffff", border: "1px solid #e8e2db", color: "#5c524a" }}
                                >
                                  <span className="font-mono text-[9px] font-bold" style={{ color: "#e0734e" }}>
                                    {si + 1}
                                  </span>
                                  {step.action}
                                </div>
                                {si < workflow.steps.length - 1 && (
                                  <span className="text-[10px]" style={{ color: "#9a8f86" }}>→</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            className="inline-flex items-center gap-[5px] mt-2.5 py-[5px] px-3 rounded-[7px] text-[11.5px] font-medium"
                            style={{
                              background: savedWorkflows.has(workflow.id) ? "#fdf0eb" : "#ffffff",
                              border: `1px solid ${savedWorkflows.has(workflow.id) ? "#e0734e" : "#e8e2db"}`,
                              color: savedWorkflows.has(workflow.id) ? "#e0734e" : "#5c524a",
                              fontFamily: "var(--font-sans)",
                              cursor: savedWorkflows.has(workflow.id) ? "default" : "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!savedWorkflows.has(workflow.id)) { e.currentTarget.style.borderColor = "#e0734e"; e.currentTarget.style.color = "#e0734e"; e.currentTarget.style.background = "#fdf0eb"; }}}
                            onMouseLeave={(e) => { if (!savedWorkflows.has(workflow.id)) { e.currentTarget.style.borderColor = "#e8e2db"; e.currentTarget.style.color = "#5c524a"; e.currentTarget.style.background = "#ffffff"; }}}
                            onClick={(e) => { e.stopPropagation(); handleSaveWorkflow(workflow.id); }}
                            disabled={savedWorkflows.has(workflow.id) || savingWorkflow === workflow.id}
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v10h10V6l-3-3H3z"/><path d="M5 3v3h4V3"/><path d="M5 9h6v4H5z"/></svg>
                            {savingWorkflow === workflow.id ? "Saving..." : savedWorkflows.has(workflow.id) ? "Saved ✓" : "Save workflow"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompts Card — full width */}
          {prompts.length > 0 && (
            <div
              className="col-span-1 sm:col-span-2"
              style={{
                background: "#ffffff",
                padding: "24px 28px",
                animation: "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both",
              }}
            >
              <div className="flex justify-between items-center mb-3.5">
                <div
                  className="font-mono text-[10px] font-medium uppercase"
                  style={{ letterSpacing: "1.6px", color: "#9a8f86" }}
                >
                  Prompts
                </div>
                <span className="font-mono text-[10px]" style={{ color: "#9a8f86" }}>
                  {prompts.length} total
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="rounded-[10px] overflow-hidden cursor-pointer transition-colors"
                    style={{ background: "#f5f0eb" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf0eb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = expandedPrompt === prompt.id ? "#fdf0eb" : "#f5f0eb")}
                  >
                    <div
                      className="py-3.5 px-[18px] flex items-start justify-between gap-3"
                      onClick={() => toggleCard("prompt", prompt.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14.5px] font-semibold leading-[1.3] mb-0.5" style={{ color: "#1c1410" }}>
                          {prompt.title}
                        </h3>
                        {prompt.category && (
                          <span
                            className="text-[11px] font-medium inline-block py-[2px] px-[9px] rounded-[5px]"
                            style={{ background: "#ffffff", border: "1px solid #e8e2db", color: "#5c524a" }}
                          >
                            {prompt.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-[10px] whitespace-nowrap" style={{ color: "#9a8f86" }}>
                          {formatSaveCount(saveCounts[prompt.id] || 0)} saves
                        </span>
                        <span
                          className="text-[16px] leading-none"
                          style={{
                            color: "#9a8f86",
                            transform: expandedPrompt === prompt.id ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                            display: "inline-block",
                          }}
                        >
                          ›
                        </span>
                      </div>
                    </div>
                    {expandedPrompt === prompt.id && (
                      <div className="px-[18px] pb-4">
                        <div className="pt-3" style={{ borderTop: "1px solid #f0ebe5" }}>
                          <div
                            className="font-mono text-[11.5px] leading-[1.7] whitespace-pre-wrap rounded-lg"
                            style={{ background: "#ffffff", border: "1px solid #e8e2db", color: "#5c524a", padding: "14px 16px" }}
                          >
                            {prompt.prompt_text}
                          </div>
                          <button
                            className="inline-flex items-center gap-[5px] mt-2.5 py-[5px] px-3 rounded-[7px] text-[11.5px] font-medium"
                            style={{
                              background: savedPrompts.has(prompt.id) ? "#fdf0eb" : "#ffffff",
                              border: `1px solid ${savedPrompts.has(prompt.id) ? "#e0734e" : "#e8e2db"}`,
                              color: savedPrompts.has(prompt.id) ? "#e0734e" : "#5c524a",
                              fontFamily: "var(--font-sans)",
                              cursor: savedPrompts.has(prompt.id) ? "default" : "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!savedPrompts.has(prompt.id)) { e.currentTarget.style.borderColor = "#e0734e"; e.currentTarget.style.color = "#e0734e"; e.currentTarget.style.background = "#fdf0eb"; }}}
                            onMouseLeave={(e) => { if (!savedPrompts.has(prompt.id)) { e.currentTarget.style.borderColor = "#e8e2db"; e.currentTarget.style.color = "#5c524a"; e.currentTarget.style.background = "#ffffff"; }}}
                            onClick={(e) => { e.stopPropagation(); handleSave(prompt.id); }}
                            disabled={savedPrompts.has(prompt.id) || savingPrompt === prompt.id}
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v10h10V6l-3-3H3z"/><path d="M5 3v3h4V3"/><path d="M5 9h6v4H5z"/></svg>
                            {savingPrompt === prompt.id ? "Saving..." : savedPrompts.has(prompt.id) ? "Saved ✓" : "Save prompt"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources Card — full width */}
          {resources.length > 0 && (
            <div
              className="col-span-1 sm:col-span-2"
              style={{
                background: "#ffffff",
                padding: "24px 28px",
                animation: "fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.26s both",
              }}
            >
              <div className="flex justify-between items-center mb-3.5">
                <div
                  className="font-mono text-[10px] font-medium uppercase"
                  style={{ letterSpacing: "1.6px", color: "#9a8f86" }}
                >
                  Resources
                </div>
                <span className="font-mono text-[10px]" style={{ color: "#9a8f86" }}>
                  {resources.length} total
                </span>
              </div>
              <div className="flex flex-col">
                {resources.map((resource, i) => {
                  const typeColors = RESOURCE_TYPE_COLORS[resource.resource_type.toLowerCase()] || { bg: "#f5f0eb", text: "#5c524a" };
                  const source = getResourceSource(resource.url);
                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center no-underline transition-opacity"
                      style={{
                        gap: "12px",
                        padding: "11px 0",
                        borderBottom: i < resources.length - 1 ? "1px solid #f0ebe5" : "none",
                        opacity: 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <span
                        className="font-mono text-[9px] font-semibold uppercase shrink-0"
                        style={{
                          letterSpacing: "0.5px",
                          padding: "3px 8px",
                          borderRadius: "5px",
                          background: typeColors.bg,
                          color: typeColors.text,
                        }}
                      >
                        {resource.resource_type}
                      </span>
                      <span
                        className="text-[13.5px] font-medium flex-1 min-w-0"
                        style={{
                          color: "#1c1410",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {resource.title}
                      </span>
                      {source && (
                        <span
                          className="text-[11px] shrink-0 hidden sm:inline"
                          style={{ color: "#9a8f86" }}
                        >
                          {source}
                        </span>
                      )}
                      <span
                        className="text-[14px] shrink-0"
                        style={{ color: "#9a8f86" }}
                      >
                        ↗
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center" style={{ padding: "36px 0 52px" }}>
          <p className="text-[13px] mb-2.5" style={{ color: "#9a8f86" }}>
            Want your own AI profile?
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white no-underline hover:opacity-90"
            style={{
              padding: "10px 22px",
              background: "#e0734e",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(224, 115, 78, 0.2)",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            Create your Melbo →
          </a>
        </div>
      </div>
    </div>
  );
}
