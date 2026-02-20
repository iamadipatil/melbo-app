"use client";

import { useState, useEffect } from "react";
import { getToolIcon } from "@/lib/tool-icons";

interface OnboardingProps {
  email: string;
  profileId: string | null;
  username: string;
  existingDisplayName: string;
  existingHeadline: string;
  existingBio: string;
  existingStack: { tool_name: string; description: string; is_primary: boolean }[];
  existingPrompts: { title: string; prompt_text: string; category: string }[];
  onComplete: () => void;
}

const TOOL_OPTIONS = [
  "Claude", "ChatGPT", "Cursor", "Perplexity", "Midjourney", "v0", "Copilot",
  "Gemini", "Lovable", "n8n", "Zapier", "Notion AI", "Replit", "Bolt",
  "NotebookLM", "Grok", "Stable Diffusion", "ElevenLabs", "Granola", "Pylon",
];

const HEADLINE_TEMPLATES = [
  "I use AI to ___",
  "Head of ___ · AI-powered ___",
  "___ who builds with AI",
  "AI-first ___",
];

const EXAMPLE_PROMPTS = [
  {
    title: "Clone your writing voice",
    prompt_text: "Analyze my last 10 pieces of writing. Extract my sentence patterns, vocabulary preferences, tone, and rhetorical devices. Create a Voice DNA profile I can paste into any AI tool so it writes in my exact style.",
    category: "Writing",
  },
  {
    title: "Weekly status update generator",
    prompt_text: "Here are my rough notes from this week: [paste notes]. Turn them into a clean, professional status update with sections for Completed, In Progress, and Blockers. Keep it concise.",
    category: "Productivity",
  },
  {
    title: "Competitive intelligence brief",
    prompt_text: "Research [competitor name] thoroughly. Analyze their recent product updates, job postings, pricing changes, and customer reviews. Identify what they're actually building vs. what they're announcing. Output a one-page brief.",
    category: "Research",
  },
  {
    title: "Meeting prep assistant",
    prompt_text: "I have a meeting with [person/company] about [topic]. Research them, summarize relevant context, suggest 5 talking points, and draft 3 questions I should ask. Keep it under 500 words.",
    category: "Productivity",
  },
];

const DESCRIPTION_PLACEHOLDERS = [
  "My daily driver for writing and brainstorming",
  "Built my entire landing page with it",
  "Handles 30% of our support tickets",
  "Use it for all my research workflows",
  "Powers our content pipeline",
];

const CATEGORIES = [
  "Writing", "Code", "Research", "Strategy", "Automation", "Marketing", "Productivity", "Other",
];

function computeInitialStep(
  displayName: string,
  headline: string,
  bio: string,
  stack: { tool_name: string }[],
): number {
  if (!displayName) return 0;
  if (stack.length < 2) return 1;
  return 2;
}

