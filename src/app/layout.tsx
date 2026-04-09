import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/cookie-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Pablo Scarlatto Entrenamientos | Planes Personalizados",
  description:
    "Planes de entrenamiento y nutrición personalizados online. Transforma tu cuerpo con la guía de un profesional.",
  keywords: [
    "entrenamiento personalizado",
    "nutrición deportiva",
    "planes fitness",
    "entrenador personal",
    "Uruguay",
    "personalized training",
    "fitness plans",
    "online trainer",
  ],
  openGraph: {
    title: "Pablo Scarlatto Entrenamientos",
    description: "Planes de entrenamiento y nutrición personalizados online",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" href="/logo-pablo.jpg" as="image" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* Logo watermark — subtle, fused with background on all pages */}
        <img
          src="/logo-pablo.jpg"
          alt=""
          aria-hidden="true"
          className="logo-watermark"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(70vw, 600px)",
            height: "auto",
          }}
        />
        <Providers>{children}</Providers>
        <CookieBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }
  window.__pwaInstallPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallPrompt=e;});
})();`,
          }}
        />
      </body>
    </html>
  );
}
