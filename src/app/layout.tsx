import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neotec Prospector",
  description: "Prospecção B2B inteligente para a equipe comercial da Neotec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
