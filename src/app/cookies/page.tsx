"use client";

import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default function CookiesPage() {
  return (
    <main className="min-h-screen pb-20">
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-muted hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Política de Cookies</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 prose prose-invert prose-sm">
        <h1 className="text-2xl font-black mb-2">Política de Cookies</h1>
        <p className="text-muted text-sm mb-8">Última actualización: 9 de abril de 2026</p>

        <div className="space-y-8 text-sm text-muted">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. ¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitás un sitio web. Se utilizan para recordar información sobre tu visita, como tus preferencias y sesión activa.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Cookies que utilizamos</h2>
            <p>En esta plataforma utilizamos exclusivamente cookies esenciales para el funcionamiento del servicio:</p>

            <h3 className="text-white font-medium mt-4 mb-2">Cookies de sesión (Supabase Auth):</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Permiten mantener tu sesión iniciada mientras navegás la plataforma</li>
              <li>Son estrictamente necesarias para el funcionamiento de la app</li>
              <li>Se eliminan al cerrar sesión</li>
            </ul>

            <h3 className="text-white font-medium mt-4 mb-2">Cookies técnicas (preferencias):</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Almacenan preferencias de idioma y configuración de la interfaz</li>
              <li>Mejoran tu experiencia de uso sin recopilar datos personales</li>
              <li>Se almacenan mediante localStorage en tu navegador</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. Cookies de terceros</h2>
            <p><strong className="text-white">NO utilizamos cookies de terceros.</strong></p>
            <p className="mt-2">No empleamos cookies de rastreo, publicidad, analítica de terceros ni ningún tipo de cookie que permita el seguimiento de tu actividad en otros sitios web.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Cómo desactivar cookies</h2>
            <p>Podés controlar y/o eliminar las cookies según tus preferencias. A continuación te explicamos cómo hacerlo en los navegadores más comunes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios</li>
              <li><strong className="text-white">Firefox:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y datos del sitio</li>
              <li><strong className="text-white">Safari:</strong> Preferencias &gt; Privacidad &gt; Gestionar datos del sitio web</li>
              <li><strong className="text-white">Edge:</strong> Configuración &gt; Cookies y permisos del sitio</li>
            </ul>
            <p className="mt-2"><strong className="text-white">Nota:</strong> Si desactivás las cookies esenciales, es posible que algunas funcionalidades de la plataforma no funcionen correctamente (por ejemplo, no podrás mantener tu sesión iniciada).</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Más información</h2>
            <p>Para más información sobre cómo tratamos tus datos personales, consultá nuestra{" "}
              <Link href="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
            </p>
            <p className="mt-2">Si tenés consultas sobre esta política de cookies, podés contactarnos a través de Instagram:{" "}
              <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-card-border text-center">
          <Link href="/privacidad" className="text-primary hover:underline text-sm">
            Ver Política de Privacidad
          </Link>
        </div>
      </div>
    </main>
  );
}
