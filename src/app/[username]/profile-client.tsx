"use client";

import { useState } from "react";
import type { Profile, StackItem, Prompt, ImpactStat, Workflow } from "@/lib/types";
import { getToolIcon } from "@/lib/tool-icons";

const PROMPTS_PER_PAGE = 5;

interface Props {
  profile: Profile;
  stack: StackItem[];
  prompts: Prompt[];
  impactStats: ImpactStat[];
  workflows: Workflow[];
}

export default function ProfileClient({ profile, stack, prompts, impactStats, workflows }: Props) {
  const [activeStack, setActiveStack] = useState<string | null>(null);
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
  const [visibleCount, setVisibleCount] = useState(PROMPTS_PER_PAGE);

  const initial = (profile.display_name || profile.username || "?")
    .charAt(0)
    .toUpperCase();

  const visiblePrompts = prompts.slice(0, visibleCount);
  const hasMore = prompts.length > visibleCount;
  const remaining = prompts.length - visibleCount;

  async function handleSave(promptId: string) {
    if (savedPrompts.has(promptId) || savingPrompt === promptId) return;

    setSavingPrompt(promptId);

    try {
      const res = await fetch(`/api/prompts/${promptId}/save`, {
        method: "POST",
      });
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
      const res = await fetch(`/api/workflows/${workflowId}/save`, {
        method: "POST",
      });
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
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return count.toString();
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top nav */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-border">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </a>
        <a
          href="/saved"
          className="font-mono text-[0.75rem] font-medium text-text-muted hover:text-accent transition-colors"
        >
          My saves
        </a>
      </nav>

      <main className="max-w-[600px] mx-auto px-5 py-10">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-5">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-warm flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {initial}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {profile.display_name || profile.username}
            </h1>
            {profile.headline && (
              <p className="text-sm text-text-muted mt-0.5">
                {profile.headline}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-text-secondary leading-relaxed mb-8">
            {profile.bio}
          </p>
        )}

        {/* Impact Stats */}
        {impactStats.length > 0 && (
          <section className="mb-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-3">
              Impact
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {impactStats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-surface border border-border rounded-2xl py-4 px-5 min-w-[220px] max-w-[260px] shrink-0 snap-start shadow-sm"
                >
                  <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-3">
                    {stat.metric}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    {stat.before_value && (
                      <>
                        <span className="font-mono text-sm text-text-muted line-through opacity-60">
                          {stat.before_value}
                        </span>
                        <span className="text-accent text-sm font-bold">→</span>
                      </>
                    )}
                    <span className="font-mono text-sm font-bold text-accent">
                      {stat.after_value}
                    </span>
                  </div>
                  {stat.context && (
                    <p className="text-[0.68rem] text-text-muted leading-relaxed">
                      {stat.context}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Stack */}
        {stack.length > 0 && (
          <section className="mb-8">
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-3">
              AI Stack
            </p>
            <div className="flex gap-2 flex-wrap mb-2">
              {stack.map((item) => {
                const icon = getToolIcon(item.tool_name);
                return (
                  <button
                    key={item.id}
                    className={`font-mono text-[0.72rem] font-medium py-2 px-4 rounded-full border cursor-pointer transition-all hover:scale-105 hover:shadow-[0_2px_10px_rgba(224,115,78,0.15)] flex items-center gap-1.5 ${
                      activeStack === item.id
                        ? "bg-accent text-white border-accent"
                        : item.is_primary
                        ? "border-accent/25 text-accent bg-accent-light"
                        : "border-border text-text-secondary bg-bg"
                    }`}
                    onClick={() =>
                      setActiveStack(activeStack === item.id ? null : item.id)
                    }
                  >
                    <span className="text-[0.85rem] leading-none">{icon.emoji}</span>
                    {item.tool_name}
                  </button>
                );
              })}
            </div>
            {activeStack && (() => {
              const activeItem = stack.find((s) => s.id === activeStack);
              const icon = activeItem ? getToolIcon(activeItem.tool_name) : null;
              return (
                <div className="font-mono text-[0.75rem] leading-relaxed text-text-secondary bg-accent-light border border-accent/15 rounded-xl py-3.5 px-5 animate-[fadeInUp_0.25s_ease]">
                  <span className="font-semibold text-text">
                    {icon?.emoji} {activeItem?.tool_name}
                  </span>
                  <span className="mx-2 text-accent/30">—</span>
                  {activeItem?.description || "No description yet."}
                </div>
              );
            })()}
          </section>
        )}

        {/* Workflows */}
        {workflows.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
                Workflows
              </p>
              <span className="font-mono text-[0.6rem] text-text-muted">
                {workflows.length} total
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                >
                  {/* Workflow header */}
                  <div
                    className="py-4 px-5 flex justify-between items-center cursor-pointer transition-all hover:bg-accent-light/50"
                    onClick={() =>
                      setExpandedWorkflow(
                        expandedWorkflow === workflow.id ? null : workflow.id
                      )
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm tracking-tight">
                        {workflow.title}
                      </h3>
                      {workflow.description && (
                        <p className="text-[0.7rem] text-text-muted mt-0.5 line-clamp-1">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="font-mono text-[0.65rem] text-text-muted">
                        {workflow.steps.length} steps
                      </span>
                      <span
                        className={`font-mono text-[0.65rem] text-text-muted ${
                          savedWorkflows.has(workflow.id)
                            ? "animate-[numberBump_0.3s_ease]"
                            : ""
                        }`}
                      >
                        {formatSaveCount(saveCounts[workflow.id] || 0)} saves
                      </span>
                      <svg
                        className={`w-4 h-4 text-text-muted transition-transform ${
                          expandedWorkflow === workflow.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded workflow */}
                  {expandedWorkflow === workflow.id && (
                    <div className="px-5 pb-4 animate-[fadeInUp_0.2s_ease]">
                      {/* Step flow */}
                      <div className="mb-4">
                        {/* Desktop: horizontal flow */}
                        <div className="hidden sm:flex items-center gap-2 flex-wrap">
                          {workflow.steps.map((step, si) => (
                            <div key={si} className="flex items-center gap-2">
                              <div className="bg-bg border border-border rounded-xl py-2.5 px-3.5 max-w-[200px]">
                                <span className="font-mono text-[0.65rem] font-semibold text-accent block">
                                  {getToolIcon(step.tool).emoji} {step.tool}
                                </span>
                                <span className="text-[0.68rem] text-text-secondary leading-snug block mt-0.5">
                                  {step.action}
                                </span>
                              </div>
                              {si < workflow.steps.length - 1 && (
                                <span className="text-accent font-bold text-sm shrink-0">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Mobile: vertical flow */}
                        <div className="sm:hidden space-y-2">
                          {workflow.steps.map((step, si) => (
                            <div key={si}>
                              <div className="bg-bg border border-border rounded-xl py-2.5 px-3.5 flex items-start gap-2">
                                <span className="font-mono text-[0.6rem] text-text-muted mt-0.5 shrink-0">
                                  {si + 1}
                                </span>
                                <div>
                                  <span className="font-mono text-[0.65rem] font-semibold text-accent">
                                    {getToolIcon(step.tool).emoji} {step.tool}
                                  </span>
                                  <span className="text-[0.68rem] text-text-secondary block mt-0.5">
                                    {step.action}
                                  </span>
                                </div>
                              </div>
                              {si < workflow.steps.length - 1 && (
                                <div className="flex justify-center py-1">
                                  <span className="text-accent text-xs">↓</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        className={`font-sans text-xs font-semibold py-2.5 px-5 rounded-lg border transition-all ${
                          savedWorkflows.has(workflow.id)
                            ? "bg-accent-light border-accent/20 text-accent cursor-default"
                            : "bg-accent text-white border-accent cursor-pointer hover:bg-accent-deep hover:shadow-[0_2px_12px_rgba(224,115,78,0.25)]"
                        }`}
                        onClick={() => handleSaveWorkflow(workflow.id)}
                        disabled={
                          savedWorkflows.has(workflow.id) ||
                          savingWorkflow === workflow.id
                        }
                      >
                        {savingWorkflow === workflow.id
                          ? "Saving..."
                          : savedWorkflows.has(workflow.id)
                          ? "Saved ✓"
                          : "Save workflow"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Prompts */}
        {prompts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
                Prompts
              </p>
              <span className="font-mono text-[0.6rem] text-text-muted">
                {prompts.length} total
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {visiblePrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                >
                  {/* Prompt header */}
                  <div
                    className="py-4 px-5 flex justify-between items-center cursor-pointer transition-all hover:bg-accent-light/50"
                    onClick={() =>
                      setExpandedPrompt(
                        expandedPrompt === prompt.id ? null : prompt.id
                      )
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm tracking-tight">
                        {prompt.title}
                      </h3>
                      {prompt.category && (
                        <span className="font-mono text-[0.6rem] text-text-muted mt-1 inline-block">
                          {prompt.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span
                        className={`font-mono text-[0.65rem] text-text-muted ${
                          savedPrompts.has(prompt.id)
                            ? "animate-[numberBump_0.3s_ease]"
                            : ""
                        }`}
                      >
                        {formatSaveCount(saveCounts[prompt.id] || 0)} saves
                      </span>
                      <svg
                        className={`w-4 h-4 text-text-muted transition-transform ${
                          expandedPrompt === prompt.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded prompt */}
                  {expandedPrompt === prompt.id && (
                    <div className="px-5 pb-4 animate-[fadeInUp_0.2s_ease]">
                      <div className="bg-bg border border-border rounded-xl p-4 mb-3">
                        <pre className="font-mono text-[0.72rem] leading-relaxed text-text-secondary whitespace-pre-wrap">
                          {prompt.prompt_text}
                        </pre>
                      </div>
                      {prompt.description && (
                        <p className="text-xs text-text-muted mb-3 leading-relaxed">
                          {prompt.description}
                        </p>
                      )}
                      <button
                        className={`font-sans text-xs font-semibold py-2.5 px-5 rounded-lg border transition-all ${
                          savedPrompts.has(prompt.id)
                            ? "bg-accent-light border-accent/20 text-accent cursor-default"
                            : "bg-accent text-white border-accent cursor-pointer hover:bg-accent-deep hover:shadow-[0_2px_12px_rgba(224,115,78,0.25)]"
                        }`}
                        onClick={() => handleSave(prompt.id)}
                        disabled={
                          savedPrompts.has(prompt.id) ||
                          savingPrompt === prompt.id
                        }
                      >
                        {savingPrompt === prompt.id
                          ? "Saving..."
                          : savedPrompts.has(prompt.id)
                          ? "Saved ✓"
                          : "Save prompt"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Show more button */}
            {hasMore && (
              <button
                className="w-full mt-4 py-3 px-5 bg-surface border border-border rounded-xl font-mono text-[0.75rem] font-medium text-text-secondary hover:border-accent hover:text-accent transition-all hover:shadow-sm"
                onClick={() =>
                  setVisibleCount((prev) => prev + PROMPTS_PER_PAGE)
                }
              >
                Show {Math.min(remaining, PROMPTS_PER_PAGE)} more prompt
                {Math.min(remaining, PROMPTS_PER_PAGE) !== 1 ? "s" : ""}{" "}
                <span className="text-text-muted">
                  ({remaining} remaining)
                </span>
              </button>
            )}
          </section>
        )}

        {/* CTA */}
        <div className="text-center pt-6 pb-4 border-t border-border">
          <p className="text-sm text-text-muted mb-3">
            Want your own AI profile?
          </p>
          <a
            href="/"
            className="inline-block font-sans text-sm font-semibold py-3 px-6 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,78,0.25)]"
          >
            Create your Melbo →
          </a>
        </div>
      </main>
    </div>
  );
}
