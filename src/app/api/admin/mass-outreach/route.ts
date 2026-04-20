import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

const ADMIN_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f"; // Pablo's admin user ID

// Users and their personalized messages
interface UserMessage {
  userId: string;
  name: string;
  email: string;
  type: "trial" | "trial-3m" | "directo";
  pushTitle: string;
  pushBody: string;
  chatMessage: string;
  emailSubject: string;
  emailBody: string;
}

function buildMessages(): UserMessage[] {
  const trialUsers = [
    { userId: "a9c7d0d4-e928-422e-a00b-20daa0bc5198", name: "Javier", email: "urujand@gmail.com" },
    { userId: "19777700-34d6-4daa-b39a-40d74378af3f", name: "Maria Pia", email: "pipiaznarez@gmail.com" },
    { userId: "8ec03fc0-ccb7-4071-a99a-00a87edadd05", name: "Marcelo", email: "marcelolampa@gmail.com" },
    { userId: "2114185f-c36a-4943-9e3f-867710d3a906", name: "Sofia", email: "sofisquiton@gmail.com" },
    { userId: "e0bb814f-26f1-416a-a13d-f3994724ae1e", name: "Irene", email: "irene_9105@hotmail.com" },
    { userId: "3101e086-c959-4223-888e-81c8033fd659", name: "Horacio", email: "horacio.rodriguez.che@gmail.com" },
    { userId: "abcd6113-3dc1-474f-9b22-6cb0c6a01592", name: "Lucas", email: "palermolucas20@gmail.com" },
    { userId: "b9befaec-05cf-4377-8718-22928f2ee59d", name: "Agustina", email: "agus24martinez24@gmail.com" },
    { userId: "2f3af638-b659-44fe-b95e-817b550ef7aa", name: "Camila", email: "camila18aylenferreira@gmail.com" },
    { userId: "52dcd54c-bc82-4174-875f-f73c23054e6e", name: "Seba", email: "sebastianvillalba7@hotmail.com" },
    { userId: "8d41a760-6056-4cea-85e8-c14b02a2ddd1", name: "Yemina", email: "yemina19britos@gmail.com" },
    { userId: "457986d4-5173-4f0f-8b74-37a941deefbe", name: "Hazael", email: "hazaelmanzur@gmail.com" },
    { userId: "be243bbf-1caf-4bf4-993d-babf0d36a1fb", name: "Candelaria", email: "candelariabasso@gmail.com" },
    { userId: "4a94aa22-f2af-4e58-bb91-e72036a06a69", name: "Sofia F.", email: "as.ferreirapascale@gmail.com" },
    { userId: "c7d34e5b-9780-4ec5-8ce8-cd2af0d5ad3b", name: "Daniel", email: "danielglisenti28@gmail.com" },
  ];

  const trial3mUsers = [
    { userId: "52949da8-8b2f-46e6-b113-18f6f097e6b3", name: "Fernando", email: "morebengo@hotmail.com" },
    { userId: "1097ebb2-89c7-4e88-a694-e6c64a404005", name: "Camila O.", email: "camicaluca@gmail.com" },
    { userId: "0793521c-572f-427d-93ca-cd81a8a17127", name: "Micaela", email: "micaelalong99@gmail.com" },
  ];

  const directUsers = [
    { userId: "e2601bbf-2bc4-49f3-9f6c-b9507b48daae", name: "Fabricio", email: "bossio.fabricio@gmail.com" },
    { userId: "14a32164-b7c0-4ab2-ae6b-837138ce0d2e", name: "Ginette", email: "ginettedelgado@hotmail.com" },
    { userId: "12f4d509-db89-4241-9930-cbddc5c3e6be", name: "Yan-Li", email: "ychemacias@gmail.com" },
    { userId: "b4d5db98-1e24-4014-9992-29d466541a9e", name: "Belen", email: "bgrezzi10@gmail.com" },
    { userId: "d07c8979-f0d4-41c1-89ac-46c606203a96", name: "Eliana", email: "elianamorales1996@hotmail.com" },
    { userId: "0b459a64-0b9c-4d61-b5e5-7262a5ff29d5", name: "Florencia", email: "florencisdiaz@gmail.com" },
    { userId: "198bb53b-5550-4065-a347-78a06f7c6587", name: "Paulina", email: "paulinaberriel@gmail.com" },
    { userId: "57916875-ddc3-4bde-8d9b-9806ac020845", name: "Daniel C.", email: "cunietti@gmail.com" },
    { userId: "59213861-e329-495f-80af-832e98ea0bd6", name: "Cecilia", email: "cecilia.cascardi@gmail.com" },
    { userId: "0abbfb48-3406-4763-beb8-013d9e8c112e", name: "David", email: "dacercoolex@hotmail.com" },
  ];

  const messages: UserMessage[] = [];

  // Trial users (1 month) - SELL
  for (const u of trialUsers) {
    messages.push({
      ...u,
      type: "trial",
      pushTitle: `${u.name}, tu prueba se acaba pronto`,
      pushBody: "Primer mes GRATIS en cualquier plan — sin tarjeta. No te lo pierdas!",
      chatMessage: `Hola ${u.name}! Soy Pablo. Vi que estás usando la app, qué bueno! Como te viene yendo?\n\nTe cuento que tengo una promo activa hasta fin de mayo: PRIMER MES GRATIS en cualquier plan, sin tarjeta de crédito. Entrás, probás el plan completo personalizado y recién al segundo mes se cobra.\n\nSi te interesa escribime y te paso el link directo para activarlo. Dale que son pocos lugares este mes!`,
      emailSubject: `${u.name}, Primer mes GRATIS — sin tarjeta`,
      emailBody: buildTrialEmail(u.name),
    });
  }

  // Trial 3-month users - ENGAGE
  for (const u of trial3mUsers) {
    messages.push({
      ...u,
      type: "trial-3m",
      pushTitle: `${u.name}, como va el entreno?`,
      pushBody: "Escribime si necesitás ajustar algo de tu rutina!",
      chatMessage: `Hola ${u.name}! Soy Pablo. Como viene el entrenamiento con la app? Quería saber si necesitás algo, alguna rutina específica o algún ajuste. Estoy para ayudarte a sacarle el máximo! Escribime cualquier duda.`,
      emailSubject: `${u.name}, estoy para ayudarte - Pablo Scarlatto`,
      emailBody: buildEngageEmail(u.name),
    });
  }

  // Direct clients - TESTIMONIAL + REFERRAL
  for (const u of directUsers) {
    messages.push({
      ...u,
      type: "directo",
      pushTitle: `${u.name}, te pido un favor!`,
      pushBody: "Me ayudás con un testimonio? Tengo 15% OFF para tus referidos",
      chatMessage: `Hola ${u.name}! Como estás? Te quería pedir un favor: me ayudarías con un testimonio cortito de tu experiencia entrenando conmigo? Puede ser un audio o un mensajito, me re sirve para la app.\n\nY si conocés a alguien que le interese entrenar, tengo 15% OFF para referidos. Pasale este link: pabloscarlattoentrenamientos.com/registro-gratis`,
      emailSubject: `${u.name}, me ayudás con algo? - Pablo Scarlatto`,
      emailBody: buildReferralEmail(u.name),
    });
  }

  return messages;
}

