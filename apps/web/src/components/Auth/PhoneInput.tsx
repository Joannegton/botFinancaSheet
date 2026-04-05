'use client';

import { useState } from 'react';
import { useSolicitarOtp, useValidarOtp } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export function PhoneInput({ onNext }: { onNext: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const { mutate, isPending } = useSolicitarOtp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(phone, {
      onSuccess: () => {
        toast.success('OTP enviado para seu WhatsApp!');
        onNext(phone);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Erro ao enviar OTP');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Seu Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+5521999999999"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Formato: +55 + DDD + número</p>
      </div>
      <button
        type="submit"
        disabled={isPending || !phone}
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isPending ? 'Enviando...' : 'Enviar Código'}
      </button>
    </form>
  );
}
