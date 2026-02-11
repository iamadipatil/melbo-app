import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center text-3xl mb-6">
        🤔
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        This Melbo doesn&apos;t exist yet
      </h1>
      <p className="text-sm text-text-muted mb-8 max-w-sm">
        This username hasn&apos;t been claimed. Want it?
      </p>
      <Link
        href="/"
        className="font-sans text-sm font-semibold py-3 px-6 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,78,0.25)]"
      >
        Claim your Melbo →
      </Link>
    </div>
  );
}
