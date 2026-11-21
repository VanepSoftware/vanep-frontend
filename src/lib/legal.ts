export type LegalContact = {
  email: string;
  entityName: string;
  entityDocument: string;
};

type Env = Record<string, string | undefined>;

/**
 * Contato do controlador exibido nas páginas legais. Vem do ambiente
 * (CONSTITUTION.md §1); valores ausentes viram string vazia e a página
 * mostra o aviso de contato pendente em vez de inventar um endereço.
 */
export function legalContactFromEnv(env: Env = process.env): LegalContact {
  return {
    email: (env.VANEP_LEGAL_CONTACT_EMAIL ?? "").trim(),
    entityName: (env.VANEP_LEGAL_ENTITY_NAME ?? "").trim(),
    entityDocument: (env.VANEP_LEGAL_ENTITY_DOCUMENT ?? "").trim(),
  };
}