function buildTrialEmail(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#10b981;margin:0;">Pablo Scarlatto</h1>
    <p style="color:#888;font-size:14px;">Entrenamientos Personalizados</p>
  </div>
  <h2 style="color:#fff;">Hola ${name}!</h2>
  <p style="color:#ccc;line-height:1.6;">Vi que estás probando la app y me encanta. Quería contarte que <strong style="color:#CDFF00;">tenés el PRIMER MES GRATIS</strong> en cualquier plan — sin tarjeta de crédito.</p>
  <div style="background:#1a1a2e;border:1px solid #CDFF00;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
    <p style="color:#888;margin:0 0 5px;">Oferta de lanzamiento</p>
    <p style="font-size:28px;font-weight:bold;color:#CDFF00;margin:0;">Primer mes GRATIS</p>
    <p style="color:#888;font-size:13px;margin:5px 0 0;">Rutina personalizada + Videos + Seguimiento + Chat directo</p>
    <p style="color:#888;font-size:13px;margin:5px 0 0;">Sin tarjeta. Recién al segundo mes se cobra.</p>
  </div>
  <div style="text-align:center;margin:30px 0;">
    <a href="https://pabloscarlattoentrenamientos.com/planes" style="background:#CDFF00;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Ver Planes</a>
  </div>
  <p style="color:#888;font-size:13px;text-align:center;">Oferta hasta fin de mayo. Pocos lugares este mes!</p>
  <hr style="border:none;border-top:1px solid #333;margin:30px 0;">
  <p style="color:#666;font-size:12px;text-align:center;">Pablo Scarlatto Entrenamientos<br>pabloscarlattoentrenamientos.com</p>
</div>
</body>
</html>`;
}

function buildEngageEmail(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#10b981;margin:0;">Pablo Scarlatto</h1>
    <p style="color:#888;font-size:14px;">Entrenamientos Personalizados</p>
  </div>
  <h2 style="color:#fff;">Hola ${name}!</h2>
  <p style="color:#ccc;line-height:1.6;">Quería saber como viene tu entrenamiento con la app. Necesitás alguna rutina específica o algún ajuste?</p>
  <p style="color:#ccc;line-height:1.6;">Estoy para ayudarte a sacarle el máximo provecho. Respondé este email o escribime directo por la app!</p>
  <div style="text-align:center;margin:30px 0;">
    <a href="https://pabloscarlattoentrenamientos.com/dashboard" style="background:#10b981;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Abrir la App</a>
  </div>
  <hr style="border:none;border-top:1px solid #333;margin:30px 0;">
  <p style="color:#666;font-size:12px;text-align:center;">Pablo Scarlatto Entrenamientos<br>pabloscarlattoentrenamientos.com</p>
</div>
</body>
</html>`;
}

