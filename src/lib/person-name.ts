/** Limpia un nombre tipeado rapido: saca simbolos sueltos y pone mayuscula inicial ("ashley\" → "Ashley"). */
export function cleanPersonName(raw: string): string {
  return raw
    .replace(/[^\p{L}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());
}
