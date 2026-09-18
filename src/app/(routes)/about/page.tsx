import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { StoreBadges } from "@/components/store-badges";
import { Wordmark } from "@/components/wordmark";
import { t } from "@/lib/l10n";
import vanEscolar from "@/assets/van-escolar.webp";

const about = t("about");
const landing = t("landing");

export const metadata: Metadata = {
  title: about.metaTitle
};

export default function About() {
  return (
    <main className="flex flex-col">
      <section className="border-b border-border bg-background-deep">
        <div className="mx-auto w-full max-w-4xl px-6 py-20 md:py-24">
          <Link href="/" className="inline-block">
            <Wordmark className="text-2xl text-foreground" withTrail={false} />
          </Link>

          <span className="mt-10 block text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            {about.eyebrow}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {about.title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
            {about.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-20">
        <div className="overflow-hidden rounded-2xl border border-border">
          <Image
            src={vanEscolar}
            alt={landing.hero.imageAlt}
            sizes="(min-width: 896px) 832px, 100vw"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand">
              {about.missionLabel}
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{about.mission}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand">
              {about.visionLabel}
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{about.vision}</p>
          </div>
        </div>

        <h2 className="mt-16 text-xs font-semibold uppercase tracking-widest text-brand">
          {about.valuesLabel}
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {about.values.map((value) => (
            <div key={value.title} className="rounded-2xl border border-border bg-background p-6">
              <h3 className="text-base font-semibold text-foreground">{value.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{value.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-background-deep p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {landing.hero.storesSoon}
          </p>
          <StoreBadges className="mt-4" height="h-11" />
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
        >
          {about.back}
        </Link>
      </section>
    </main>
  );
}
