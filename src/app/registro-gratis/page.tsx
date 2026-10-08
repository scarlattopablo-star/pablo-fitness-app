import { redirect } from "next/navigation";

// La prueba gratis publica se elimino: todo el que entra desde la web paga.
// El acceso gratis solo lo da Pablo con codigos (/acceso-gratis, /cliente-directo).
export default function RegistroGratisPage() {
  redirect("/planes");
}
