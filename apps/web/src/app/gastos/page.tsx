'use client';

import { useState } from 'react';
import { useGastos, useCreateGasto, useDeleteGasto } from '@/lib/hooks/useGastos';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function GastosPage() {
  const { usuario } = useAuthStore();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filtro, setFiltro] = useState({});

  const { data: gastos, isLoading } = useGastos(filtro);
  const { mutate: criar, isPending: isCreating } = useCreateGasto();
  const { mutate: deletar } = useDeleteGasto('');

  const [formData, setFormData] = useState({
    valor: '',
    categoria: 'alimentacao',
    formaPagamento: 'pix',
    observacao: '',
  });

  useEffect(() => {
    if (!usuario) {
      router.push('/auth/login');
    }
  }, [usuario, router]);

  const categorias = ['alimentacao', 'transporte', 'saude', 'moradia', 'vestuario', 'outros'];
  const formasPagamento = ['pix', 'dinheiro', 'cartao'];

  const handleCreateGasto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.valor) {
      toast.error('Digite o valor');
      return;
    }

    criar(
      {
        phoneNumber: usuario?.phoneNumber,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        formaPagamento: formData.formaPagamento,
        observacao: formData.observacao || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Gasto criado com sucesso!');
          setFormData({
            valor: '',
            categoria: 'alimentacao',
            formaPagamento: 'pix',
            observacao: '',
          });
          setIsFormOpen(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Erro ao criar gasto');
        },
      },
    );
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gastos</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold"
        >
          <Plus size={20} /> Novo Gasto
        </button>
      </div>

      {/* Formulário Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Novo Gasto</h2>
            <form onSubmit={handleCreateGasto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                <select
                  value={formData.formaPagamento}
                  onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {formasPagamento.map((forma) => (
                    <option key={forma} value={forma}>
                      {forma.charAt(0).toUpperCase() + forma.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Ex: Almoço no restaurante"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isCreating ? 'Criando...' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Gastos */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando gastos...</div>
        ) : gastos?.gastos?.length ? (
          <>
            {/* View Mobile - Cards */}
            <div className="sm:hidden space-y-3">
              {gastos.gastos.map((gasto: any) => (
                <div
                  key={gasto.id}
                  className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{gasto.categoria}</p>
                      <p className="text-xs text-gray-600">{gasto.formaPagamento}</p>
                    </div>
                    <p className="text-lg font-bold text-red-600">-{formatCurrency(gasto.valor)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{formatDate(gasto.data)}</p>
                  {gasto.observacao && (
                    <p className="text-sm text-gray-600 mb-3 truncate">{gasto.observacao}</p>
                  )}
                  <div className="flex gap-2">
                    <button className="text-blue-600 text-sm hover:text-blue-700">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deletar()}
                      className="text-red-600 text-sm hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* View Desktop - Tabela */}
            <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Data</th>
                    <th className="px-6 py-3 text-left font-semibold">Categoria</th>
                    <th className="px-6 py-3 text-left font-semibold">Forma Pag.</th>
                    <th className="px-6 py-3 text-left font-semibold">Observação</th>
                    <th className="px-6 py-3 text-right font-semibold">Valor</th>
                    <th className="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.gastos.map((gasto: any) => (
                    <tr key={gasto.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{formatDate(gasto.data)}</td>
                      <td className="px-6 py-3 font-medium capitalize">{gasto.categoria}</td>
                      <td className="px-6 py-3 capitalize">{gasto.formaPagamento}</td>
                      <td className="px-6 py-3 text-gray-600 truncate">
                        {gasto.observacao || '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-red-600">
                        -{formatCurrency(gasto.valor)}
                      </td>
                      <td className="px-6 py-3 text-center flex gap-2 justify-center">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deletar()}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            <p className="mb-2">Nenhum gasto registrado</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Criar o primeiro gasto →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
