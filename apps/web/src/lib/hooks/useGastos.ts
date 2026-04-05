'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Gasto } from '@/lib/types';

interface ListarGastosParams {
  dataInicio?: Date;
  dataFim?: Date;
  categoria?: string;
  pagina?: number;
  limite?: number;
}

export function useGastos(filtros?: ListarGastosParams) {
  const usuario = useAuthStore((state) => state.usuario);

  return useQuery({
    queryKey: ['gastos', filtros],
    queryFn: async () => {
      const { data } = await api.get('/api/gastos', { params: filtros });
      return data;
    },
    enabled: !!usuario,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await api.post('/api/gastos', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
    },
  });
}

export function useDeleteGasto(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/gastos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
    },
  });
}

export function useUpdateGasto(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await api.patch(`/api/gastos/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
    },
  });
}
