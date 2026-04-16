import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const SERVER_URL = API_URL.replace(/\/api$/, "");
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "https://badges-cesae-tau.vercel.app";

// Garante que o URL da imagem é sempre absoluto (necessário para LinkedIn OG)
function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  try {
    const { code } = await params;
    const res = await fetch(`${API_URL}/certificates/validate/${code}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Certificado CESAE Digital",
        description: "Verifica a autenticidade do teu certificado CESAE Digital.",
      };
    }

    const data = await res.json();
    const title = `${data.participantName} concluiu ${data.eventTitle} | CESAE Digital`;
    const description = `${data.participantName} obteve o certificado de conclusão de "${data.eventTitle}", emitido pela CESAE Digital. Verifica a autenticidade aqui.`;
    const pageUrl = `${CLIENT_URL}/validate/${code}`;
    // Imagem OG gerada dinamicamente — badge centrado em 1200x630 para LinkedIn
    const ogImageUrl = `${SERVER_URL}/api/certificates/og/${code}?v=3`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: "CESAE Digital",
        images: [{
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Certificado de ${data.eventTitle} — ${data.participantName}`,
        }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (_) {
    return {
      title: "Certificado CESAE Digital",
      description: "Verifica a autenticidade do teu certificado CESAE Digital.",
    };
  }
}

export default function ValidateCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
