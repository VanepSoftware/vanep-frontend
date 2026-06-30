import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = {
  title: "Sobre"
};

export default function About() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <Wordmark className="text-5xl" />
        <span className="text-xs uppercase tracking-[0.3em] text-brand">
          Nossa história
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Sobre o Vanep
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          O Vanep nasceu para trazer clareza e segurança ao transporte escolar —
          para responsáveis, motoristas e escolas. Substituímos a informalidade
          do boca a boca, dos grupos de WhatsApp e dos contratos no papel por um
          ecossistema digital completo.
        </p>
      </div>

      <div className="h-px w-12 bg-border" />

      <div className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-widest text-brand">Missão</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Ser o sistema operacional do transporte escolar no Brasil: tornar a
          gestão transparente, confiável e sem estresse para cada família e cada
          rota.
        </p>
      </div>

      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-brand"
      >
        ← Voltar para o início
      </Link>
    </main>
  );
}
