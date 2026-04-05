'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ConfigPage() {
  const { usuario } = useAuthStore();
  const router = useRouter();
  const [diaInicio, setDiaInicio] = useState('1');

  useEffect(() => {
    if (!usuario) {
      router.push('/auth/login');
    }
  }, [usuario, router]);

  const handleSaveConfig = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* Seção: Dados Pessoais */}
        <div>
          <h2 className="text-lg font-bold mb-4">Dados Pessoais</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="text"
                value={usuario?.phoneNumber}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
          </div>
        </div>

        <hr />

        {/* Seção: Período Financeiro */}
        <div>
          <h2 className="text-lg font-bold mb-4">Período Financeiro</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dia de Início do Mês (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaInicio}
                onChange={(e) => setDiaInicio(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                O período será calculado a partir deste dia de cada mês
              </p>
            </div>
          </div>
        </div>

        <hr />

        {/* Seção: Sobre */}
        <div>
          <h2 className="text-lg font-bold mb-4">Sobre</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Versão:</strong> 2.0.0
            </p>
            <p>
              <strong>Última atualização:</strong> Abril 2026
            </p>
            <p>
              <strong>Stack:</strong> NestJS + Next.js + PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveConfig}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-semibold"
          >
            Salvar Configurações
          </button>
          <button
            onClick={() => router.back()}
            className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
