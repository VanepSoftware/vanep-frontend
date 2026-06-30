import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { t } from "@/lib/l10n";

const about = t("about");

export const metadata: Metadata = {
  title: about.metaTitle
};

export default function About() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <Wordmark className="text-5xl" />
        <span className="text-xs uppercase tracking-[0.3em] text-brand">
          {about.eyebrow}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {about.title}
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          {about.intro}
        </p>
      </div>

      <div className="h-px w-12 bg-border" />

      <div className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-widest text-brand">
          {about.missionLabel}
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          {about.mission}
        </p>
      </div>

      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-brand"
      >
        {about.back}
      </Link>
    </main>
  );
}
