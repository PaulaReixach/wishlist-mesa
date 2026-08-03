import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "MESA — Decidir dónde comer, juntos",
    template: "%s · MESA",
  },
  description:
    "Crea grupos, descubre restaurantes, guarda favoritos y decidid juntos dónde será vuestro próximo plan. Apúntate a la beta privada de MESA.",
  keywords: [
    "MESA",
    "restaurantes",
    "planes con amigos",
    "grupos",
    "wishlist restaurantes",
    "app restaurantes",
  ],
  authors: [{ name: "MESA" }],
  creator: "MESA",
  icons: {
    icon: "/mesa-logo.png",
    apple: "/mesa-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MESA",
    title: "MESA — Los mejores planes empiezan aquí",
    description:
      "Descubrid, guardad y decidid juntos dónde será vuestra próxima mesa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MESA — Decidir dónde comer, juntos",
    description:
      "Descubrid, guardad y decidid juntos dónde será vuestra próxima mesa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
