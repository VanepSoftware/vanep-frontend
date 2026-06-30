import ptBR from "@/messages/pt-BR";

type Messages = typeof ptBR;
type Namespace = keyof Messages;

export function t<N extends Namespace>(ns: N): Messages[N] {
  return ptBR[ns];
}
