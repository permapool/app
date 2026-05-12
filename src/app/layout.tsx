import type { Metadata } from "next";
import "~/app/globals.css";
import Client from "./client";

const getMetadataBase = () => {
  const rawUrl = process.env.NEXT_PUBLIC_URL ?? process.env.VERCEL_URL;

  if (!rawUrl) {
    return new URL("http://localhost:3000");
  }

  return new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "HIGHER.ZIP",
    template: "%s | HIGHER.ZIP",
  },
  description: "higher higher higher",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HIGHER.ZIP",
    description: "higher higher higher",
    url: "/",
    siteName: "HIGHER.ZIP",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "HIGHER.ZIP",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HIGHER.ZIP",
    description: "higher higher higher",
    images: ["/opengraph-image"],
  },
  icons: [
    { rel: "icon", url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "shortcut icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
  ],
  appleWebApp: {
    title: "HIGHER.ZIP",
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en" style={{ minHeight: '100%' }}>
      <body style={{ position: 'relative', minHeight: '100%' }}>
        <Client>{children}</Client>
      </body>
    </html>
  );
}
