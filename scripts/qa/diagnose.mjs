import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
console.log(JSON.stringify({ environment: { urlConfigured: Boolean(url), publishableKeyConfigured: Boolean(key), serviceKeyConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), projectRef: url ? new URL(url).hostname.split('.')[0] : null } }));
if (!url || !key) process.exit(1);
for (const [name, path] of [['authSettings', '/auth/v1/settings'], ['profiles', '/rest/v1/profiles?select=id&limit=0'], ['codingProfiles', '/rest/v1/coding_profiles?select=platform&limit=0'], ['colleges', '/rest/v1/colleges?select=id&limit=0']]) {
  try {
    const response = await fetch(`${url}${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(12000) });
    const body = await response.json().catch(() => ({}));
    console.log(JSON.stringify({ name, status: response.status, ...(name === 'authSettings' ? { googleEnabled: body.external?.google, emailEnabled: body.external?.email, signupDisabled: body.disable_signup, emailConfirmationRequired: !body.mailer_autoconfirm } : { code: body.code }) }));
  } catch (error) { console.log(JSON.stringify({ name, error: error.cause?.code ?? error.name })); process.exitCode = 1; }
}
