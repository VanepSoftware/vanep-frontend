import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

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
          <a href="#problema" className="transition-colors hover:text-foreground">
            O problema
          </a>
          <a href="#para-quem" className="transition-colors hover:text-foreground">
            Para quem
          </a>
          <a href="#diferenciais" className="transition-colors hover:text-foreground">
            Diferenciais
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
        </nav>
        <Link
          href="/about"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand"
        >
          Sobre
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
          Plataforma de transporte escolar inteligente
        </span>

        <Wordmark className="animate-rise text-7xl sm:text-8xl md:text-9xl" />

        <h1 className="animate-rise mt-8 max-w-3xl text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl">
          O sistema operacional do{" "}
          <span className="text-brand">transporte escolar</span>.
        </h1>

        <p className="animate-rise mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
          O Vanep conecta responsáveis a transportadores escolares verificados —
          com contratos digitais, rastreamento em tempo real e notificações a
          cada etapa do trajeto. Tranquilidade para a família, gestão completa
          para o motorista.
        </p>

        <div className="animate-rise mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#para-quem"
            className="flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.03]"
          >
            Conhecer a plataforma
          </a>
          <Link
            href="/about"
            className="flex h-12 items-center justify-center rounded-full border border-border px-8 text-sm font-medium text-foreground transition-colors hover:border-brand"
          >
            Sobre o projeto
          </Link>
        </div>

        <p className="animate-rise mt-6 text-xs text-muted-foreground">
          Em breve para iOS e Android · Painel web para a equipe Vanep
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                              */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: "4 fases", label: "de acompanhamento por aluno, em tempo real" },
  { value: "100%", label: "dos contratos digitais e armazenados na plataforma" },
  { value: "1º mês", label: "grátis para o motorista, sem fricção de adoção" },
  { value: "B2C / B2B2C", label: "responsáveis, motoristas e escolas em um só lugar" }
];

function Stats() {
  return (
    <section className="border-y border-border/60 bg-background-deep/40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-6 py-px md:grid-cols-4">
        {STATS.map((s) => (
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

const PROBLEMS = [
  {
    title: "Contratação no boca a boca",
    body: "Responsáveis contratam por indicação, sem verificação de idoneidade ou documentação — e sem garantias mínimas de segurança."
  },
  {
    title: "Sem rastreamento",
    body: "Ninguém sabe onde a van está. A comunicação acontece em grupos de WhatsApp, sem histórico nem prova de entrega."
  },
  {
    title: "Contratos físicos",
    body: "Acordos no papel, sem padronização e sem histórico digital — disputas acontecem sem nenhuma evidência."
  },
  {
    title: "Cobrança manual",
    body: "Pagamentos em dinheiro ou transferência direta, sem instrumentos de controle de inadimplência para o motorista."
  }
];

function Problem() {
  return (
    <section id="problema" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>O problema</SectionEyebrow>
      <SectionTitle>
        O transporte escolar ainda opera na informalidade.
      </SectionTitle>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Um mercado pulverizado, com centenas de milhares de motoristas autônomos,
        sem ferramentas de rastreamento, gestão ou formalização. O Vanep substitui
        essa informalidade por um ecossistema digital completo para os dois lados.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((p) => (
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

const PARENT_FEATURES = [
  "Encontre motoristas verificados, com documentação validada e avaliações reais.",
  "Contrate com respaldo formal: contrato digital com data, versão e partes registradas.",
  "Acompanhe a van no mapa em tempo real durante toda a rota.",
  "Receba um push a cada etapa: embarque, chegada na escola, volta e chegada em casa.",
  "Pague de forma centralizada, com histórico completo.",
  "Cancele a presença com um toque — o aluno sai da rota e o motorista é avisado."
];

const DRIVER_FEATURES = [
  "Fique visível na busca por rota e escola para todos os responsáveis da plataforma.",
  "Gerencie contratos, alunos, turnos e horários em um único painel.",
  "Reduza a inadimplência com cobrança recorrente gerenciada pela plataforma.",
  "Otimize a rota e exporte as paradas direto para o Waze ou Google Maps.",
  "Controle seus documentos com alertas antecipados de vencimento.",
  "Acompanhe o financeiro: total a receber, cobranças e comissões automáticas."
];

function Audiences() {
  return (
    <section id="para-quem" className="border-y border-border/60 bg-background-deep/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionEyebrow>Para quem</SectionEyebrow>
        <SectionTitle>Dois lados do mercado, uma só plataforma.</SectionTitle>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AudienceCard
            tag="Para o responsável"
            title="Tranquilidade do embarque à chegada"
            features={PARENT_FEATURES}
          />
          <AudienceCard
            tag="Para o motorista"
            title="Um ERP completo para a sua operação"
            features={DRIVER_FEATURES}
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
  features: string[];
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

const PHASES = [
  { n: "01", label: "Embarque em casa" },
  { n: "02", label: "Chegada na escola" },
  { n: "03", label: "Embarque na volta" },
  { n: "04", label: "Chegada em casa" }
];

const DIFFERENTIALS = [
  {
    title: "Status do motorista automático",
    body: "O status é derivado do próprio fluxo da operação — sem input manual durante a rota."
  },
  {
    title: "Gestão documental com alertas",
    body: "Avisos antecipados de vencimento, vinculados ao bloqueio de novas contratações."
  },
  {
    title: "Modelo alinhado ao sucesso",
    body: "A comissão só é cobrada enquanto há contrato ativo: a Vanep ganha quando o motorista ganha."
  },
  {
    title: "Foco exclusivo no escolar",
    body: "Nada de generalizar para outros mercados. Cada detalhe é pensado para o transporte escolar."
  }
];

function Differentials() {
  return (
    <section id="diferenciais" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionEyebrow>Diferenciais</SectionEyebrow>
      <SectionTitle>Pensado para o dia a dia da rota.</SectionTitle>

      {/* Phase checklist */}
      <div className="mt-12 rounded-3xl border border-border bg-muted/30 p-8">
        <p className="text-sm font-medium text-foreground">
          Checklist de rota com 4 fases por aluno
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada fase dispara uma notificação em tempo real para o responsável.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((phase, i) => (
            <div key={phase.n} className="relative">
              <div className="rounded-2xl border border-brand/30 bg-background-deep/50 p-5">
                <span className="wordmark text-2xl text-brand">{phase.n}</span>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {phase.label}
                </p>
              </div>
              {i < PHASES.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-brand lg:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DIFFERENTIALS.map((d) => (
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

const STEPS = [
  {
    n: "1",
    title: "Descubra",
    body: "O responsável busca motoristas verificados por rota ou escola e compara perfis e avaliações."
  },
  {
    n: "2",
    title: "Negocie e contrate",
    body: "Propostas com aceite, recusa ou contraproposta geram um contrato digital formal."
  },
  {
    n: "3",
    title: "Acompanhe",
    body: "Rastreamento em tempo real e notificações a cada uma das quatro fases do trajeto."
  },
  {
    n: "4",
    title: "Pague e gerencie",
    body: "Cobrança recorrente centralizada, com gestão financeira e documental para o motorista."
  }
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-border/60 bg-background-deep/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionEyebrow>Como funciona</SectionEyebrow>
        <SectionTitle>Da descoberta à operação diária.</SectionTitle>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
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
            O transporte escolar do seu filho, finalmente digital.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            Estamos chegando. Em breve disponível para iOS e Android — segurança
            para as famílias e gestão completa para os motoristas.
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.03]"
          >
            Conheça a história
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
        <p>Van + App · Transporte escolar inteligente</p>
        <p>© {new Date().getFullYear()} Vanep</p>
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
