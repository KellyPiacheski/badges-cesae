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
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${API_URL}/certificates/validate/${code}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: "Certificado — CESAE Digital",
        description: "Verifica a autenticidade de um certificado CESAE Digital.",
      };
    }

    const cert = await res.json();

    const badgeUrl = cert.badgeUrl
      ? cert.badgeUrl.startsWith("http")
        ? cert.badgeUrl
        : `${SERVER_URL}${cert.badgeUrl}`
      : null;

    const pageUrl = `${SITE_URL}/validate/${code}`;

    const title = `Certificado — ${cert.eventTitle}`;
    const description = `${cert.participantName} concluiu "${cert.eventTitle}" pela CESAE Digital. Clica para verificar o certificado.`;

    return {
      title,
      description,
      openGraph: {
        type: "website",
        url: pageUrl,
        title,
        description,
        siteName: "CESAE Digital",
        ...(badgeUrl && {
          images: [
            {
              url: badgeUrl,
              width: 400,
              height: 400,
              alt: `Badge de ${cert.eventTitle}`,
            },
          ],
        }),
      },
      twitter: {
        card: badgeUrl ? "summary_large_image" : "summary",
        title,
        description,
        ...(badgeUrl && { images: [badgeUrl] }),
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
