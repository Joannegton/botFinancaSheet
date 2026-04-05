'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/formatters';

export default function CategoriesPage() {
  const { usuario } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!usuario) {
      router.push('/auth/login');
    }
  }, [usuario, router]);

  if (!usuario) {
    return null;
  }

  const mockCategorias = [
    { id: '1', nome: 'Alimentação' },
    { id: '2', nome: 'Transporte' },
    { id: '3', nome: 'Saúde' },
    { id: '4', nome: 'Moradia' },
    { id: '5', nome: 'Vestuário' },
    { id: '6', nome: 'Outros' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCategorias.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-blue-500"
          >
            <p className="text-lg font-semibold text-gray-900">{cat.nome}</p>
            <p className="text-sm text-gray-600 mt-2">Padrão do sistema</p>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-600 text-sm">
        Categorias customizadas estarão disponíveis em breve
      </p>
    </div>
  );
}
