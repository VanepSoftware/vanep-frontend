import type { StaticImageData } from "next/image";

import arthurMariani from "@/assets/team/arthur-mariani.webp";
import caioLucas from "@/assets/team/CaiooLucas.webp";
import cauaDePaula from "@/assets/team/Cauazinkj.webp";
import joaoBittencourt from "@/assets/team/JoaoBittencourt1.webp";
import joaoJales from "@/assets/team/JoaoJales.webp";
import jonathanAraujo from "@/assets/team/Jhonathan1656.webp";
import matheus from "@/assets/team/matheus0346.webp";

export type TeamMember = {
  /** Usuário no GitHub, usado para montar o link do perfil. */
  login: string;
  /** Nome de exibição. Cai para o login quando a conta não tem nome público. */
  name: string;
  /** Foto de perfil do GitHub, baixada e servida pelo próprio site. */
  avatar: StaticImageData;
};

/**
 * Equipe da Vanep — colaboradores dos repositórios da organização no GitHub.
 * Levantado em 17/09/2026 com `gh api repos/VanepSoftware/<repo>/collaborators`,
 * unindo os cinco repositórios. Em ordem alfabética, sem hierarquia.
 *
 * As fotos vêm de `gh api users/<login> --jq .avatar_url`, redimensionadas para
 * 160x160 em WebP. Quando alguém trocar a foto no GitHub, é preciso rebaixar.
 */
export const team: readonly TeamMember[] = [
  { login: "arthur-mariani", name: "Arthur Mariani", avatar: arthurMariani },
  { login: "CaiooLucas", name: "Caio Lucas", avatar: caioLucas },
  { login: "Cauazinkj", name: "Cauã de Paula", avatar: cauaDePaula },
  { login: "JoaoBittencourt1", name: "João Bittencourt", avatar: joaoBittencourt },
  { login: "JoaoJales", name: "João Ricardo Jales Cirino", avatar: joaoJales },
  { login: "Jhonathan1656", name: "Jonathan Araujo", avatar: jonathanAraujo },
  { login: "matheus0346", name: "matheus0346", avatar: matheus },
];
