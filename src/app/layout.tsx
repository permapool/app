import type { Metadata } from "next";
import "~/app/globals.css";
import Client from "./client";

export const metadata: Metadata = {
  title: "Higher permapool",
  description: "Higher higher higher.",
  icons: [
    { rel: "icon", url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "shortcut icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
  ],
  appleWebApp: {
    title: "Higher",
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