function buildReferralEmail(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#111;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#10b981;margin:0;">Pablo Scarlatto</h1>
    <p style="color:#888;font-size:14px;">Entrenamientos Personalizados</p>
  </div>
  <h2 style="color:#fff;">Hola ${name}!</h2>
  <p style="color:#ccc;line-height:1.6;">Te quería pedir un favor: me ayudarías con un <strong style="color:#10b981;">testimonio cortito</strong> de tu experiencia entrenando conmigo? Puede ser un audio o un mensajito. Me re sirve para la app!</p>
  <p style="color:#ccc;line-height:1.6;">Y si conocés a alguien que le interese entrenar, tengo <strong style="color:#10b981;">15% OFF para referidos</strong>. Pasale este link:</p>
  <div style="background:#1a1a2e;border:1px solid #10b981;border-radius:12px;padding:15px;margin:20px 0;text-align:center;">
    <a href="https://pabloscarlattoentrenamientos.com/registro-gratis" style="color:#10b981;font-size:14px;">pabloscarlattoentrenamientos.com/registro-gratis</a>
  </div>
  <div style="text-align:center;margin:30px 0;">
    <a href="https://pabloscarlattoentrenamientos.com/dashboard/chat" style="background:#10b981;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Responder por la App</a>
  </div>
  <hr style="border:none;border-top:1px solid #333;margin:30px 0;">
  <p style="color:#666;font-size:12px;text-align:center;">Pablo Scarlatto Entrenamientos<br>pabloscarlattoentrenamientos.com</p>
</div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // Simple admin auth via secret header
    const secret = request.headers.get("x-admin-secret");
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      ADMIN_SECRET,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Configure VAPID
    const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
    const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
    if (pub && priv) {
      webpush.setVapidDetails(
        process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
        pub, priv
      );
    }

    // Configure Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const allMessages = buildMessages();
    const results = {
      push: { sent: 0, failed: 0, noSubscription: 0 },
      chat: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
      details: [] as string[],
    };

    for (const msg of allMessages) {
      // 1. PUSH NOTIFICATION
      try {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("user_id", msg.userId);

        if (subs && subs.length > 0) {
          const payload = JSON.stringify({
            title: msg.pushTitle,
            body: msg.pushBody,
            url: "/dashboard/chat",
          });

          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              );
              results.push.sent++;
            } catch (err: unknown) {
              const statusCode = (err as { statusCode?: number })?.statusCode;
              if (statusCode === 410 || statusCode === 404) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              }
              results.push.failed++;
            }
          }
        } else {
          results.push.noSubscription++;
        }
      } catch {
        results.push.failed++;
      }

      // 2. CHAT MESSAGE (insert as Pablo into private conversation)
      try {
        const [user1, user2] = msg.userId < ADMIN_ID
          ? [msg.userId, ADMIN_ID]
          : [ADMIN_ID, msg.userId];

        // Get or create conversation
        let conversationId: string;
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("user1_id", user1)
          .eq("user2_id", user2)
          .single();

        if (existing) {
          conversationId = existing.id;
        } else {
          const { data: created, error: convErr } = await supabase
            .from("conversations")
            .insert({ user1_id: user1, user2_id: user2 })
            .select("id")
            .single();
          if (convErr || !created) throw convErr || new Error("Could not create conversation");
          conversationId = created.id;
        }

        // Insert message from Pablo
        const { error: msgErr } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: ADMIN_ID,
          content: msg.chatMessage,
        });

        if (msgErr) throw msgErr;

        // Update conversation last message
        await supabase.from("conversations").update({
          last_message_at: new Date().toISOString(),
          last_message_preview: msg.chatMessage.substring(0, 100),
        }).eq("id", conversationId);

        results.chat.sent++;
      } catch {
        results.chat.failed++;
      }

      // 3. EMAIL via Resend
      try {
        await resend.emails.send({
          from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
          to: msg.email,
          subject: msg.emailSubject,
          html: msg.emailBody,
        });
        results.email.sent++;
      } catch {
        results.email.failed++;
      }

      // Small delay between users to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    results.details.push(`Total usuarios: ${allMessages.length}`);
    results.details.push(`Trial 1-mes (venta): ${allMessages.filter(m => m.type === "trial").length}`);
    results.details.push(`Trial 3-meses (engage): ${allMessages.filter(m => m.type === "trial-3m").length}`);
    results.details.push(`Directos (testimonio): ${allMessages.filter(m => m.type === "directo").length}`);

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
