'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RelatoriosPage() {
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

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Resumo do Mês</h2>
          <p className="text-gray-600">Gráficos de gastos por categoria em desenvolvimento...</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Tendências</h2>
          <p className="text-gray-600">Análise de últimos 12 meses em desenvolvimento...</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Exportar Dados</h2>
          <p className="text-gray-600">Download em CSV/JSON em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
}
