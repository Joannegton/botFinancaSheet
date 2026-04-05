'use client';

import { useState } from 'react';
import { PhoneInput } from '@/components/Auth/PhoneInput';
import { OtpInput } from '@/components/Auth/OtpInput';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">💰</h1>
          <h2 className="text-2xl font-bold text-gray-800">Finanças</h2>
          <p className="text-gray-600 text-sm mt-2">Controle seus gastos com facilidade</p>
        </div>

        {step === 'phone' ? (
          <PhoneInput
            onNext={(phoneNumber) => {
              setPhone(phoneNumber);
              setStep('otp');
            }}
          />
        ) : (
          <OtpInput phoneNumber={phone} onBack={() => setStep('phone')} />
        )}

        <p className="text-center text-xs text-gray-500 mt-8">
          Você receberá um código via WhatsApp.
          <br />
          Procure pela mensagem em alguns segundos.
        </p>
      </div>
    </div>
  );
}
