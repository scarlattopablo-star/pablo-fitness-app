"use client";

import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default function TerminosPage() {
  return (
    <main className="min-h-screen pb-20">
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-muted hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Términos y Condiciones</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 prose prose-invert prose-sm">
        <h1 className="text-2xl font-black mb-2">Términos y Condiciones</h1>
        <p className="text-muted text-sm mb-8">Última actualización: 31 de marzo de 2026</p>

        <div className="space-y-8 text-sm text-muted">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Identificación del Responsable</h2>
            <p>El presente sitio web y aplicación es propiedad y está operado por <strong className="text-white">Pablo Scarlatto Entrenamientos</strong>, con domicilio en la República Oriental del Uruguay.</p>
            <p className="mt-2">Contacto: <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a></p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Objeto del Servicio</h2>
            <p>Pablo Scarlatto Entrenamientos ofrece planes de entrenamiento físico y nutrición personalizados a través de una plataforma digital. Los planes se diseñan en base a la información proporcionada por el usuario mediante una encuesta inicial.</p>
            <p className="mt-2"><strong className="text-white">Importante:</strong> Los planes ofrecidos no sustituyen el consejo médico profesional. Se recomienda consultar con un médico antes de iniciar cualquier programa de entrenamiento o cambio nutricional, especialmente si padece alguna condición de salud preexistente.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. Registro y Cuenta de Usuario</h2>
            <p>Para acceder a los servicios, el usuario debe crear una cuenta proporcionando información veraz y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
            <p className="mt-2">El usuario se compromete a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Proporcionar información verdadera, precisa y completa</li>
              <li>Mantener actualizada su información personal</li>
              <li>No compartir su cuenta con terceros</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Planes y Pagos</h2>
            <p>Los precios de los planes están expresados en dólares estadounidenses (USD) y se procesan a través de MercadoPago.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Los pagos son únicos por la duración seleccionada (1 mes, 3 meses, 6 meses o 1 año)</li>
              <li>El acceso al plan se activa una vez confirmado el pago</li>
              <li>Los planes no se renuevan automáticamente</li>
              <li>No se realizan devoluciones una vez iniciado el plan, salvo casos excepcionales evaluados individualmente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Propiedad Intelectual</h2>
            <p>Todo el contenido de la plataforma, incluyendo pero no limitado a: planes de entrenamiento, planes de nutrición, videos, textos, diseños, logo y marca "Pablo Scarlatto Entrenamientos", son propiedad exclusiva de Pablo Scarlatto.</p>
            <p className="mt-2">Queda prohibida la reproducción, distribución, modificación o uso comercial del contenido sin autorización expresa por escrito.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Limitación de Responsabilidad</h2>
            <p>Pablo Scarlatto Entrenamientos no se responsabiliza por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Lesiones derivadas de la ejecución incorrecta de los ejercicios</li>
              <li>Resultados que puedan variar según cada individuo</li>
              <li>Problemas de salud preexistentes no informados en la encuesta</li>
              <li>Interrupciones temporales del servicio por razones técnicas</li>
              <li>Reacciones adversas a los alimentos sugeridos en los planes nutricionales</li>
            </ul>
            <p className="mt-2">Los resultados mostrados son referenciales y pueden variar de persona a persona dependiendo de factores individuales como genética, adherencia al plan, descanso y otros.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Uso Aceptable</h2>
            <p>El usuario se compromete a utilizar la plataforma de manera responsable y a no:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Compartir o revender el acceso a su plan</li>
              <li>Copiar o distribuir el contenido de los planes</li>
              <li>Usar la plataforma para fines ilegales o no autorizados</li>
              <li>Subir contenido inapropiado, ofensivo o ilegal</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Modificaciones</h2>
            <p>Pablo Scarlatto Entrenamientos se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones serán comunicadas a través de la plataforma y entrarán en vigencia desde su publicación.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">9. Legislación Aplicable y Jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de la República Oriental del Uruguay. Para cualquier controversia derivada del uso de la plataforma, las partes se someten a la jurisdicción de los Tribunales competentes de Montevideo, Uruguay.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">10. Contacto</h2>
            <p>Para consultas sobre estos términos: <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a></p>
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
