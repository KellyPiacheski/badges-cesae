"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";

interface CertificateData {
  participantName: string;
  eventTitle: string;
  issuedAt: string;
  badgeUrl: string | null;
  pdfUrl: string | null;
}

export default function ValidateClient({ code }: { code: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

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

  function getBadgeSrc(url: string) {
    return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
  }

  function getSuggestedText() {
    if (!certificate) return "";
    return `Orgulhoso(a) de ter concluído "${certificate.eventTitle}" pela CESAE Digital! 🎓\n\nO meu certificado digital está disponível e verificável em:\n${pageUrl}\n\n#CESAEDigital #Formação #Certificado`;
  }

  function handleCopy() {
    navigator.clipboard.writeText(getSuggestedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openLinkedInModal() {
    setShowLinkedIn(true);
  }

  function openLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openLinkedInProfile() {
    if (!certificate) return;
    const issued = new Date(certificate.issuedAt);
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: certificate.eventTitle,
      organizationName: "CESAE Digital",
      issueYear: String(issued.getFullYear()),
      issueMonth: String(issued.getMonth() + 1),
      certUrl: pageUrl,
      certId: code,
    });
    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="absolute top-0 right-0 p-6 lg:p-10">
        <div className="w-32 lg:w-40">
          <img src="/cesae-logo.svg" alt="CESAE Digital" className="w-full h-auto" />
        </div>
      </div>

      <div className="w-full max-w-md pt-24">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-900 via-purple-600 to-pink-500"></div>
          <div className="p-8 lg:p-10">

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}

            {error && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Certificado não encontrado</h3>
                <p className="text-sm text-gray-500 mb-2">
                  O código <span className="font-mono font-semibold text-gray-700">{code}</span> não corresponde a nenhum certificado no sistema.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  Verifica se o código está correto e tenta novamente.
                </p>
                <a
                  href="/validate"
                  className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Tentar outro código
                </a>
              </div>
            )}

            {certificate && (
              <div>
                <div className="flex items-center mb-6">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h2 className="text-xl font-bold text-green-700">Certificado válido</h2>
                </div>

                {certificate.badgeUrl && (
                  <img
                    src={getBadgeSrc(certificate.badgeUrl)}
                    alt="Badge"
                    className="w-32 h-32 mx-auto mb-6 rounded-lg shadow"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-32 h-32 mx-auto mb-6 rounded-lg bg-gradient-to-br from-blue-900 to-purple-600 flex items-center justify-center';
                      placeholder.innerHTML = '<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>';
                      target.parentNode?.insertBefore(placeholder, target);
                    }}
                  />
                )}

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Participante</p>
                    <p className="font-semibold">{certificate.participantName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Evento</p>
                    <p className="font-semibold">{certificate.eventTitle}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">Data de emissão</p>
                    <p className="font-semibold">
                      {new Date(certificate.issuedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {certificate.pdfUrl && (
                  <a
                    href={certificate.pdfUrl.startsWith('http') ? certificate.pdfUrl : `${SERVER_URL}${certificate.pdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-6 bg-blue-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Descarregar Certificado PDF
                  </a>
                )}

                {pageUrl && (
                  <button
                    onClick={openLinkedInModal}
                    className="flex items-center justify-center gap-2 w-full mt-3 bg-[#0077B5] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#006097] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Partilhar no LinkedIn
                  </button>
                )}

                <a href="/validate" className="block text-center text-purple-600 hover:text-purple-700 text-sm font-semibold mt-4">
                  Verificar outro certificado
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">© 2026 CESAE Digital. Todos os direitos reservados.</p>
      </div>

      {/* Modal LinkedIn */}
      {showLinkedIn && certificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-900 via-purple-600 to-pink-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <h2 className="text-base font-bold text-gray-900">Partilhar no LinkedIn</h2>
                </div>
                <button onClick={() => setShowLinkedIn(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>

              {/* Preview badge + certificado */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 mb-4">
                {certificate.badgeUrl && (
                  <img
                    src={getBadgeSrc(certificate.badgeUrl)}
                    alt="Badge"
                    className="w-20 h-20 rounded-lg shadow flex-shrink-0 object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Certificado verificável</p>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{certificate.eventTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{certificate.participantName}</p>
                  <p className="text-xs text-blue-600 mt-1 truncate">{pageUrl}</p>
                </div>
              </div>

              {/* Texto sugerido */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-600">Texto sugerido</p>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    {copied ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copiado!</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar</>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                  {getSuggestedText()}
                </div>
              </div>

              {copied && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-green-700 font-medium">Texto copiado! Cola na publicação do LinkedIn.</p>
                </div>
              )}

              {/* Adicionar ao perfil — destaque */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">Adicionar às Certificações do perfil</p>
                <p className="text-xs text-blue-700 mb-2">
                  Adiciona este certificado diretamente à secção "Licenças e Certificações" do teu perfil LinkedIn.
                </p>
                <button
                  onClick={openLinkedInProfile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0077B5] hover:bg-[#006097] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Adicionar ao Perfil LinkedIn
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkedIn(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={openLinkedIn}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0077B5] hover:bg-[#006097] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Partilhar publicação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
