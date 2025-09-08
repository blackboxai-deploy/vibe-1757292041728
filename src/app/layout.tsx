import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Controle de Irrigação",
  description: "Sistema completo para controle de irrigação, fertirrigação e monitoramento de sensores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="flex flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}