export function isOwnerAccount(userId: unknown, verified: unknown): boolean {
  const configured = process.env.OWNER_ACCOUNT_ID?.trim();
  return Boolean(verified === true && typeof userId === "string" && configured &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(configured) && userId === configured);
}
