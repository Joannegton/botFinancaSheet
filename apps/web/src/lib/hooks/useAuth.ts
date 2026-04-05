'use client';

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export function useSolicitarOtp() {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const { data } = await api.post('/api/auth/solicitar-otp', {
        phoneNumber,
      });
      return data;
    },
  });
}

export function useValidarOtp() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (input: { phoneNumber: string; codigo: string }) => {
      const { data } = await api.post('/api/auth/validar-otp', input);
      setAuth(data.accessToken, data.usuario);
      return data;
    },
  });
}
