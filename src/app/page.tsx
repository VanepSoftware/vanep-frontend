import Image from "next/image";
import Link from "next/link";
import { AdminButton } from "@/components/admin-button";
import { ScrollToTopLink } from "@/components/scroll-to-top-link";
import { StoreBadges } from "@/components/store-badges";
import { Wordmark } from "@/components/wordmark";
import { t } from "@/lib/l10n";
import { team } from "@/lib/team";
import criancasEmbarcando from "@/assets/criancas-embarcando.webp";
import vanEscolar from "@/assets/van-escolar.webp";

const landing = t("landing");

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col">
        <Hero />
        <Stats />
        <Problem />
        <Search />
        <Audiences />
        <PhotoBand />
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 pl-6 pr-20">
        <ScrollToTopLink className="select-none" ariaLabel="Voltar ao início">
          <Wordmark className="text-2xl text-foreground" withTrail={false} />
        </ScrollToTopLink>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          {landing.header.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative py-1 transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand after:transition-transform after:duration-200 hover:text-brand hover:after:scale-x-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AdminButton />
          <Link
            href="/about"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.97] sm:block"
          >
            {landing.header.aboutCta}
          </Link>
          <a
            href="#baixar"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm transition-all duration-200 hover:bg-brand-strong hover:shadow-md active:scale-[0.96] active:shadow-sm"
          >
            {landing.header.appCta}
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-background-deep to-background">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-20 lg:pt-24">
        <div className="animate-rise mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-background px-3 py-1.5 text-xs font-semibold tracking-wide text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {landing.hero.badge}
          </span>

          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {landing.hero.titleLead}{" "}
            <span className="text-brand">{landing.hero.titleHighlight}</span>{" "}
            {landing.hero.titleTail}
          </h1>

          <p className="mt-6 text-pretty text-base leading-7 text-muted-foreground md:text-lg">
            {landing.hero.description}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-7 text-sm font-semibold text-brand-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-lg active:translate-y-0 active:scale-[0.97] active:shadow-sm"
            >
              {landing.hero.primaryCta}
            </a>
            <Link
              href="/about"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border-strong bg-background px-7 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:bg-brand-soft hover:text-brand hover:shadow-md active:translate-y-0 active:scale-[0.97] active:shadow-none"
            >
              {landing.hero.secondaryCta}
            </Link>
          </div>

          <StoreBadges className="mt-8 justify-center" height="h-10" />
        </div>

        <div className="animate-rise relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-border shadow-[0_24px_60px_-28px_rgba(13,27,42,0.45)]">
            <Image
              src={vanEscolar}
              alt={landing.hero.imageAlt}
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="h-auto w-full"
            />
          </div>

          <LiveTrackingCard />
        </div>
      </div>
    </section>
  );
}

