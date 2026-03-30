import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About"
};

export default function About() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-10 max-w-xl">
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs tracking-[0.3em] uppercase text-zinc-400">Our story</span>
          <h1 className="text-5xl font-bold tracking-tight">About Vanep</h1>
          <p className="text-base leading-7 text-zinc-500">We built Vanep to bring clarity and safety to school van transportation — for parents, drivers, and schools alike.</p>
        </div>

        <div className="w-12 h-px bg-zinc-200" />

        <div className="flex flex-col gap-2">
          <h2 className="text-xs tracking-widest uppercase text-zinc-400">Mission</h2>
          <p className="text-base leading-7 text-zinc-500">To make school van management stress-free, transparent, and reliable for every family and every route.</p>
        </div>

        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-900 transition-colors">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
