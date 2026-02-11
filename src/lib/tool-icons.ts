// Maps common AI tool names to their icon URLs and fallback emojis
// Icons sourced from public CDN / favicon URLs

interface ToolIcon {
  url?: string;
  emoji: string;
  color: string; // brand accent color for the pill bg
}

// Normalized tool name → icon mapping
const TOOL_ICONS: Record<string, ToolIcon> = {
  // AI Assistants
  chatgpt: {
    url: "https://cdn.oaistatic.com/assets/favicon-miwirzcx.ico",
    emoji: "🤖",
    color: "#10a37f",
  },
  "gpt-4": {
    url: "https://cdn.oaistatic.com/assets/favicon-miwirzcx.ico",
    emoji: "🤖",
    color: "#10a37f",
  },
  "gpt-4o": {
    url: "https://cdn.oaistatic.com/assets/favicon-miwirzcx.ico",
    emoji: "🤖",
    color: "#10a37f",
  },
  openai: {
    url: "https://cdn.oaistatic.com/assets/favicon-miwirzcx.ico",
    emoji: "🤖",
    color: "#10a37f",
  },
  claude: {
    emoji: "🧠",
    color: "#d97757",
  },
  anthropic: {
    emoji: "🧠",
    color: "#d97757",
  },
  gemini: {
    emoji: "✨",
    color: "#4285f4",
  },
  "google gemini": {
    emoji: "✨",
    color: "#4285f4",
  },
  bard: {
    emoji: "✨",
    color: "#4285f4",
  },
  perplexity: {
    emoji: "🔍",
    color: "#20808d",
  },
  copilot: {
    emoji: "🚀",
    color: "#0078d4",
  },
  "github copilot": {
    emoji: "🚀",
    color: "#0078d4",
  },
  "microsoft copilot": {
    emoji: "🚀",
    color: "#0078d4",
  },
  grok: {
    emoji: "⚡",
    color: "#1d9bf0",
  },
  llama: {
    emoji: "🦙",
    color: "#0668e1",
  },
  meta: {
    emoji: "🦙",
    color: "#0668e1",
  },
  mistral: {
    emoji: "🌬️",
    color: "#ff7000",
  },
  deepseek: {
    emoji: "🐋",
    color: "#4d6bfe",
  },

  // Coding tools
  cursor: {
    emoji: "⌨️",
    color: "#8b5cf6",
  },
  "vs code": {
    emoji: "💻",
    color: "#007acc",
  },
  vscode: {
    emoji: "💻",
    color: "#007acc",
  },
  replit: {
    emoji: "🔶",
    color: "#f26207",
  },
  windsurf: {
    emoji: "🏄",
    color: "#00b4d8",
  },
  codeium: {
    emoji: "💚",
    color: "#09b6a2",
  },
  tabnine: {
    emoji: "🔮",
    color: "#6c5ce7",
  },
  "v0": {
    emoji: "▲",
    color: "#000000",
  },
  bolt: {
    emoji: "⚡",
    color: "#f5a623",
  },
  "bolt.new": {
    emoji: "⚡",
    color: "#f5a623",
  },
  lovable: {
    emoji: "💜",
    color: "#7c3aed",
  },

  // Image / Design
  midjourney: {
    emoji: "🎨",
    color: "#1c1c1c",
  },
  "dall-e": {
    emoji: "🖼️",
    color: "#10a37f",
  },
  "dalle": {
    emoji: "🖼️",
    color: "#10a37f",
  },
  "stable diffusion": {
    emoji: "🎭",
    color: "#a855f7",
  },
  flux: {
    emoji: "🌊",
    color: "#1c1c1c",
  },
  ideogram: {
    emoji: "🖌️",
    color: "#ff6b35",
  },
  leonardo: {
    emoji: "🎨",
    color: "#8b5cf6",
  },
  canva: {
    emoji: "🎯",
    color: "#7d2ae8",
  },
  figma: {
    emoji: "🖼️",
    color: "#f24e1e",
  },

  // Voice / Audio / Video
  elevenlabs: {
    emoji: "🎙️",
    color: "#1c1c1c",
  },
  "eleven labs": {
    emoji: "🎙️",
    color: "#1c1c1c",
  },
  descript: {
    emoji: "🎬",
    color: "#00c2ff",
  },
  runway: {
    emoji: "🎥",
    color: "#0f0f0f",
  },
  suno: {
    emoji: "🎵",
    color: "#1c1c1c",
  },
  udio: {
    emoji: "🎶",
    color: "#6366f1",
  },
  heygen: {
    emoji: "📹",
    color: "#5046e5",
  },

  // Productivity / Writing
  notion: {
    emoji: "📝",
    color: "#1c1c1c",
  },
  "notion ai": {
    emoji: "📝",
    color: "#1c1c1c",
  },
  jasper: {
    emoji: "✍️",
    color: "#ff5733",
  },
  grammarly: {
    emoji: "📖",
    color: "#15c39a",
  },
  otter: {
    emoji: "🦦",
    color: "#3b82f6",
  },
  "otter.ai": {
    emoji: "🦦",
    color: "#3b82f6",
  },
  zapier: {
    emoji: "⚡",
    color: "#ff4a00",
  },
  make: {
    emoji: "🔗",
    color: "#6d00cc",
  },
  n8n: {
    emoji: "🔗",
    color: "#ea4b71",
  },
  fireflies: {
    emoji: "🔥",
    color: "#6c5ce7",
  },
  "fireflies.ai": {
    emoji: "🔥",
    color: "#6c5ce7",
  },

  // Data / Research
  "julius ai": {
    emoji: "📊",
    color: "#3b82f6",
  },
  julius: {
    emoji: "📊",
    color: "#3b82f6",
  },
  "langchain": {
    emoji: "🔗",
    color: "#1c3c3c",
  },
  "hugging face": {
    emoji: "🤗",
    color: "#ffbd45",
  },
  huggingface: {
    emoji: "🤗",
    color: "#ffbd45",
  },

  // Misc AI
  "synthesia": {
    emoji: "🎬",
    color: "#5046e5",
  },
  "pika": {
    emoji: "🎥",
    color: "#1c1c1c",
  },
  "gamma": {
    emoji: "📊",
    color: "#8b5cf6",
  },
  "gamma.app": {
    emoji: "📊",
    color: "#8b5cf6",
  },
  "beautiful.ai": {
    emoji: "📊",
    color: "#3b82f6",
  },
  "tome": {
    emoji: "📘",
    color: "#1c1c1c",
  },
};

