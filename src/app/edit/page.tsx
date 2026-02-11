"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { getToolIcon, KNOWN_TOOLS } from "@/lib/tool-icons";

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

  // Active section tab
  const [activeTab, setActiveTab] = useState<"profile" | "stack" | "prompts">(
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
      } else if (data.profile) {
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

        {/* Section tabs */}
        <div className="flex gap-1 mb-6 bg-surface border border-border rounded-xl p-1">
          {(["profile", "stack", "prompts"] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-[0.72rem] font-medium transition-all ${
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
                : `Prompts (${prompts.length})`}
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
