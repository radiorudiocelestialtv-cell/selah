import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./selah.css";

export const metadata: Metadata = {
  title: "Selah - Red social cristiana",
  description: "Haz una pausa. Conecta con Dios y con tu comunidad.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}