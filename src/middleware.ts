import { withAuth } from "next-auth/middleware";

/**
 * Protege as áreas autenticadas no edge (server-side), antes de renderizar a página.
 * Sem sessão válida, o NextAuth redireciona para a home (onde fica o botão de entrar).
 *
 * As páginas públicas (home, /about, etc.) ficam de fora do `matcher`. Conforme as áreas
 * logadas surgirem, basta acrescentá-las aqui (ex.: "/perfil/:path*").
 */
export default withAuth({
  pages: { signIn: "/" },
});

export const config = {
  matcher: ["/conta/:path*", "/dashboard/:path*"],
};
