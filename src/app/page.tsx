import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { t } from "@/lib/l10n";

const landing = t("landing");

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col">
        <Hero />
        <Stats />
        <Problem />
        <Audiences />
        <Differentials />
        <HowItWorks />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background-deep/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between pl-6 pr-16">
        <Wordmark className="text-2xl" withTrail={false} />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {landing.header.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Link
          href="/about"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand"
        >
          {landing.header.aboutCta}
        </Link>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28">
        <span className="animate-rise mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs font-medium tracking-wide text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {landing.hero.badge}
        </span>

        <Wordmark className="animate-rise text-7xl sm:text-8xl md:text-9xl" />

        <h1 className="animate-rise mt-8 max-w-3xl text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl">
          {landing.hero.titleLead}{" "}
          <span className="text-brand">{landing.hero.titleHighlight}</span>.
        </h1>

        <p className="animate-rise mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
          {landing.hero.description}
        </p>

        <div className="animate-rise mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#para-quem"
            className="flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.03]"
          >
            {landing.hero.primaryCta}
          </a>
          <Link
            href="/about"
            className="flex h-12 items-center justify-center rounded-full border border-border px-8 text-sm font-medium text-foreground transition-colors hover:border-brand"
          >
            {landing.hero.secondaryCta}
          </Link>
        </div>

        <p className="animate-rise mt-6 text-xs text-muted-foreground">
          {landing.hero.note}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                              */
/* ------------------------------------------------------------------ */

function Stats() {
  return (
    <section className="border-y border-border/60 bg-background-deep/40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-6 py-px md:grid-cols-4">
        {landing.stats.map((s) => (
          <div key={s.label} className="px-4 py-8 text-center md:text-left">
            <div className="wordmark text-3xl text-brand md:text-4xl">{s.value}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Problem                                                            */
/* ------------------------------------------------------------------ */

function Problem() {
  return (
    <section id="problema" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>{landing.problem.eyebrow}</SectionEyebrow>
      <SectionTitle>{landing.problem.title}</SectionTitle>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        {landing.problem.intro}
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {landing.problem.items.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-border bg-muted/30 p-6"
          >
            <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Audiences                                                          */
/* ------------------------------------------------------------------ */

function Audiences() {
  return (
    <section id="para-quem" className="border-y border-border/60 bg-background-deep/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionEyebrow>{landing.audiences.eyebrow}</SectionEyebrow>
        <SectionTitle>{landing.audiences.title}</SectionTitle>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AudienceCard
            tag={landing.audiences.parent.tag}
            title={landing.audiences.parent.title}
            features={landing.audiences.parent.features}
          />
          <AudienceCard
            tag={landing.audiences.driver.tag}
            title={landing.audiences.driver.title}
            features={landing.audiences.driver.features}
            highlight
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  tag,
  title,
  features,
  highlight = false
}: {
  tag: string;
  title: string;
  features: readonly string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-8 ${
        highlight
          ? "border-brand/40 bg-brand/5"
          : "border-border bg-muted/30"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-brand">
        {tag}
      </span>
      <h3 className="mt-3 text-2xl font-semibold text-foreground">{title}</h3>
      <ul className="mt-6 flex flex-col gap-4">
        {features.map((f) => (
          <li key={f} className="flex gap-3 text-sm leading-6 text-muted-foreground">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Differentials                                                      */
/* ------------------------------------------------------------------ */

function Differentials() {
  const { phases } = landing.differentials;
  return (
    <section id="diferenciais" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>{landing.differentials.eyebrow}</SectionEyebrow>
      <SectionTitle>{landing.differentials.title}</SectionTitle>

      {/* Phase checklist */}
      <div className="mt-12 rounded-3xl border border-border bg-muted/30 p-8">
        <p className="text-sm font-medium text-foreground">
          {landing.differentials.checklistTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {landing.differentials.checklistSubtitle}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase, i) => (
            <div key={phase.n} className="relative">
              <div className="rounded-2xl border border-brand/30 bg-background-deep/50 p-5">
                <span className="wordmark text-2xl text-brand">{phase.n}</span>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {phase.label}
                </p>
              </div>
              {i < phases.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-brand lg:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {landing.differentials.items.map((d) => (
          <div key={d.title} className="rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="text-base font-semibold text-foreground">{d.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{d.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-border/60 bg-background-deep/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionEyebrow>{landing.howItWorks.eyebrow}</SectionEyebrow>
        <SectionTitle>{landing.howItWorks.title}</SectionTitle>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {landing.howItWorks.steps.map((step) => (
            <div key={step.n} className="rounded-2xl border border-border bg-muted/30 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground">
                {step.n}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-brand/5 px-8 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_-20%,rgba(134,207,230,0.25),transparent)]" />
        <div className="relative">
          <Wordmark className="text-4xl" withTrail={false} />
          <h2 className="mt-6 text-balance text-2xl font-semibold text-foreground sm:text-3xl">
            {landing.finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            {landing.finalCta.description}
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.03]"
          >
            {landing.finalCta.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */

function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
        <Wordmark className="text-xl" withTrail={false} />
        <p>{landing.footer.tagline}</p>
        <p>© {new Date().getFullYear()} {landing.footer.copyright}</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold leading-tight text-foreground md:text-4xl">
      {children}
    </h2>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
