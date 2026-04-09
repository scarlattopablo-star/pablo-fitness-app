"use client";

import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen pb-20">
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-muted hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Política de Privacidad</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 prose prose-invert prose-sm">
        <h1 className="text-2xl font-black mb-2">Política de Privacidad</h1>
        <p className="text-muted text-sm mb-2">Última actualización: 31 de marzo de 2026</p>
        <p className="text-muted text-sm mb-8">En cumplimiento de la Ley N° 18.331 de Protección de Datos Personales y Acción de Habeas Data de la República Oriental del Uruguay.</p>

        <div className="space-y-8 text-sm text-muted">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Responsable del Tratamiento</h2>
            <p><strong className="text-white">Pablo Scarlatto Entrenamientos</strong> es responsable del tratamiento de los datos personales recopilados a través de esta plataforma, en cumplimiento de la Ley N° 18.331 y su decreto reglamentario N° 414/009.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Base Legal del Tratamiento</h2>
            <p>El tratamiento de los datos personales se realiza sobre la base del <strong className="text-white">consentimiento explícito del usuario</strong>, otorgado al momento de registrarse en la plataforma, conforme al artículo 9 de la Ley N° 18.331.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. Registro ante la URCDP</h2>
            <p>La base de datos se encuentra en proceso de registro ante la <strong className="text-white">Unidad Reguladora y de Control de Datos Personales (URCDP)</strong> conforme a la Ley N° 18.331 y su decreto reglamentario N° 414/009.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Datos que Recopilamos</h2>
            <p>Recopilamos los siguientes datos personales con su consentimiento expreso:</p>

            <h3 className="text-white font-medium mt-4 mb-2">Datos de registro:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono (opcional)</li>
              <li>Contraseña (almacenada de forma encriptada)</li>
            </ul>

            <h3 className="text-white font-medium mt-4 mb-2">Datos de la encuesta personal:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Edad y sexo</li>
              <li>Peso corporal y altura</li>
              <li>Nivel de actividad física</li>
              <li>Restricciones alimentarias</li>
            </ul>

            <h3 className="text-white font-medium mt-4 mb-2">Datos de seguimiento (opcionales):</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registros de peso y medidas corporales</li>
              <li>Fotografías de progreso (frente, perfil y espalda)</li>
              <li>Notas personales sobre el proceso</li>
            </ul>

            <h3 className="text-white font-medium mt-4 mb-2">Datos de pago:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Los pagos se procesan exclusivamente a través de MercadoPago</li>
              <li>No almacenamos datos de tarjetas de crédito ni datos financieros</li>
              <li>Solo registramos el ID de transacción y estado del pago</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Finalidad del Tratamiento</h2>
            <p>Los datos personales se recopilan y procesan exclusivamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Crear y gestionar la cuenta del usuario</li>
              <li>Calcular las necesidades calóricas y de macronutrientes personalizadas</li>
              <li>Diseñar planes de entrenamiento y nutrición a medida</li>
              <li>Permitir el seguimiento del progreso físico del usuario</li>
              <li>Comunicar información relevante sobre el servicio</li>
              <li>Procesar pagos y gestionar suscripciones</li>
            </ul>
            <p className="mt-2"><strong className="text-white">Los datos NO se utilizan para publicidad de terceros ni se venden a ninguna empresa.</strong></p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Consentimiento</h2>
            <p>De acuerdo con el artículo 9 de la Ley N° 18.331, el tratamiento de datos personales es lícito cuando el titular ha dado su consentimiento libre, previo, expreso e informado.</p>
            <p className="mt-2">Al crear una cuenta y completar la encuesta, el usuario otorga su consentimiento para el tratamiento de sus datos conforme a esta política.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Confidencialidad de las Fotografías</h2>
            <p>Las fotografías de progreso son datos personales sensibles y reciben protección especial:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Se almacenan de forma privada y encriptada en servidores seguros</li>
              <li>Solo son accesibles por el usuario y su entrenador (Pablo Scarlatto)</li>
              <li><strong className="text-white">Nunca se publican, comparten o utilizan con fines publicitarios sin consentimiento expreso</strong></li>
              <li>El usuario puede solicitar su eliminación en cualquier momento</li>
              <li>Se acceden mediante URLs firmadas con tiempo de expiración</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Derechos del Titular (ARCO)</h2>
            <p>De acuerdo con los artículos 13 a 15 de la Ley N° 18.331, el usuario tiene derecho a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Acceso:</strong> Conocer qué datos personales tenemos almacenados</li>
              <li><strong className="text-white">Rectificación:</strong> Solicitar la corrección de datos inexactos</li>
              <li><strong className="text-white">Cancelación:</strong> Solicitar la eliminación de sus datos personales</li>
              <li><strong className="text-white">Oposición:</strong> Oponerse al tratamiento de sus datos en determinadas circunstancias</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, podés contactarnos por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email: <a href="mailto:contacto@pabloscarlattoentrenamientos.com" className="text-primary">contacto@pabloscarlattoentrenamientos.com</a></li>
              <li>Instagram: <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a></li>
            </ul>
            <p className="mt-2">El plazo para responder a solicitudes es de 5 días hábiles conforme a la ley.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">9. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger los datos personales:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Encriptación de contraseñas (hashing bcrypt)</li>
              <li>Comunicaciones cifradas mediante HTTPS/TLS</li>
              <li>Almacenamiento en servidores con certificación SOC 2 (Supabase)</li>
              <li>Políticas de seguridad a nivel de base de datos (Row Level Security)</li>
              <li>Acceso restringido a datos según roles (cliente/administrador)</li>
              <li>Fotos almacenadas con acceso privado y URLs firmadas temporales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">10. Transferencia Internacional de Datos</h2>
            <p>Los datos se almacenan en servidores de <strong className="text-white">Supabase</strong> (infraestructura cloud de Amazon Web Services) con medidas de seguridad adecuadas, incluyendo encriptación en tránsito y en reposo, certificación SOC 2, y políticas de acceso restringido.</p>
            <p className="mt-2">Uruguay cuenta con la certificación de la Comisión Europea como país con nivel adecuado de protección de datos personales (Decisión 2012/484/UE).</p>
            <p className="mt-2">No transferimos datos a terceros, salvo:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>MercadoPago: exclusivamente para procesar pagos</li>
              <li>Cuando sea requerido por orden judicial o autoridad competente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">11. Conservación de Datos</h2>
            <p>Los datos personales se conservan durante la vigencia de la relación contractual y por un período adicional de 5 años conforme a las obligaciones legales y tributarias aplicables en Uruguay.</p>
            <p className="mt-2">El usuario puede solicitar la eliminación anticipada de sus datos, sujeto a las obligaciones legales de conservación.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">12. Menores de Edad</h2>
            <p>El servicio está dirigido a personas mayores de 18 años. Los menores de edad (14 a 17 años) pueden utilizar el servicio con autorización y supervisión de sus padres o tutores legales, conforme al artículo 7 de la Ley N° 18.331.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">13. Cookies y Datos de Navegación</h2>
            <p>La plataforma utiliza almacenamiento local (localStorage) para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mantener la sesión del usuario activa</li>
              <li>Guardar preferencias de idioma</li>
              <li>Registrar visitas anónimas a la plataforma</li>
            </ul>
            <p className="mt-2">No utilizamos cookies de rastreo de terceros ni herramientas de publicidad.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">14. Órgano de Control</h2>
            <p>El órgano competente para recibir denuncias o reclamos en materia de protección de datos en Uruguay es la <strong className="text-white">Unidad Reguladora y de Control de Datos Personales (URCDP)</strong>.</p>
            <p className="mt-2">Sitio web: <a href="https://www.gub.uy/unidad-reguladora-control-datos-personales/" className="text-primary" target="_blank" rel="noopener noreferrer">www.gub.uy/unidad-reguladora-control-datos-personales</a></p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">15. Modificaciones</h2>
            <p>Esta política puede ser actualizada periódicamente. Cualquier cambio será notificado a través de la plataforma. El uso continuado del servicio después de las modificaciones implica la aceptación de la política actualizada.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">16. Contacto</h2>
            <p>Para cualquier consulta sobre esta política de privacidad o el tratamiento de sus datos personales:</p>
            <p className="mt-2">Instagram: <a href="https://instagram.com/pabloscarlattoentrenamientos" className="text-primary">@pabloscarlattoentrenamientos</a></p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-card-border text-center">
          <Link href="/terminos" className="text-primary hover:underline text-sm">
            Ver Términos y Condiciones
          </Link>
        </div>
      </div>
    </main>
  );
}
