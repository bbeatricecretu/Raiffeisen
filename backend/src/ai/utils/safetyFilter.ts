const BLOCKED_PHRASES = [
  "ar trebui",
  "îți recomand",
  "recomand",
  "economisește",
  "reduce cheltuielile",
  "investește",
  "bugetează",
  "sfatul meu"
];

export const REFUSAL_TEMPLATE =
  "Nu pot oferi recomandări financiare. Pot însă să explic tranzacțiile sau să te ajut să găsești plăți în istoric.";

export function containsBlockedAdvice(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_PHRASES.some((p) => lower.includes(p));
}

export function enforceNoAdvice(text: string): string {
  return containsBlockedAdvice(text) ? REFUSAL_TEMPLATE : text;
}
