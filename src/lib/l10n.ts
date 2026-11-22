import ptBR from "@/messages/pt-BR";

type Messages = typeof ptBR;
type Namespace = keyof Messages;

export function t<N extends Namespace>(ns: N): Messages[N] {
  return ptBR[ns];
}

type Vars = Record<string, string | number>;

/** Troca cada `{nome}` do texto pelo valor de `vars`. Um nome sem valor fica como está. */
export function interpolate(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export type PluralMessage = { one: string; other: string };

/** Escolhe a forma de `count` (em pt-BR, só 1 é singular) e preenche `{count}` e `vars`. */
export function plural(message: PluralMessage, count: number, vars: Vars = {}): string {
  return interpolate(count === 1 ? message.one : message.other, { ...vars, count });
}