export default function Onboarding({
  email,
  profileId,
  username,
  existingDisplayName,
  existingHeadline,
  existingBio,
  existingStack,
  existingPrompts,
  onComplete,
}: OnboardingProps) {
  const initialStep = computeInitialStep(
    existingDisplayName,
    existingHeadline,
    existingBio,
    existingStack,
  );

  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Step 1: Profile basics
  const [displayName, setDisplayName] = useState(existingDisplayName);
  const [headline, setHeadline] = useState(existingHeadline);
  const [bio, setBio] = useState(existingBio);

  // Step 2: Stack
  const [selectedTools, setSelectedTools] = useState<Set<string>>(
    new Set(existingStack.map((s) => s.tool_name))
  );
  const [toolDescriptions, setToolDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(existingStack.map((s) => [s.tool_name, s.description || ""]))
  );

  // Step 3: Prompt
  const [promptTitle, setPromptTitle] = useState(existingPrompts[0]?.title || "");
  const [promptText, setPromptText] = useState(existingPrompts[0]?.prompt_text || "");
  const [promptCategory, setPromptCategory] = useState(existingPrompts[0]?.category || "");

  // Step 4: Share
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (step === 3) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const profileUrl = `melbo.ai/${username}`;
  const fullProfileUrl = `https://melbo.ai/${username}`;

  async function saveProgress() {
    setSaving(true);
    try {
      // Save profile
      await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          headline,
          bio,
          ...(profileId ? {} : { username }),
        }),
      });

      // Save stack
      const stackItems = Array.from(selectedTools).map((tool, i) => ({
        tool_name: tool,
        description: toolDescriptions[tool] || "",
        is_primary: i === 0,
      }));
      if (stackItems.length > 0) {
        await fetch("/api/me/stack", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: stackItems }),
        });
      }

      // Save prompt
      if (promptTitle.trim() && promptText.trim()) {
        await fetch("/api/me/prompts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [
              {
                title: promptTitle.trim(),
                prompt_text: promptText.trim(),
                description: "",
                category: promptCategory,
              },
            ],
          }),
        });
      }
    } catch {
      // continue anyway
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    setDirection("forward");
    // Save progress at each step transition
    await saveProgress();

    if (step === 2) {
      // Moving to completion — mark onboarding done
      try {
        await fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarding_completed: true }),
        });
      } catch {
        // continue
      }
    }

    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 0));
  }

  function toggleTool(tool: string) {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(tool)) {
        next.delete(tool);
      } else {
        next.add(tool);
      }
      return next;
    });
  }

  function setToolDesc(tool: string, desc: string) {
    setToolDescriptions((prev) => ({ ...prev, [tool]: desc }));
  }

  function fillExamplePrompt(example: typeof EXAMPLE_PROMPTS[0]) {
    setPromptTitle(example.title);
    setPromptText(example.prompt_text);
    setPromptCategory(example.category);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  function shareOnLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullProfileUrl)}`,
      "_blank"
    );
  }

  function shareOnX() {
    const text = `Just built my Melbo 🔥 ${fullProfileUrl}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  const stepLabels = ["Profile", "Stack", "Prompt", "Done!"];
  const canProceedStep0 = displayName.trim().length > 0;
  const canProceedStep1 = selectedTools.size >= 2;
  const animClass = direction === "forward"
    ? "animate-[slideInRight_0.3s_ease]"
    : "animate-[slideInLeft_0.3s_ease]";

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-border">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </a>
        <span className="font-mono text-[0.72rem] text-text-muted">{email}</span>
      </nav>

      {/* Progress bar */}
      <div className="max-w-[640px] mx-auto px-5 pt-8 pb-4">
        <div className="flex items-center gap-1 mb-2">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i <= step ? "#e0734e" : "#f0ebe6",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={`font-mono text-[0.6rem] font-medium transition-colors ${
                i === step
                  ? "text-accent"
                  : i < step
                  ? "text-text"
                  : "text-text-muted"
              }`}
            >
              {i < step ? "✓ " : ""}
              {label}
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-[640px] mx-auto px-5 py-6">
        {/* STEP 1: Profile basics */}
        {step === 0 && (
          <div key="step0" className={animClass}>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              Let&apos;s start with you
            </h2>
            <p className="text-sm text-text-muted mb-8">
              The basics for your Melbo profile.
            </p>

            <div className="space-y-5">
              <div>
                <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                  Display Name
                </label>
                <input
                  type="text"
                  className="w-full text-sm font-medium text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)]"
                  placeholder="Your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
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
                <div className="flex flex-wrap gap-2 mt-3">
                  {HEADLINE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => setHeadline(tmpl)}
                      className="font-mono text-[0.65rem] py-1.5 px-3 rounded-full border border-border text-text-muted hover:border-accent hover:text-accent transition-all cursor-pointer"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                  Bio
                </label>
                <textarea
                  className="w-full text-sm text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)] resize-none leading-relaxed"
                  placeholder="What do you do with AI? Keep it casual — one or two sentences."
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={goNext}
                disabled={!canProceedStep0 || saving}
                className="font-sans text-sm font-semibold py-3 px-8 bg-accent text-white rounded-xl cursor-pointer transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Stack */}
        {step === 1 && (
          <div key="step1" className={animClass}>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              What&apos;s in your AI stack?
            </h2>
            <p className="text-sm text-text-muted mb-8">
              Pick at least 2 tools you use regularly.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL_OPTIONS.map((tool) => {
                const selected = selectedTools.has(tool);
                const icon = getToolIcon(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`font-mono text-[0.75rem] font-medium py-2.5 px-4 rounded-full border cursor-pointer transition-all hover:scale-105 ${
                      selected
                        ? "bg-accent text-white border-accent shadow-sm"
                        : "border-border text-text-secondary bg-surface hover:border-accent/50"
                    }`}
                  >
                    {icon.emoji} {tool}
                  </button>
                );
              })}
            </div>

            {/* Descriptions for selected tools */}
            {selectedTools.size > 0 && (
              <div className="space-y-3 mb-6">
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
                  How do you use them?
                </p>
                {Array.from(selectedTools).map((tool, i) => {
                  const icon = getToolIcon(tool);
                  return (
                    <div
                      key={tool}
                      className="flex items-start gap-3 bg-surface border border-border rounded-xl py-3 px-4 animate-[fadeInUp_0.2s_ease]"
                    >
                      <span className="text-lg leading-none mt-0.5">{icon.emoji}</span>
                      <div className="flex-1">
                        <span className="font-mono text-xs font-medium">{tool}</span>
                        <input
                          type="text"
                          className="w-full text-xs text-text bg-bg border border-border rounded-lg py-2 px-3 mt-1.5 outline-none focus:border-accent transition-all"
                          placeholder={DESCRIPTION_PLACEHOLDERS[i % DESCRIPTION_PLACEHOLDERS.length]}
                          value={toolDescriptions[tool] || ""}
                          onChange={(e) => setToolDesc(tool, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={goBack}
                className="font-sans text-sm font-medium py-3 px-6 text-text-muted hover:text-text transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={goNext}
                disabled={!canProceedStep1 || saving}
                className="font-sans text-sm font-semibold py-3 px-8 bg-accent text-white rounded-xl cursor-pointer transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: First prompt */}
        {step === 2 && (
          <div key="step2" className={animClass}>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              Share your best prompt
            </h2>
            <p className="text-sm text-text-muted mb-8">
              What&apos;s a prompt you use all the time? Share one that works.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full text-sm font-medium text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)]"
                  placeholder="Give it a name"
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                  Prompt
                </label>
                <textarea
                  className="w-full font-mono text-xs text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)] resize-none leading-relaxed"
                  placeholder="Paste or type your prompt here"
                  rows={6}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>

              <div>
                <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPromptCategory(cat)}
                      className={`font-mono text-[0.65rem] font-medium py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                        promptCategory === cat
                          ? "bg-accent text-white border-accent"
                          : "border-border text-text-muted hover:border-accent hover:text-accent"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Example prompts */}
            <div className="mb-6">
              <p className="text-xs text-text-muted mb-3">
                Need inspiration? Tap one to auto-fill:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example.title}
                    type="button"
                    onClick={() => fillExamplePrompt(example)}
                    className="text-left bg-surface border border-border rounded-xl py-3 px-4 hover:border-accent/50 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <span className="text-xs font-medium text-text block mb-1">
                      {example.title}
                    </span>
                    <span className="font-mono text-[0.6rem] text-text-muted line-clamp-2">
                      {example.prompt_text.substring(0, 80)}...
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={goBack}
                className="font-sans text-sm font-medium py-3 px-6 text-text-muted hover:text-text transition-colors"
              >
                ← Back
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={async () => {
                    // Skip prompt — clear and go next
                    setPromptTitle("");
                    setPromptText("");
                    setPromptCategory("");
                    await goNext();
                  }}
                  className="font-mono text-[0.72rem] text-text-muted hover:text-accent transition-colors"
                >
                  I&apos;ll add prompts later
                </button>
                <button
                  onClick={goNext}
                  disabled={saving}
                  className="font-sans text-sm font-semibold py-3 px-8 bg-accent text-white rounded-xl cursor-pointer transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Next →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Completion */}
        {step === 3 && (
          <div key="step3" className={`text-center ${animClass}`}>
            {/* Confetti */}
            {showConfetti && (
              <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-[confettiFall_2.5s_ease-out_forwards]"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: "-10px",
                      animationDelay: `${Math.random() * 0.8}s`,
                      width: `${6 + Math.random() * 6}px`,
                      height: `${6 + Math.random() * 6}px`,
                      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                      backgroundColor: ["#e0734e", "#f5c542", "#4ecdc4", "#ff6b6b", "#c44ede"][
                        Math.floor(Math.random() * 5)
                      ],
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              You&apos;re live!
            </h2>
            <p className="text-sm text-text-muted mb-8">
              Your Melbo is ready to share with the world.
            </p>

            {/* Profile URL */}
            <div className="bg-surface border border-border rounded-2xl py-5 px-6 mb-6 inline-block">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2">
                Your Melbo URL
              </p>
              <p className="font-mono text-lg font-bold text-accent">
                {profileUrl}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button
                onClick={copyLink}
                className="font-sans text-sm font-semibold py-3 px-6 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)]"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="font-sans text-sm font-semibold py-3 px-6 bg-[#0077b5] text-white rounded-xl transition-all hover:opacity-90"
              >
                Share on LinkedIn
              </button>
              <button
                onClick={shareOnX}
                className="font-sans text-sm font-semibold py-3 px-6 bg-[#1d1d1d] text-white rounded-xl transition-all hover:opacity-90"
              >
                Share on X
              </button>
            </div>

            {/* Profile preview mini */}
            <div className="bg-surface border border-border rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  {displayName.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{displayName}</p>
                  {headline && (
                    <p className="text-xs text-text-muted">{headline}</p>
                  )}
                </div>
              </div>
              {bio && <p className="text-xs text-text-secondary mb-3">{bio}</p>}
              {selectedTools.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedTools).slice(0, 5).map((tool) => (
                    <span
                      key={tool}
                      className="font-mono text-[0.65rem] py-1 px-2.5 rounded-full border border-border text-text-secondary bg-bg"
                    >
                      {getToolIcon(tool).emoji} {tool}
                    </span>
                  ))}
                  {selectedTools.size > 5 && (
                    <span className="font-mono text-[0.65rem] py-1 px-2.5 text-text-muted">
                      +{selectedTools.size - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 items-center">
              <a
                href={`/${username}`}
                target="_blank"
                className="font-sans text-sm font-semibold py-3 px-8 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] inline-block"
              >
                Go to your profile ↗
              </a>
              <button
                onClick={onComplete}
                className="font-mono text-[0.75rem] text-text-muted hover:text-accent transition-colors"
              >
                Edit your Melbo →
              </button>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
