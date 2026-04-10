import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/certificates/validate/${params.code}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Certificado CESAE Digital",
        description: "Verifica a autenticidade do teu certificado CESAE Digital.",
      };
    }

    const data = await res.json();
    const title = `${data.participantName} — ${data.eventTitle} | CESAE Digital`;
    const description = `Certificado de conclusão de ${data.eventTitle}, emitido pela CESAE Digital.`;
    const pageUrl = `${process.env.NEXT_PUBLIC_CLIENT_URL || "https://badges-cesae.vercel.app"}/validate/${params.code}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: "CESAE Digital",
        images: data.badgeUrl
          ? [{ url: data.badgeUrl, width: 800, height: 800, alt: "Badge CESAE Digital" }]
          : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: data.badgeUrl ? [data.badgeUrl] : [],
      },
    };
  } catch {
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
