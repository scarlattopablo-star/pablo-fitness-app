# Instagram Stories — Plan de publicación 20 abril 2026

## 📱 STORY 1 — GymRat Organic (público general)

**Archivo:** `C:\Users\acer\Desktop\GymRat_Organic_Story.mp4` (23 MB, 9:16, ~15s)
**Cuenta:** @pabloscarlattoentrenamientos
**Tipo:** Historia Instagram (dura 24h)
**Momento óptimo:** 18:00-21:00 (tu audiencia uruguaya está más activa)

### Stickers a agregar sobre el video:
1. **Link sticker:** `pabloscarlattoentrenamientos.com/planes`
2. **Countdown sticker** (opcional): "Primer mes GRATIS termina en..." → 31 mayo 23:59
3. **Quiz o encuesta** (engagement):
   - "¿Tu objetivo?" → Bajar grasa / Ganar músculo / Definir / Empezar
4. **Location sticker:** Uruguay

### Caption (texto overlay manual sobre video):
```
Primer mes GRATIS
Rutina + nutrición personalizada
Link arriba ⬆️
```

### Hashtags (primer comentario si se publica como post):
```
#Uruguay #FitnessUruguay #EntrenadorPersonalUruguay #Montevideo
#FitnessMotivation #GymRat #TransformacionFisica #Nutricion
```

---

## 📱 STORY 2 — GymRat Sigma (socios Sigma)

**Archivo:** `C:\Users\acer\Desktop\GymRat_Sigma_Story.mp4` (3.8 MB, 9:16, ~10s)
**Destino:** enviar por **WhatsApp Business** a Sigma (gym)
**NO publicar en stories** — es contenido con el código exclusivo para sus socios

### Mensaje WhatsApp a Sigma (armado):
```
Hola [nombre dueño/manager de Sigma]! Pablo acá.

Te mando el video que te prometí para contarle a tus socios de la alianza.
Los socios de Sigma tienen acceso preferencial a mi app GymRat:

• Plan personalizado con seguimiento directo conmigo
• Primer mes GRATIS
• Código exclusivo: SIGMA10 (10% descuento permanente)

El video está en formato story 9:16 — podés pasarlo como historia o reenviarlo al grupo de socios.

Cualquier cosa me avisás. Gracias!
```

**Archivo adjunto:** `GymRat_Sigma_Story.mp4`

⚠️ **Pendiente:** Crear el código `SIGMA10` en la app (free_access_codes table) antes de enviar. Ver sección "Códigos SIGMA" abajo.

---

## 📱 COMO PUBLICAR DESDE EL TELÉFONO

1. **Copiar el video al teléfono** — USB, iCloud, Google Drive, o email a vos mismo
2. Abrir **Instagram** → tocar la foto de perfil arriba (o el "+") → **Historia**
3. Seleccionar el video de la galería
4. **Stickers** (botón sticker arriba): agregar link, countdown, encuesta
5. **Texto** (botón Aa): agregar overlay "Primer mes GRATIS — Link arriba"
6. **Tu historia** (abajo) → publicar

Tiempo total: 2 minutos.

---

## 🔥 BONUS — Código SIGMA10

Para que el código funcione, hay que crear un registro en la DB. Correr en Supabase SQL Editor:

```sql
INSERT INTO free_access_codes (code, discount_percent, duration_months, active, notes)
VALUES ('SIGMA10', 10, null, true, 'Socios Sigma Gym — alianza abril 2026');
```

*(Ajustar columnas según schema real de `free_access_codes`)*
