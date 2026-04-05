import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import { Navbar } from '@/components/Layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finanças - Controle de Gastos',
  description: 'App para controlar seus gastos via WhatsApp e Website',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
