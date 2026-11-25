import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

// Store server credentials only in the existing ignored local environment file.
const executable = process.argv[2];
if (!executable) throw new Error('Pass the installed Supabase CLI executable path.');
const result = spawnSync(executable, ['projects', 'api-keys', '--project-ref', 'sfnmcgcxerbqceujzbqv', '--reveal', '-o', 'json'], { encoding: 'utf8', windowsHide: true });
if (result.status !== 0) throw new Error('The CLI could not read project API keys.');
let payload; try { payload = JSON.parse(result.stdout); } catch { throw new Error('The CLI returned an unexpected API key response.'); }
const objects = [];
function visit(value) { if (!value || typeof value !== 'object') return; if (!Array.isArray(value)) objects.push(value); for (const part of Object.values(value)) if (typeof part === 'object') visit(part); }
visit(payload);
const entry = objects.find((item) => item.name === 'service_role' && typeof item.api_key === 'string') ?? objects.find((item) => item.type === 'secret' && typeof item.api_key === 'string');
if (!entry || entry.api_key.includes('...')) { console.log(JSON.stringify({ configured: false, responseShapes: objects.slice(0, 5).map((item) => Object.keys(item)) })); process.exit(1); }
const path = '.env.local'; let content = readFileSync(path, 'utf8');
if (!/^SUPABASE_SERVICE_ROLE_KEY=/m.test(content)) content += `\nSUPABASE_SERVICE_ROLE_KEY=${entry.api_key}\n`;
if (!/^CRON_SECRET=/m.test(content)) content += `CRON_SECRET=${randomBytes(32).toString('hex')}\n`;
writeFileSync(path, content);
console.log(JSON.stringify({ serverKeyConfigured: true, cronSecretConfigured: true, destination: '.env.local', secretsPrinted: false }));
