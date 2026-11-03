export type EditableClient = {
  name: string | null;
  email: string | null;
  rating: number | null;
  active: boolean;
};

export type ClientEditForm = {
  name: string;
  email: string;
  rating: string;
  active: boolean;
};

export type ClientPatch = Partial<EditableClient>;

export class InvalidRatingError extends Error {}

export function toEditForm(client: EditableClient): ClientEditForm {
  return {
    name: client.name ?? "",
    email: client.email ?? "",
    rating: client.rating != null ? String(client.rating) : "",
    active: client.active,
  };
}

function text(value: string): string | null {
  return value.trim() || null;
}

function rating(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) throw new InvalidRatingError();
  return parsed;
}

/**
 * O backend usa JsonNullable: omitir um campo o deixa intacto, mandar null o limpa.
 * Enviar o objeto inteiro a cada save sobrescreveria com valor velho qualquer campo
 * que outra pessoa tenha mudado entre o carregamento da tela e o envio.
 */
export function buildClientPatch(original: EditableClient, form: ClientEditForm): ClientPatch {
  const patch: ClientPatch = {};

  const name = text(form.name);
  if (name !== (original.name ?? null)) patch.name = name;

  const email = text(form.email);
  if (email !== (original.email ?? null)) patch.email = email;

  const nextRating = rating(form.rating);
  if (nextRating !== (original.rating ?? null)) patch.rating = nextRating;

  if (form.active !== original.active) patch.active = form.active;

  return patch;
}

export function isEmptyPatch(patch: ClientPatch): boolean {
  return Object.keys(patch).length === 0;
}
