"use client";

import { useState, useEffect } from "react";

interface SavedPrompt {
  id: string;
  created_at: string;
  prompt_id: string;
  prompts: {
    id: string;
    title: string;
    prompt_text: string;
    description: string | null;
    category: string | null;
    save_count: number;
    profile_id: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  };
}

export default function SavedPage() {
  const [saves, setSaves] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((data) => {
        setSaves(data.saves || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleCopy(promptText: string, id: string) {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function formatSaveCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return count.toString();
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-border">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </a>
      </nav>

      <main className="max-w-[600px] mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          My saved prompts
        </h1>
        <p className="text-sm text-text-muted mb-8">
          Prompts you&apos;ve saved from other Melbo profiles.
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-text-muted mt-3">Loading saves...</p>
          </div>
        ) : saves.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center text-3xl mx-auto mb-4">
              📭
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-2">
              No saves yet
            </h2>
            <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
              When you save prompts from other people&apos;s profiles, they&apos;ll
              show up here.
            </p>
            <a
              href="/"
              className="inline-block font-sans text-sm font-semibold py-3 px-6 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
            >
              Explore Melbo →
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saves.map((save) => {
              const prompt = save.prompts;
              const profile = prompt.profiles;
              const isExpanded = expandedPrompt === save.id;

              return (
                <div
                  key={save.id}
                  className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                >
                  {/* Header */}
                  <div
                    className="py-4 px-5 cursor-pointer transition-all hover:bg-accent-light/50"
                    onClick={() =>
                      setExpandedPrompt(isExpanded ? null : save.id)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm tracking-tight">
                          {prompt.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <a
                            href={`/${profile.username}`}
                            className="font-mono text-[0.62rem] text-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{profile.username}
                          </a>
                          {prompt.category && (
                            <>
                              <span className="text-text-muted text-[0.5rem]">
                                ·
                              </span>
                              <span className="font-mono text-[0.6rem] text-text-muted">
                                {prompt.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="font-mono text-[0.65rem] text-text-muted">
                          {formatSaveCount(prompt.save_count)} saves
                        </span>
                        <svg
                          className={`w-4 h-4 text-text-muted transition-transform ${
                            isExpanded ? "rotate-180" : ""
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
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-5 pb-4 animate-[fadeInUp_0.2s_ease]">
                      <div className="bg-bg border border-border rounded-xl p-4 mb-3 relative">
                        <pre className="font-mono text-[0.72rem] leading-relaxed text-text-secondary whitespace-pre-wrap">
                          {prompt.prompt_text}
                        </pre>
                      </div>
                      {prompt.description && (
                        <p className="text-xs text-text-muted mb-3 leading-relaxed">
                          {prompt.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          className="font-sans text-xs font-semibold py-2.5 px-5 rounded-lg border bg-accent text-white border-accent cursor-pointer hover:bg-accent-deep hover:shadow-[0_2px_12px_rgba(224,115,78,0.25)] transition-all"
                          onClick={() =>
                            handleCopy(prompt.prompt_text, save.id)
                          }
                        >
                          {copied === save.id ? "Copied ✓" : "Copy prompt"}
                        </button>
                        <a
                          href={`/${profile.username}`}
                          className="font-sans text-xs font-semibold py-2.5 px-5 rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-all"
                        >
                          View profile
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
