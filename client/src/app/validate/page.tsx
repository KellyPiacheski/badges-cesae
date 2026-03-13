"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ValidatePage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Redireciona para /validate/CESAE-XXXX-XXXX-XXXX
    router.push(`/validate/${code}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      {/* Logo */}
      <div className="absolute top-0 right-0 p-6 lg:p-10">
        <div className="w-32 lg:w-40">
          <img
            src="/cesae-logo.svg"
            alt="CESAE Digital"
            width={160}
            height={80}
            className="w-full h-auto"
            style={{ filter: "drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))" }}
          />
        </div>
      </div>

      <div className="w-full max-w-md pt-24">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-900 via-purple-600 to-pink-500"></div>

          <div className="p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent mb-2">
                Verificar Certificado
              </h1>
              <p className="text-gray-600 text-sm">
                Insira o código de validação para verificar a autenticidade do
                certificado
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-semibold text-gray-700 mb-2">
                  Código de Validação
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 font-mono"
                  placeholder="CESAE-XXXX-XXXX-XXXX"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-900 to-purple-600 hover:from-blue-800 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                Validar
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 CESAE Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
