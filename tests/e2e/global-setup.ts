import { LOCAL_SUPABASE } from "../../playwright.config";

export const ADMIN = { email: "e2e-admin@luxewatch.test", password: "E2eAdmin!2345" };

const headers = {
  apikey: LOCAL_SUPABASE.secretKey,
  Authorization: `Bearer ${LOCAL_SUPABASE.secretKey}`,
  "Content-Type": "application/json",
};

/** Ensure an admin user exists in the local stack and clear checkout rate-limit rows. */
export default async function globalSetup() {
  const create = await fetch(`${LOCAL_SUPABASE.url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: ADMIN.email,
      password: ADMIN.password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Admin" },
    }),
  });
  if (!create.ok && create.status !== 422) {
    throw new Error(`Could not create admin user: ${create.status} ${await create.text()}`);
  }

  const list = await fetch(`${LOCAL_SUPABASE.url}/auth/v1/admin/users?per_page=1000`, { headers });
  const { users } = (await list.json()) as { users: { id: string; email: string }[] };
  const admin = users.find((u) => u.email === ADMIN.email);
  if (!admin) throw new Error("Admin user not found after creation");

  const promote = await fetch(`${LOCAL_SUPABASE.url}/rest/v1/lw_profiles?id=eq.${admin.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role: "admin" }),
  });
  if (!promote.ok) throw new Error(`Could not promote admin: ${await promote.text()}`);

  await fetch(`${LOCAL_SUPABASE.url}/rest/v1/lw_checkout_attempts?id=gt.0`, {
    method: "DELETE",
    headers,
  });
  await fetch(`${LOCAL_SUPABASE.url}/rest/v1/lw_rate_events?id=gt.0`, {
    method: "DELETE",
    headers,
  });
}
