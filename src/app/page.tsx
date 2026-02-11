"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [claimedBoxes, setClaimedBoxes] = useState<Record<number, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsername, setModalUsername] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalState, setModalState] = useState<
    "input" | "reserving" | "success" | "taken"
  >("input");
  const [activeClaimBox, setActiveClaimBox] = useState<number | null>(null);
  const [liveCount, setLiveCount] = useState<string>("...");
  const [checking, setChecking] = useState<Record<number, boolean>>({});
  const [takenMsg, setTakenMsg] = useState<Record<number, string>>({});

  // Interactive mockup state
  const [activeStack, setActiveStack] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Fetch live count
  useEffect(() => {
    fetch(
      "https://script.google.com/macros/s/AKfycbzHBddp50ls-cCkodAdOD8qdthTTn3l2tveK6bF09v0MZNE2_XTpLWXplLMTbV7FuXAbw/exec"
    )
      .then((r) => r.json())
      .then((data) => setLiveCount(data.count.toLocaleString()))
      .catch(() => setLiveCount("0"));
  }, []);

  function sanitize(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .substring(0, 30);
  }

  function handleClaim(n: number, username: string) {
    const u = sanitize(username.trim());
    if (!u) return;

    setChecking((prev) => ({ ...prev, [n]: true }));
    setTakenMsg((prev) => ({ ...prev, [n]: "" }));

    fetch(
      "https://script.google.com/macros/s/AKfycbzHBddp50ls-cCkodAdOD8qdthTTn3l2tveK6bF09v0MZNE2_XTpLWXplLMTbV7FuXAbw/exec",
      {
        method: "POST",
        body: JSON.stringify({ username: u, check_only: true }),
      }
    )
      .then((r) => r.json())
      .then((data) => {
        setChecking((prev) => ({ ...prev, [n]: false }));
        if (data.result === "taken") {
          setTakenMsg((prev) => ({
            ...prev,
            [n]: `melbo.ai/${u} is already taken. Try another!`,
          }));
        } else {
          setActiveClaimBox(n);
          setModalUsername(u);
          setModalEmail("");
          setModalState("input");
          setModalOpen(true);
          setTimeout(() => emailRef.current?.focus(), 300);
        }
      })
      .catch(() => {
        setChecking((prev) => ({ ...prev, [n]: false }));
      });
  }

  function handleReserve() {
    const e = modalEmail.trim();
    if (!e || !e.includes("@")) {
      emailRef.current?.focus();
      return;
    }

    setModalState("reserving");

    fetch(
      "https://script.google.com/macros/s/AKfycbzHBddp50ls-cCkodAdOD8qdthTTn3l2tveK6bF09v0MZNE2_XTpLWXplLMTbV7FuXAbw/exec",
      {
        method: "POST",
        body: JSON.stringify({ username: modalUsername, email: e }),
      }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.result === "taken") {
          setModalState("taken");
        } else {
          setModalState("success");
          if (activeClaimBox !== null) {
            setClaimedBoxes((prev) => ({
              ...prev,
              [activeClaimBox]: modalUsername,
            }));
          }
          setTimeout(() => setModalOpen(false), 2500);
        }
      })
      .catch(() => {
        setModalState("input");
      });
  }

  const stackItems = [
    {
      name: "Claude",
      desc: "My daily driver for writing, support automation, and building internal tools. Handles 30% of our customer tickets autonomously via Pylon integration.",
    },
    {
      name: "Pylon",
      desc: "AI-powered support platform. Connected to Claude for auto-responses. Handles ticket routing, tagging, and first-response drafts.",
    },
    {
      name: "ChatGPT",
      desc: "Use it for quick brainstorming and second opinions when I want a different perspective from Claude.",
    },
    {
      name: "Cursor",
      desc: "AI code editor. Built the entire Melbo landing page with it. Game changer for non-developers who want to ship.",
    },
    {
      name: "Perplexity",
      desc: "My go-to for research. Replaced most of my Google searches. The citation feature is clutch for competitive analysis.",
    },
    {
      name: "n8n",
      desc: "Workflow automation with AI nodes. Runs our customer onboarding sequences and internal Slack alerts.",
    },
  ];

  const mockPrompts = [
    {
      title: "Clone your writing voice",
      saves: "2.1k saves",
      text: "Analyze my last 10 blog posts / emails / messages. Extract my sentence patterns, vocabulary preferences, tone, and rhetorical devices. Then create a Voice DNA profile I can paste into any AI tool so it writes in my exact voice. Include specific examples from my writing.",
    },
    {
      title: "Competitive intelligence agent",
      saves: "1.4k saves",
      text: 'You are a competitive intelligence expert. Conduct deep reconnaissance on [competitor]. Analyze their recent job postings, product changelog, pricing changes, customer reviews, and leadership hires. Identify what they are actually building vs what they are announcing. Output a one-page brief.',
    },
    {
      title: "n8n AI agent workflow builder",
      saves: "890 saves",
      text: "You are an expert n8n workflow automation engineer. Design a complete AI agent workflow for [use case]. Include node-by-node configuration, error handling, retry logic, and the exact prompts for each AI node. Output a step-by-step setup guide I can follow in n8n.",
    },
  ];

  function ClaimBox({ n }: { n: number }) {
    const [input, setInput] = useState("");

    if (claimedBoxes[n]) {
      return (
        <div className="text-center animate-[scaleIn_0.4s_ease_forwards]">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center text-2xl mx-auto mb-4">
            🔥
          </div>
          <h3 className="text-lg font-bold">
            melbo.ai/<span className="text-accent">{claimedBoxes[n]}</span> is
            locked in
          </h3>
          <p className="text-sm text-text-muted mt-1">
            We&apos;ll ping you when it&apos;s time to build your Melbo.
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center bg-surface border border-border rounded-2xl p-1.5 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--color-accent-glow)] shadow-sm">
          <span className="font-mono text-sm text-text-muted pl-4 pr-0 py-3.5 whitespace-nowrap font-medium select-none">
            melbo.ai/
          </span>
          <input
            type="text"
            className="flex-1 font-mono text-sm font-medium text-text bg-transparent border-none outline-none py-3.5 px-1 min-w-0 placeholder:text-text-muted placeholder:opacity-50"
            placeholder="yourname"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(sanitize(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleClaim(n, input)}
          />
          <button
            className="font-sans text-sm font-semibold py-3.5 px-7 bg-accent text-white border-none rounded-xl cursor-pointer whitespace-nowrap transition-all hover:bg-accent-deep hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-60"
            onClick={() => handleClaim(n, input)}
            disabled={checking[n]}
          >
            {checking[n] ? "Checking..." : "Claim it"}
          </button>
        </div>
        {takenMsg[n] && (
          <p className="font-mono text-xs text-accent-deep mt-2.5 font-medium">
            {takenMsg[n]}
          </p>
        )}
        {n === 1 && (
          <p className="font-mono text-[0.68rem] text-text-muted mt-3.5">
            <strong className="text-accent font-semibold">{liveCount}</strong>{" "}
            usernames already claimed
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 px-8 py-4 flex justify-between items-center z-50 backdrop-blur-3xl bg-bg/85 border-b border-black/[0.04]">
        <div className="text-[1.4rem] font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </div>
        <button
          className="font-sans text-[0.82rem] py-2.5 px-5 bg-text text-white border-none rounded-full cursor-pointer font-semibold transition-all hover:bg-accent hover:-translate-y-0.5 hover:shadow-md"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Claim your Melbo
        </button>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-28 pb-16 relative">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(232,115,74,0.08)_0%,rgba(245,149,107,0.04)_40%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none" />

        <span className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.1em] text-accent border border-accent/25 py-1.5 px-4.5 rounded-full mb-9 inline-block bg-accent-light animate-[fadeInUp_0.7s_ease_forwards] opacity-0">
          Your AI game → one link
        </span>

        <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-none tracking-[-0.04em] mb-6 animate-[fadeInUp_0.7s_ease_0.1s_forwards] opacity-0">
          Show the world
          <br />
          how you <span className="text-accent">AI</span>
        </h1>

        <p className="text-[clamp(1rem,1.6vw,1.2rem)] text-text-secondary max-w-[480px] leading-relaxed mb-11 animate-[fadeInUp_0.7s_ease_0.2s_forwards] opacity-0">
          Your prompts. Your stack. Your AI game.
          <br />
          All in one beautiful link.
        </p>

        <div className="w-full max-w-[480px] relative z-[2] animate-[fadeInUp_0.7s_ease_0.35s_forwards] opacity-0">
          <ClaimBox n={1} />
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section className="scroll-reveal px-6 pb-20 pt-10 max-w-[960px] mx-auto opacity-0 translate-y-6 transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] [&.visible]:opacity-100 [&.visible]:translate-y-0">
        <div className="text-center mb-12">
          <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent mb-3.5">
            What&apos;s a Melbo?
          </p>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight leading-tight">
            One link to flex your AI muscle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Prompts */}
          <div className="bg-card border border-border rounded-[20px] p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-border-hover shadow-sm md:col-span-2">
            <span className="text-3xl mb-5 block">⚡</span>
            <h3 className="text-lg font-bold tracking-tight mb-2">
              Drop your best prompts
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Share the prompts that actually work. The ones you&apos;re proud of.
              Let people save them, try them, learn from them.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center justify-between bg-bg border border-border rounded-[10px] px-4 py-3">
                <span className="font-mono text-[0.73rem] font-medium">
                  Clone your writing voice
                </span>
                <span className="font-mono text-[0.62rem] text-text-muted whitespace-nowrap ml-2">
                  2.1k saves
                </span>
              </div>
              <div className="flex items-center justify-between bg-bg border border-border rounded-[10px] px-4 py-3">
                <span className="font-mono text-[0.73rem] font-medium">
                  Competitive intelligence agent
                </span>
                <span className="font-mono text-[0.62rem] text-text-muted whitespace-nowrap ml-2">
                  1.4k saves
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Stats */}
          <div className="bg-gradient-to-br from-accent to-accent-warm border-transparent rounded-[20px] p-8 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm">
            <span className="text-3xl mb-5 block">📈</span>
            <h3 className="text-lg font-bold tracking-tight mb-2">
              Build your AI rep
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Your prompts get saved. Your stack gets followed. Your Melbo becomes
              proof.
            </p>
            <div className="flex gap-6 mt-5">
              <div>
                <div className="text-3xl font-bold tracking-tight leading-none">
                  4.2k
                </div>
                <div className="text-xs text-white/70 mt-1">saves</div>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight leading-none">
                  89
                </div>
                <div className="text-xs text-white/70 mt-1">followers</div>
              </div>
            </div>
          </div>

          {/* Card 3: Stack */}
          <div className="bg-card border border-border rounded-[20px] p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-border-hover shadow-sm">
            <span className="text-3xl mb-5 block">🧱</span>
            <h3 className="text-lg font-bold tracking-tight mb-2">
              Show your stack
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Not just &quot;I use ChatGPT.&quot; Show what you actually run.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Claude", "Cursor"].map((t) => (
                <span
                  key={t}
                  className="font-mono text-[0.7rem] font-medium py-1.5 px-3.5 rounded-full bg-accent-light border border-accent/20 text-accent"
                >
                  {t}
                </span>
              ))}
              {["ChatGPT", "Perplexity", "Midjourney", "v0"].map((t) => (
                <span
                  key={t}
                  className="font-mono text-[0.7rem] font-medium py-1.5 px-3.5 rounded-full bg-bg border border-border text-text-secondary"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: One link */}
          <div className="bg-card-alt border border-accent/10 rounded-[20px] p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm md:col-span-2">
            <span className="text-3xl mb-5 block">🔗</span>
            <h3 className="text-lg font-bold tracking-tight mb-2">
              One link. Everything you.
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Put it in your bio. Share it on LinkedIn. Drop it in Slack. Your
              Melbo is your AI identity — all in one place, always up to date.
            </p>
          </div>
        </div>
      </section>

      {/* PROFILE MOCKUP */}
      <section className="scroll-reveal px-6 pb-20 pt-10 max-w-[960px] mx-auto opacity-0 translate-y-6 transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] [&.visible]:opacity-100 [&.visible]:translate-y-0">
        <div className="text-center mb-9">
          <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent mb-3.5">
            Your Melbo
          </p>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight leading-tight">
            This could be you
          </h2>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-10 max-w-[560px] mx-auto shadow-lg relative">
          {/* Top gradient bar */}
          <div className="absolute top-[-1px] left-[30px] right-[30px] h-[3px] bg-gradient-to-r from-accent via-accent-warm to-[#f0b88a] rounded-b" />

          <div className="font-mono text-[0.68rem] font-medium text-text-muted text-center py-2 px-4 bg-bg rounded-lg mb-7 border border-border">
            🌐 melbo.ai/<span className="text-accent">adipatil</span>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-warm flex items-center justify-center text-xl font-bold text-white shrink-0">
              A
            </div>
            <div>
              <h4 className="text-lg font-bold tracking-tight">Adi Patil</h4>
              <p className="text-xs text-text-muted mt-0.5">
                Head of CX · AI-powered support nerd
              </p>
            </div>
          </div>

          <p className="text-[0.82rem] text-text-secondary leading-relaxed mb-6">
            Turned AI into a support superpower. 30% AI resolution rate and
            counting. I make bots do the boring stuff so humans can do the real
            stuff.
          </p>

          {/* Stack */}
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2.5">
            AI Stack{" "}
            <span className="text-[0.55rem] text-accent ml-1.5 font-normal">
              click to explore
            </span>
          </p>
          <div className="flex gap-2 flex-wrap mb-2.5">
            {stackItems.map((item, i) => (
              <span
                key={item.name}
                className={`font-mono text-[0.68rem] font-medium py-1.5 px-3.5 rounded-full border cursor-pointer transition-all hover:scale-105 hover:shadow-[0_2px_10px_rgba(224,115,78,0.15)] ${
                  activeStack === item.name
                    ? "bg-accent text-white border-accent"
                    : i < 2
                    ? "border-accent/25 text-accent bg-accent-light"
                    : "border-border text-text-secondary bg-bg"
                }`}
                onClick={() =>
                  setActiveStack(
                    activeStack === item.name ? null : item.name
                  )
                }
              >
                {item.name}
              </span>
            ))}
          </div>
          {activeStack && (
            <div className="font-mono text-[0.72rem] leading-relaxed text-text-secondary bg-accent-light border border-accent/15 rounded-[10px] py-3.5 px-4.5 mb-6 animate-[fadeInUp_0.25s_ease]">
              {stackItems.find((s) => s.name === activeStack)?.desc}
            </div>
          )}

          {/* Prompts */}
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2.5 mt-6">
            Top Prompts{" "}
            <span className="text-[0.55rem] text-accent ml-1.5 font-normal">
              click to preview
            </span>
          </p>
          <div className="flex flex-col gap-2">
            {mockPrompts.map((prompt, i) => (
              <div key={i}>
                <div
                  className={`bg-bg border border-border rounded-[10px] py-3 px-4 flex justify-between items-center cursor-pointer transition-all hover:border-accent hover:bg-accent-light ${
                    activePrompt === i
                      ? "border-accent bg-accent-light rounded-b-none"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePrompt(activePrompt === i ? null : i)
                  }
                >
                  <span className="font-mono text-[0.72rem] font-medium">
                    {prompt.title}
                  </span>
                  <span className="font-mono text-[0.6rem] text-text-muted whitespace-nowrap ml-2.5">
                    {prompt.saves}
                  </span>
                </div>
                {activePrompt === i && (
                  <div className="font-mono text-[0.68rem] leading-relaxed text-text-secondary bg-accent-light border border-accent/15 border-t-0 rounded-b-[10px] py-3.5 px-4.5 animate-[fadeInUp_0.25s_ease]">
                    {prompt.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="scroll-reveal px-6 pt-16 pb-24 text-center opacity-0 translate-y-6 transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] [&.visible]:opacity-100 [&.visible]:translate-y-0">
        <h2 className="text-[clamp(1.8rem,4.5vw,3rem)] font-bold tracking-tight mb-3">
          Don&apos;t let someone take{" "}
          <span className="text-accent">your name</span>
        </h2>
        <p className="text-base text-text-muted mb-9">Your Melbo is waiting.</p>
        <div className="max-w-[480px] mx-auto">
          <ClaimBox n={2} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 border-t border-border">
        <p className="text-xs text-text-muted">
          melbo.ai — show the world how you AI
        </p>
      </footer>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-text/50 backdrop-blur-lg z-[200] flex justify-center items-center p-6 animate-[fadeIn_0.25s_ease_forwards]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-surface rounded-3xl py-10 px-9 max-w-[420px] w-full shadow-[0_24px_64px_rgba(28,20,16,0.2)] text-center animate-[scaleIn_0.3s_ease_forwards] relative">
            <button
              className="absolute top-4 right-4 bg-transparent border-none text-xl text-text-muted cursor-pointer px-2 py-1"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>

            {modalState === "success" ? (
              <div className="animate-[scaleIn_0.4s_ease_forwards]">
                <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center text-2xl mx-auto mb-4">
                  🔥
                </div>
                <h3 className="text-lg font-bold mb-1.5">
                  melbo.ai/
                  <span className="text-accent">{modalUsername}</span> is locked
                  in
                </h3>
                <p className="text-sm text-text-muted">
                  We&apos;ll ping you when it&apos;s time to build your Melbo.
                </p>
              </div>
            ) : (
              <>
                <span className="inline-block font-mono text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#3a8a5c] bg-[#edf7f0] py-1.5 px-4 rounded-full mb-4">
                  ✓ Available
                </span>
                <p className="text-xl font-bold tracking-tight mb-1.5">
                  melbo.ai/
                  <span className="text-accent">{modalUsername}</span>
                </p>
                <p className="text-sm text-text-muted mb-7">
                  Nice pick. Drop your email to lock it in.
                </p>
                <div className="flex items-center bg-bg border border-border rounded-[14px] p-1.5 transition-all focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--color-accent-glow)] mb-3">
                  <input
                    ref={emailRef}
                    type="email"
                    className="flex-1 font-mono text-sm text-text bg-transparent border-none outline-none py-3.5 px-4 font-medium placeholder:text-text-muted placeholder:opacity-50"
                    placeholder="your@email.com"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReserve()}
                  />
                </div>
                <button
                  className="font-sans text-[0.9rem] font-semibold py-4 px-7 bg-accent text-white border-none rounded-xl cursor-pointer w-full transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(224,115,78,0.25)] disabled:opacity-60"
                  onClick={handleReserve}
                  disabled={modalState === "reserving"}
                >
                  {modalState === "reserving"
                    ? "Reserving..."
                    : "Reserve my spot"}
                </button>
                {modalState === "taken" && (
                  <p className="font-mono text-xs text-accent-deep mt-2 font-medium">
                    Someone just grabbed this! Close and try another.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
