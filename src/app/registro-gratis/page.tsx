import { redirect } from "next/navigation";

// El registro gratuito (primer mes gratis) fue discontinuado para cuentas
// nuevas: ahora hay que contratar un plan. Mantenemos la ruta para que los
// links viejos (emails de difusion, bookmarks) no queden rotos y lleven a los
// planes pagos. Los usuarios que YA tienen prueba activa la conservan hasta que
// vence (la logica de trial sigue intacta en auth-context).
export default function RegistroGratisPage() {
  redirect("/planes");
}