// Default icon for tools we don't recognize
const DEFAULT_ICON: ToolIcon = {
  emoji: "🔧",
  color: "#6b7280",
};

/**
 * Look up an icon for a tool name. Case-insensitive, fuzzy matching.
 */
export function getToolIcon(toolName: string): ToolIcon {
  const normalized = toolName.toLowerCase().trim();

  // Exact match
  if (TOOL_ICONS[normalized]) {
    return TOOL_ICONS[normalized];
  }

  // Try matching with common variations
  // e.g. "ChatGPT 4o" → "chatgpt", "Claude 3.5 Sonnet" → "claude"
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }

  return DEFAULT_ICON;
}

/**
 * All recognized tool names (for autocomplete suggestions)
 */
export const KNOWN_TOOLS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Perplexity",
  "Copilot",
  "Grok",
  "Cursor",
  "V0",
  "Bolt.new",
  "Lovable",
  "Replit",
  "Windsurf",
  "Midjourney",
  "DALL-E",
  "Stable Diffusion",
  "Flux",
  "Ideogram",
  "ElevenLabs",
  "Runway",
  "Suno",
  "HeyGen",
  "Notion AI",
  "Jasper",
  "Grammarly",
  "Zapier",
  "Make",
  "n8n",
  "Figma",
  "Canva",
  "Descript",
  "Otter.ai",
  "Fireflies.ai",
  "Gamma",
  "LangChain",
  "Hugging Face",
  "Mistral",
  "DeepSeek",
  "Llama",
  "Pika",
  "Synthesia",
];
