import type { NextAuthOptions } from "next-auth";

import { maybeRefreshAccessToken, revokeToken } from "@/lib/server/oauth-session";

const authUrl = process.env.AUTH_URL ?? "";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "vanep",
      name: "Vanep",
      type: "oauth",
      client: {
        token_endpoint_auth_method: "none",
      },
      authorization: {
        url: `${authUrl}/oauth2/authorize`,
        params: { scope: "read write" },
      },
      token: `${authUrl}/oauth2/token`,
      userinfo: {
        url: `${authUrl}/api/user/profile`,
        async request({ tokens }) {
          const res = await fetch(`${authUrl}/api/user/profile`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              Accept: "application/json",
            },
          });
          const body = await res.text();
          if (!res.ok) throw new Error(`userinfo ${res.status}: ${body}`);
          return JSON.parse(body);
        },
      },
      clientId: process.env.AUTH_OAUTH_CLIENT_ID ?? "",
      profile(profile: { token: string; name?: string | null; email?: string | null }) {
        return {
          id: String(profile.token),
          name: profile.name ?? null,
          email: profile.email ?? null,
          image: null,
        };
      },
      checks: ["pkce", "state"],
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        return token;
      }

      const { token: next } = await maybeRefreshAccessToken(token);
      return next;
    },
    async session({ session }) {
      return session;
    },
  },
  events: {
    
    async signOut({ token }) {
      if (typeof token.refreshToken === "string") {
        await revokeToken(token.refreshToken, "refresh_token");
      }
      if (typeof token.accessToken === "string") {
        await revokeToken(token.accessToken, "access_token");
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV !== "production" || process.env.NEXTAUTH_DEBUG === "true",
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};
