export function normalizeEthiopianPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  for (let i = 0; i < 3; i += 1) {
    if (digits.startsWith("251") && digits.length > 9) {
      digits = digits.slice(3);
      continue;
    }
    if (digits.startsWith("0") && digits.length === 10) {
      digits = digits.slice(1);
      continue;
    }
    break;
  }
  return digits;
}

/** Direct Telegram chat link from an Ethiopian local phone (9XXXXXXXX / 7XXXXXXXX). */
export function telegramContactFromPhone(raw: string): string | null {
  const local = normalizeEthiopianPhone(raw);
  if (!/^[79]\d{8}$/.test(local)) return null;
  return `https://t.me/+251${local}`;
}
