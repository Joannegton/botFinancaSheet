'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { usuario, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!usuario) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <Link href="/" className="font-bold text-xl text-blue-600">
          💰 Finanças
        </Link>

        {/* Mobile menu button */}
        <button className="sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop menu */}
        <div className="hidden sm:flex gap-6">
          <Link href="/gastos" className="hover:text-blue-600">
            Gastos
          </Link>
          <Link href="/categorias" className="hover:text-blue-600">
            Categorias
          </Link>
          <Link href="/relatorios" className="hover:text-blue-600">
            Relatórios
          </Link>
          <Link href="/config" className="hover:text-blue-600">
            Config
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg p-4 w-full flex flex-col gap-3 sm:hidden">
            <Link href="/gastos" onClick={() => setMenuOpen(false)}>
              Gastos
            </Link>
            <Link href="/categorias" onClick={() => setMenuOpen(false)}>
              Categorias
            </Link>
            <Link href="/relatorios" onClick={() => setMenuOpen(false)}>
              Relatórios
            </Link>
            <Link href="/config" onClick={() => setMenuOpen(false)}>
              Config
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="text-red-600 text-left"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
