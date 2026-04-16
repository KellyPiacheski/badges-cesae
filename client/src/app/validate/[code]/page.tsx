import { Metadata } from "next";
import ValidateClient from "./ValidateClient";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const SERVER_URL = API_URL.replace(/\/api$/, "");
  const CLIENT_URL =
    process.env.NEXT_PUBLIC_CLIENT_URL || "https://badges-cesae-tau.vercel.app";

  try {
    const res = await fetch(`${API_URL}/certificates/validate/${code}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Certificado — CESAE Digital",
        description: "Verifica a autenticidade de um certificado CESAE Digital.",
      };
    }

    const cert = await res.json();

    const pageUrl = `${CLIENT_URL}/validate/${code}`;
    // Imagem OG 1200x630 gerada dinamicamente no Railway
    const ogImageUrl = `${SERVER_URL}/api/certificates/og/${code}?v=3`;

    const title = `${cert.participantName} concluiu ${cert.eventTitle} | CESAE Digital`;
    const description = `${cert.participantName} obteve o certificado de conclusão de "${cert.eventTitle}", emitido pela CESAE Digital. Verifica a autenticidade aqui.`;

    return {
      title,
      description,
      openGraph: {
        type: "website",
        url: pageUrl,
        title,
        description,
        siteName: "CESAE Digital",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `Certificado de ${cert.eventTitle} — ${cert.participantName}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: "Certificado — CESAE Digital",
      description: "Verifica a autenticidade de um certificado CESAE Digital.",
    };
  }
}

export default async function ValidatePage({ params }: Props) {
  const { code } = await params;
  return <ValidateClient code={code} />;
}
