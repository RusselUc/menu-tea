"use server";

export async function validateAdminPin(pin: string): Promise<boolean> {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) return false;
  return pin === adminPin;
}
