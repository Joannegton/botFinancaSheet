'use client';

import { useGastos } from '@/lib/hooks/useGastos';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { usuario } = useAuthStore();
  const { data, isLoading } = useGastos({ limite: 5 });
  const router = useRouter();

  useEffect(() => {
    if (!usuario) {
      router.push('/auth/login');
    }
  }, [usuario, router]);

  if (!usuario) {
    return null;
  }

  const total = data?.gastos?.reduce((sum: number, g: any) => sum + g.valor, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo, {usuario.phoneNumber}</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <p className="text-gray-600 text-sm font-medium">Total este mês</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(total)}</p>
        </div>

        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <p className="text-gray-600 text-sm font-medium">Transações</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{data?.gastos?.length || 0}</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
          <p className="text-gray-600 text-sm font-medium">Ticket médio</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {data?.gastos?.length ? formatCurrency(total / data.gastos.length) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Últimas transações */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Últimas transações</h2>
          <a href="/gastos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Ver todas →
          </a>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : data?.gastos?.length ? (
          <div className="space-y-3">
            {data.gastos.map((gasto: any) => (
              <div
                key={gasto.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-900">{gasto.categoria}</p>
                  <p className="text-sm text-gray-600">
                    {gasto.formaPagamento} • {formatDate(gasto.data)}
                  </p>
                </div>
                <span className="text-lg font-bold text-red-600">
                  -{formatCurrency(gasto.valor)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Nenhuma transação registrada</div>
        )}
      </div>
    </div>
  );
}
