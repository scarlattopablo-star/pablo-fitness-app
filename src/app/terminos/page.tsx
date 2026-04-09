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
            <h2 className="text-white font-bold text-lg mb-3">10. Fuentes Científicas y Profesionales</h2>
            <p>Los planes de entrenamiento y nutrición ofrecidos por la plataforma están basados en las siguientes fuentes científicas y guías profesionales reconocidas internacionalmente:</p>

            <h3 className="text-white font-semibold mt-4 mb-2">Entrenamiento Físico</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">ACSM (American College of Sports Medicine)</strong> — Position Stand: Progression Models in Resistance Training for Healthy Adults (2009). Guías actualizadas 2026 para entrenamiento de resistencia.</li>
              <li><strong className="text-white">NSCA (National Strength and Conditioning Association)</strong> — Essentials of Strength Training and Conditioning. Principios de periodización, priorización muscular e intensidad basada en series y repeticiones.</li>
              <li><strong className="text-white">Ainsworth BE et al. (2011)</strong> — Compendium of Physical Activities: A Second Update of Codes and MET Values. <em>Medicine & Science in Sports & Exercise</em>, 43(8), 1575-1581. Utilizado para la estimación de calorías quemadas por sesión.</li>
              <li><strong className="text-white">Schoenfeld BJ et al. (2016)</strong> — Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. <em>Sports Medicine</em>, 46(11), 1689-1697. Base para la frecuencia de entrenamiento de 2x/semana por grupo muscular.</li>
            </ul>

            <h3 className="text-white font-semibold mt-4 mb-2">Nutrición y Metabolismo</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Harris JA, Benedict FG (1918)</strong> — A Biometric Study of Human Basal Metabolism. <em>Proceedings of the National Academy of Sciences</em>, 4(12), 370-373. Ecuacion utilizada para el calculo de la Tasa Metabolica Basal (TMB) y el Gasto Energetico Diario Total (TDEE).</li>
              <li><strong className="text-white">USDA FoodData Central</strong> — Base de datos de composicion de alimentos del Departamento de Agricultura de los Estados Unidos. Todos los valores nutricionales (calorias, proteinas, carbohidratos, grasas, fibra) provienen de esta fuente.</li>
              <li><strong className="text-white">ACSM/AND/DC Joint Position Statement</strong> — Nutrition and Athletic Performance (2016). Guias de timing nutricional y distribucion de macronutrientes para deportistas.</li>
              <li><strong className="text-white">ISSN (International Society of Sports Nutrition)</strong> — Position Stand: Protein and Exercise (Jager et al., 2017). <em>Journal of the International Society of Sports Nutrition</em>, 14(20). Ingesta de 1.4-2.0 g/kg/dia de proteina y 20-40g de proteina por comida para deportistas.</li>
              <li><strong className="text-white">ISSA (International Sports Sciences Association)</strong> — Guias de distribucion de macronutrientes para desarrollo muscular y perdida de grasa. Porciones minimas recomendadas: 80-150g de proteina animal por comida (para alcanzar 20-40g de proteina), 50-200g de carbohidratos complejos por comida.</li>
            </ul>

            <h3 className="text-white font-semibold mt-4 mb-2">Porciones y Sustitucion de Alimentos</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">NIDDK (National Institute of Diabetes and Digestive and Kidney Diseases)</strong> — Porciones de los alimentos: como escoger justo lo suficiente. Guias de tamano de porcion por grupo alimentario.</li>
              <li><strong className="text-white">Equivalencia calorica</strong> — Las sustituciones de alimentos dentro de la plataforma se calculan manteniendo las calorias totales y el perfil de macronutrientes de la comida original, con porciones minimas realistas por categoria: proteinas (min. 80g), carbohidratos (min. 50g), lacteos (min. 100g), frutas y vegetales (min. 50g), grasas (min. 5g).</li>
              <li><strong className="text-white">Morton RW et al. (2018)</strong> — A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. <em>British Journal of Sports Medicine</em>, 52(6), 376-384. Base para la distribucion de proteina en 4-6 comidas diarias.</li>
            </ul>

            <h3 className="text-white font-semibold mt-4 mb-2">Restricciones Alimentarias</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">AND (Academy of Nutrition and Dietetics)</strong> — Position Paper on Vegetarian Diets (2016, actualizado 2021). Guías para dietas vegetarianas y veganas nutricionalmente adecuadas, incluyendo combinación de proteínas complementarias.</li>
              <li><strong className="text-white">ADA (American Diabetes Association)</strong> — Standards of Medical Care in Diabetes (2024). Guías para selección de carbohidratos de bajo índice glucémico y distribución de macros para personas con diabetes.</li>
              <li><strong className="text-white">Celiac Disease Foundation</strong> — Guías para dieta libre de gluten, incluyendo prevención de contaminación cruzada y alimentos seguros.</li>
              <li><strong className="text-white">NIH/NIDDK (National Institute of Diabetes and Digestive and Kidney Diseases)</strong> — Guías de manejo de intolerancia a la lactosa, alternativas de calcio y sustituciones alimentarias.</li>
              <li><strong className="text-white">FARE (Food Allergy Research & Education)</strong> — Guías para manejo de alergia a frutos secos, incluyendo alternativas con semillas.</li>
            </ul>

            <p className="mt-4"><strong className="text-white">Nota importante:</strong> Si bien los planes se basan en fuentes científicas reconocidas, estos no reemplazan la consulta con un profesional médico o nutricionista. Cada persona es única y puede requerir adaptaciones específicas según su condición de salud.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">11. Uso de la Aplicacion Movil</h2>
            <p>La aplicacion movil de Pablo Scarlatto Entrenamientos funciona como un cliente que accede al servicio web principal. Su uso esta sujeto a las siguientes condiciones:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>La aplicacion requiere conexion a internet para funcionar correctamente</li>
              <li>Las notificaciones push son opcionales y pueden activarse o desactivarse en cualquier momento desde la configuracion del dispositivo</li>
              <li>La aplicacion puede actualizarse sin previo aviso para mejorar la experiencia del usuario, corregir errores o incorporar nuevas funcionalidades</li>
              <li>Se utiliza almacenamiento local (localStorage) unicamente para guardar preferencias del usuario y mejorar la experiencia de uso</li>
              <li>La aplicacion no accede a datos del dispositivo (camara, contactos, ubicacion, etc.) sin el consentimiento expreso del usuario</li>
              <li>La aplicacion esta disponible para dispositivos iOS y Android</li>
              <li>El uso de la aplicacion esta sujeto a los terminos adicionales de Apple App Store y Google Play Store segun corresponda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">12. Contacto</h2>
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
