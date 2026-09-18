import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ProfileButton } from "@/components/profile-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

const display = Poppins({
  variable: "--font-display",
  weight: ["600", "700", "800"],
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: {
    default: "Vanep — A digitalização da van escolar em um aplicativo",
    template: "%s | Vanep"
  },
  description:
    "O Vanep digitaliza a van escolar em um app: motoristas verificados, contrato digital, rastreamento em tempo real e notificação a cada etapa do trajeto.",
  openGraph: {
    title: "Vanep — A digitalização da van escolar em um aplicativo",
    description:
      "Encontre motoristas verificados, acompanhe a van em tempo real e tenha contratos digitais. Tudo em um só app.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Providers>
          <ProfileButton />
          {children}
        </Providers>
      </body>
    </html>
  );
}
