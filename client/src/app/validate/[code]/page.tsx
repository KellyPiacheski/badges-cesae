"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/services/api";

interface CertificateData {
  participantName: string;
  eventTitle: string;
  issuedAt: string;
  badgeUrl: string | null;
  pdfUrl: string | null;
}

export default function ValidateCodePage() {
  const params = useParams();
  const code = params.code as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await apiFetch(`/certificates/validate/${code}`);
        setCertificate(response);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Código de validação inválido ou não encontrado.");
        } else {
          setError("Erro ao verificar certificado. Tente novamente.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    validate();
  }, [code]);

  const SERVER_URL =
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(
      /\/api$/,
      ""
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="absolute top-0 right-0 p-6 lg:p-10">
        <div className="w-32 lg:w-40">
          <img
            src="/cesae.webp"
            alt="CESAE Digital"
            width={160}
            height={80}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="w-full max-w-md pt-24">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-900 via-purple-600 to-pink-500"></div>
          <div className="p-8 lg:p-10">
            {/* A carregar */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
                <a
                  href="/validate"
                  className="block text-center text-purple-600 hover:text-purple-700 text-sm font-semibold"
                >
                  Tentar novamente
                </a>
              </div>
            )}

            {/* Certificado válido */}
            {certificate && (
              <div>
                <div className="flex items-center mb-6">
                  <svg
                    className="w-6 h-6 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-green-700">
                    Certificado válido
                  </h2>
                </div>

                {certificate.badgeUrl && (
                  <img
                    src={certificate.badgeUrl}
                    alt="Badge"
                    className="w-32 h-32 mx-auto mb-6 rounded-lg shadow"
                  />
                )}

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Participante</p>
                    <p className="font-semibold">
                      {certificate.participantName}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Evento</p>
                    <p className="font-semibold">{certificate.eventTitle}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Data de emissão
                    </p>
                    <p className="font-semibold">{certificate.issuedAt}</p>
                  </div>
                </div>

                {/* Botão de download do PDF */}
                {certificate.pdfUrl && (
                  <a
                    href={`${SERVER_URL}${certificate.pdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-6 bg-blue-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    Descarregar Certificado PDF
                  </a>
                )}

                <a
                  href="/validate"
                  className="block text-center text-purple-600 hover:text-purple-700 text-sm font-semibold mt-4"
                >
                  Verificar outro certificado
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 CESAE Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
