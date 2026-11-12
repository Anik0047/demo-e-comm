export function isBangladeshMobileNumber(value: string): boolean {
  const phone = value.trim();
  return /^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(phone);
}
