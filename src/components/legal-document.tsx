import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { legalContactFromEnv } from "@/lib/legal";
import { t } from "@/lib/l10n";
import type { LegalDocument } from "@/messages/legal-pt-BR";

const legal = t("legal");

type Props = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: Props) {
  const contact = legalContactFromEnv();

  return (
    <main className="flex flex-col">
      <section className="border-b border-border bg-background-deep">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
          <Link href="/" className="inline-block">
            <Wordmark className="text-2xl text-foreground" withTrail={false} />
          </Link>

          <span className="mt-10 block text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            {document.eyebrow}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {document.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {document.lastUpdatedLabel}: {document.lastUpdated}
          </p>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
            {document.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-6 py-14">
        <nav
          aria-label={document.tocLabel}
          className="rounded-2xl border border-border bg-background-deep p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {document.tocLabel}
          </p>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {document.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground transition-colors duration-200 hover:text-brand"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-12 space-y-12">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-pretty text-base leading-7 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground marker:text-brand">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.closing?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-pretty text-base leading-7 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
              {section.id === "contato" && <ContactCard contact={contact} />}
            </section>
          ))}
        </article>

        <div className="mt-16 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-brand">
            {legal.back}
          </Link>
          <Link href="/privacidade" className="transition-colors hover:text-brand">
            {legal.privacyLink}
          </Link>
          <Link href="/termos" className="transition-colors hover:text-brand">
            {legal.termsLink}
          </Link>
          <Link href="/excluir-conta" className="transition-colors hover:text-brand">
            {legal.accountDeletionLink}
          </Link>
        </div>
      </div>
    </main>
  );
}

function ContactCard({ contact }: { contact: ReturnType<typeof legalContactFromEnv> }) {
  if (contact.email === "") {
    return (
      <p className="mt-4 rounded-2xl border border-border bg-background-deep p-6 text-sm leading-6 text-muted-foreground">
        {legal.contactPending}
      </p>
    );
  }

  return (
    <dl className="mt-4 grid gap-3 rounded-2xl border border-border bg-background-deep p-6 text-sm">
      {contact.entityName !== "" && (
        <div>
          <dt className="font-semibold text-foreground">{legal.controllerLabel}</dt>
          <dd className="text-muted-foreground">{contact.entityName}</dd>
        </div>
      )}
      {contact.entityDocument !== "" && (
        <div>
          <dt className="font-semibold text-foreground">{legal.documentLabel}</dt>
          <dd className="tabular-nums text-muted-foreground">{contact.entityDocument}</dd>
        </div>
      )}
      <div>
        <dt className="font-semibold text-foreground">{legal.contactEmailLabel}</dt>
        <dd>
          <a href={`mailto:${contact.email}`} className="text-brand hover:underline">
            {contact.email}
          </a>
        </dd>
      </div>
    </dl>
  );
}