/** Cartão flutuante que ilustra a notificação de etapa no app. */
function LiveTrackingCard() {
  const { liveCard } = landing.hero;
  return (
    <div className="absolute -bottom-8 right-4 w-[17rem] rounded-2xl border border-border bg-background p-4 shadow-[0_16px_40px_-18px_rgba(13,27,42,0.4)] sm:right-6 lg:-right-10 lg:bottom-8">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft">
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {liveCard.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{liveCard.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-soft px-3 py-2.5">
        <span className="text-xs font-semibold text-brand">{liveCard.step}</span>
        <span className="text-xs font-semibold tabular-nums text-brand">
          {liveCard.time}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5" aria-hidden>
        {landing.photoBand.phases.map((phase, i) => (
          <span
            key={phase.n}
            className={`h-1.5 flex-1 rounded-full ${i < 2 ? "bg-brand" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                              */
/* ------------------------------------------------------------------ */

function Stats() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-14 lg:grid-cols-4">
        {landing.stats.map((s) => (
          <div key={s.label}>
            <div className="wordmark text-3xl text-brand md:text-4xl">{s.value}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Problem — antes x depois                                            */
/* ------------------------------------------------------------------ */

function Problem() {
  return (
    <section id="problema" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>{landing.problem.eyebrow}</SectionEyebrow>
      <SectionTitle>{landing.problem.title}</SectionTitle>
      <SectionLead>{landing.problem.intro}</SectionLead>

      <div className="mt-12 overflow-hidden rounded-2xl border border-border">
        <div className="hidden grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-border bg-background-deep md:grid">
          <div className="px-6 py-3" />
          <div className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {landing.problem.beforeLabel}
          </div>
          <div className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-brand">
            {landing.problem.afterLabel}
          </div>
        </div>

        {landing.problem.items.map((item) => (
          <div
            key={item.title}
            className="grid gap-3 border-b border-border px-6 py-6 transition-colors duration-200 last:border-b-0 hover:bg-background-deep md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-6"
          >
            <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
            <p className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <CrossIcon />
              <span>{item.before}</span>
            </p>
            <p className="flex gap-3 text-sm leading-6 text-foreground">
              <CheckIcon />
              <span>{item.after}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Busca de motoristas                                                 */
/* ------------------------------------------------------------------ */

function Search() {
  const { search } = landing;
  return (
    <section id="buscar" className="border-y border-border bg-background-deep">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionEyebrow>{search.eyebrow}</SectionEyebrow>
        <SectionTitle>{search.title}</SectionTitle>
        <SectionLead>{search.subtitle}</SectionLead>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
          <ul className="flex flex-col gap-8">
            {search.features.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-soft">
                  <CheckIcon className="h-4 w-4 text-brand" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <SearchResultsMock />
        </div>
      </div>
    </section>
  );
}

/** Amostra de como a lista de motoristas aparece no app. */
function SearchResultsMock() {
  const { search } = landing;
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-[0_18px_44px_-28px_rgba(13,27,42,0.4)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {search.resultsHint}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{search.resultsTitle}</p>

      <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand">
        <SearchIcon />
        {search.resultsFilter}
      </span>

      <ul className="mt-5 flex flex-col gap-3">
        {search.results.map((driver) => (
          <li
            key={driver.name}
            className="group rounded-xl border border-border p-4 transition-all duration-200 hover:border-brand/40 hover:bg-brand-soft/40 hover:shadow-[0_12px_28px_-20px_rgba(13,27,42,0.4)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{driver.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{driver.meta}</p>
              </div>
              <span className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
                <StarIcon />
                {driver.rating}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckIcon className="h-3.5 w-3.5 text-success" />
                {search.verified}
              </span>
              <span className="text-xs text-muted-foreground">{driver.reviews}</span>
            </div>

            <span className="mt-3 block rounded-lg bg-brand px-3 py-2 text-center text-xs font-semibold text-brand-foreground transition-colors duration-200 group-hover:bg-brand-strong">
              {search.action}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audiences                                                          */
/* ------------------------------------------------------------------ */

function Audiences() {
  return (
    <section id="para-quem" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>{landing.audiences.eyebrow}</SectionEyebrow>
      <SectionTitle>{landing.audiences.title}</SectionTitle>
      <SectionLead>{landing.audiences.subtitle}</SectionLead>

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
      className={`rounded-2xl border bg-background p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_-32px_rgba(11,94,169,0.55)] ${
        highlight
          ? "border-brand/35 shadow-[0_20px_50px_-32px_rgba(11,94,169,0.6)] hover:border-brand/60"
          : "border-border hover:border-brand/40"
      }`}
    >
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
          highlight ? "bg-brand text-brand-foreground" : "bg-brand-soft text-brand"
        }`}
      >
        {tag}
      </span>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
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
  return (
    <section id="diferenciais" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>{landing.differentials.eyebrow}</SectionEyebrow>
      <SectionTitle>{landing.differentials.title}</SectionTitle>
      <SectionLead>{landing.differentials.subtitle}</SectionLead>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {landing.differentials.items.map((d, i) => {
          const Icon = differentialIcons[i] ?? differentialIcons[0];
          return (
            <div
              key={d.title}
              className="flex gap-5 rounded-2xl border border-border bg-background p-7 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_18px_40px_-24px_rgba(13,27,42,0.38)]"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{d.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{d.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Faixa com foto — o embarque                                         */
/* ------------------------------------------------------------------ */

function PhotoBand() {
  const { photoBand } = landing;
  return (
    <section className="border-y border-border bg-background-deep">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>{photoBand.eyebrow}</SectionEyebrow>
          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            {photoBand.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{photoBand.body}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-border shadow-[0_24px_60px_-32px_rgba(13,27,42,0.45)]">
          <Image
            src={criancasEmbarcando}
            alt={photoBand.imageAlt}
            sizes="(min-width: 1152px) 1088px, 100vw"
            className="h-auto w-full"
          />
        </div>

        <DayTimeline />
      </div>
    </section>
  );
}

/**
 * As quatro etapas do trajeto como uma linha do tempo conectada — e não como
 * cards soltos, para deixar claro que é uma sequência e não uma lista.
 */
function DayTimeline() {
  const { photoBand } = landing;
  return (
    <div className="mt-12 rounded-2xl border border-border bg-background px-8 py-10">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{photoBand.stepsLabel}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{photoBand.stepsHint}</p>
      </div>

      <ol className="relative mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* Trilho que liga as quatro etapas */}
        <span
          aria-hidden
          className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-0.5 rounded-full bg-gradient-to-r from-brand via-accent to-border-strong lg:block"
        />

        {photoBand.phases.map((phase) => (
          <li
            key={phase.n}
            className="group relative flex flex-col items-center text-center lg:px-2"
          >
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand bg-background text-sm font-bold text-brand transition-all duration-200 group-hover:scale-110 group-hover:bg-brand group-hover:text-brand-foreground">
              {phase.n}
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">{phase.label}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="mx-auto w-full max-w-6xl border-t border-border px-6 py-24"
    >
      <SectionEyebrow>{landing.howItWorks.eyebrow}</SectionEyebrow>
      <SectionTitle>{landing.howItWorks.title}</SectionTitle>
      <SectionLead>{landing.howItWorks.subtitle}</SectionLead>

      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {landing.howItWorks.steps.map((step) => (
          <li key={step.n} className="rounded-2xl border border-border bg-background-deep p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:bg-background hover:shadow-[0_18px_40px_-24px_rgba(13,27,42,0.38)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
              {step.n}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA — bloco de download                                      */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section id="baixar" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="on-brand relative isolate overflow-hidden rounded-3xl bg-brand px-8 py-20 text-center text-brand-foreground sm:px-12">
        {/* Brilho que respira devagar atrás do conteúdo */}
        <div
          aria-hidden
          className="animate-glow pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(760px_380px_at_50%_-8%,rgba(255,255,255,0.28),transparent_68%)]"
        />
        {/* Malha de pontos discreta, para o azul não ficar chapado */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.95)_1px,transparent_1px)] [background-size:22px_22px]"
        />

        <div className="relative">
          <Wordmark className="text-4xl sm:text-5xl" withTrail={false} />

          <span className="mt-8 block text-xs font-semibold uppercase tracking-[0.25em] text-brand-foreground/70">
            {landing.finalCta.eyebrow}
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {landing.finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-foreground/80">
            {landing.finalCta.description}
          </p>

          <StoreBadges className="mt-10 justify-center" height="h-12" />

          <Link
            href="/about"
            className="mt-8 inline-flex rounded-lg px-2 py-1 text-sm font-semibold text-brand-foreground underline-offset-4 transition-opacity hover:underline hover:opacity-80 active:opacity-60"
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
  // A URL vem do ambiente (CONSTITUTION.md §1). Sem ela, o link não é exibido.
  const instagramUrl = process.env.VANEP_INSTAGRAM_URL ?? "";

  return (
    <footer className="border-t border-border bg-background-deep">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Wordmark className="text-lg text-foreground" withTrail={false} />
            <span aria-hidden className="hidden h-4 w-px bg-border-strong sm:block" />
            <p className="hidden text-xs text-muted-foreground sm:block">
              {landing.footer.tagline}
            </p>
          </div>

          <nav
            aria-label={landing.footer.navLabel}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {landing.header.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors duration-200 hover:text-brand"
              >
                {item.label}
              </a>
            ))}
            <Link href="/about" className="transition-colors duration-200 hover:text-brand">
              {landing.header.aboutCta}
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <TeamDisclosure />

          <div className="mt-5 flex flex-col-reverse items-start gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {landing.footer.copyright}
            </p>

            {instagramUrl !== "" && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={landing.footer.instagramLabel}
                className="inline-flex items-center gap-2 rounded-lg font-medium transition-colors duration-200 hover:text-brand"
              >
                <InstagramIcon />
                {landing.footer.instagramHandle}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Lista da equipe, fechada por padrão para o rodapé continuar curto.
 * Usa <details> nativo: abre sem JavaScript e já é acessível por teclado.
 */
function TeamDisclosure() {
  // A base do GitHub vem do ambiente (CONSTITUTION.md §1).
  const githubBase = process.env.VANEP_GITHUB_BASE_URL ?? "";

  return (
    <details className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors duration-200 hover:text-brand [&::-webkit-details-marker]:hidden">
        <ChevronIcon />
        {landing.footer.teamLabel}
        <span className="font-normal normal-case tracking-normal text-muted-foreground/70 group-open:hidden">
          · {team.length}
        </span>
      </summary>

      <p className="mt-3 text-xs text-muted-foreground">{landing.footer.teamHint}</p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((member) => {
          const content = (
            <>
              <Image
                src={member.avatar}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 rounded-full bg-muted object-cover ring-1 ring-border"
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {member.name}
                </span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">
                  @{member.login}
                </span>
              </span>
            </>
          );

          return (
            <li key={member.login}>
              {githubBase === "" ? (
                <span className="flex items-center gap-3 rounded-lg px-2 py-1.5">{content}</span>
              ) : (
                <a
                  href={`${githubBase}/${member.login}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={landing.footer.teamProfileLabel.replace("{name}", member.name)}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-muted"
                >
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-90"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
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
    <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
      {children}
    </h2>
  );
}

function SectionLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{children}</p>
  );
}

function CheckIcon({ className = "mt-1 h-4 w-4 text-brand" }: { className?: string }) {
  return (
    <svg
      className={`flex-shrink-0 ${className}`}
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

/** Um ícone para cada diferencial, na ordem em que aparecem nas mensagens. */
const differentialIcons = [HandsFreeIcon, DocumentCheckIcon, CalendarOffIcon, VanIcon];

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Celular riscado: o app age sozinho durante a rota. */
function HandsFreeIcon() {
  return (
    <IconBase>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
      <path d="m3.5 3.5 17 17" />
    </IconBase>
  );
}

/** Documento com visto: documentação em dia. */
function DocumentCheckIcon() {
  return (
    <IconBase>
      <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14 2.5Z" />
      <path d="M14 2.5v5h5" />
      <path d="m9 14.5 2 2 4-4" />
    </IconBase>
  );
}

/** Dia riscado na agenda: avisar que o aluno não vai hoje. */
function CalendarOffIcon() {
  return (
    <IconBase>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m10 14 4 4M14 14l-4 4" />
    </IconBase>
  );
}

/** Van: foco exclusivo no transporte escolar. */
function VanIcon() {
  return (
    <IconBase>
      <path d="M2 16.5v-7a2 2 0 0 1 2-2h9v9" />
      <path d="M13 10.5h4l3 3.5v2.5h-2" />
      <circle cx="7.5" cy="16.5" r="2" />
      <circle cx="17" cy="16.5" r="2" />
      <path d="M9.5 16.5H15" />
    </IconBase>
  );
}

function SearchIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0 text-highlight"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 3.5 2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8L6.8 20l1-6L3.5 9.8l5.9-.8L12 3.5Z" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      className="mt-1 h-4 w-4 flex-shrink-0 text-border-strong"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
