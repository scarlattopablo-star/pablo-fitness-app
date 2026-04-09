import { NextRequest, NextResponse } from "next/server";

const attempts = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Check rate limit
  const record = attempts.get(ip);
  if (record) {
    if (record.lockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta en ${minutesLeft} minutos.` },
        { status: 429 }
      );
    }
    if (record.lockedUntil <= Date.now() && record.count >= 3) {
      // Reset after lock period
      attempts.delete(ip);
    }
  }

  const { pin } = await request.json();
  const correctPin = process.env.ADMIN_2FA_PIN || "000000";

  if (pin === correctPin) {
    attempts.delete(ip);
    return NextResponse.json({ success: true });
  }

  // Wrong PIN
  const current = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  current.count += 1;

  if (current.count >= 3) {
    current.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
    attempts.set(ip, current);
    return NextResponse.json(
      { error: "Demasiados intentos. Bloqueado por 15 minutos." },
      { status: 429 }
    );
  }

  attempts.set(ip, current);
  return NextResponse.json(
    { error: `PIN incorrecto. ${3 - current.count} intentos restantes.` },
    { status: 401 }
  );
}
