'use client';

import { useState } from 'react';
import { useValidarOtp } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

interface OtpInputProps {
  phoneNumber: string;
  onBack: () => void;
}

export function OtpInput({ phoneNumber, onBack }: OtpInputProps) {
  const [codigo, setCodigo] = useState('');
  const { mutate, isPending } = useValidarOtp();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { phoneNumber, codigo },
      {
        onSuccess: () => {
          toast.success('Login realizado com sucesso!');
          router.push('/');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Código inválido ou expirado');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft size={18} /> Voltar
      </button>

      <div>
        <p className="text-sm text-gray-600 mb-4">
          Código enviado para <strong>{phoneNumber}</strong>
        </p>
        <label className="block text-sm font-medium mb-2">Código OTP</label>
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Digite o código de 6 dígitos</p>
      </div>

      <button
        type="submit"
        disabled={isPending || codigo.length !== 6}
        className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isPending ? 'Verificando...' : 'Confirmar Código'}
      </button>
    </form>
  );
}
