import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs tracking-[0.3em] uppercase text-zinc-400">Introducing</span>
          <h1 className="text-6xl font-bold tracking-tight">Vanep</h1>
          <p className="max-w-sm text-base leading-7 text-zinc-500">
            School van management, simplified.
            <br />
            Peace of mind for parents, drivers, and schools.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link href="/about" className="flex items-center h-12 px-8 rounded-full bg-zinc-900 text-white text-sm font-medium hover:opacity-80 transition-opacity">
            About us
          </Link>
          <span className="text-xs text-zinc-400">Available soon on iOS and Android</span>
        </div>
      </div>
    </main>
  );
}
