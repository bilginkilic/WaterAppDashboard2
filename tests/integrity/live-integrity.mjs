#!/usr/bin/env node
/**
 * Read-only integrity check of live dashboard data, through the admin API.
 * Prints counts and shortened uids only — no names or e-mails.
 *
 *   DASHBOARD_URL=https://waterappdaily.netlify.app ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:integrity
 *
 * Exit code 1 when a hard rule is broken; warnings alone exit 0.
 */
const BASE = (process.env.DASHBOARD_URL || 'http://localhost:3000').replace(/\/$/, '');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
// Lowest possible survey total with the current questions.js (see WaterAppDaily integrity test).
const THEORETICAL_MIN_INITIAL = Number(process.env.THEORETICAL_MIN_INITIAL || 10380);
const ORGANIZATIONS = ['MUFG Turkey', 'MUFG London'];

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD');
  process.exit(2);
}

const login = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
if (!login.ok) {
  console.error(`Admin login failed: ${login.status}`);
  process.exit(2);
}
const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
const res = await fetch(`${BASE}/api/admin/users`, { headers: { cookie } });
if (!res.ok) {
  console.error(`Users API failed: ${res.status}`);
  process.exit(2);
}
const { users } = await res.json();

const short = (id) => `${String(id).slice(0, 6)}…`;
const errors = [];
const warnings = [];
const emails = new Map();

for (const u of users) {
  const { initial, current } = u.waterprint || {};
  const id = short(u.id);
  if (initial != null && (typeof initial !== 'number' || initial < 0)) errors.push(`${id}: invalid initial ${initial}`);
  if (current != null && (typeof current !== 'number' || current < 0)) errors.push(`${id}: invalid current ${current}`);
  if (initial != null && current != null && current > initial) errors.push(`${id}: current ${current} > initial ${initial}`);
  if (current != null && initial == null) errors.push(`${id}: current without initial`);
  if (u.organization != null && !ORGANIZATIONS.includes(u.organization)) errors.push(`${id}: unknown organisation`);
  if (initial != null && initial < THEORETICAL_MIN_INITIAL) {
    warnings.push(`${id}: initial ${initial} < ${THEORETICAL_MIN_INITIAL} (older app question values?)`);
  }
  if (!u.organization) warnings.push(`${id}: no organisation label`);
  const key = (u.email || '').toLowerCase();
  if (key) emails.set(key, (emails.get(key) || 0) + 1);
}
for (const [, n] of emails) if (n > 1) errors.push(`duplicate e-mail across ${n} rows`);

const withProfile = users.filter((u) => u.waterprint?.initial != null).length;
const improved = users.filter((u) => u.waterprint?.current != null && u.waterprint.current < u.waterprint.initial).length;
console.log(`Users: ${users.length} | with survey: ${withProfile} | completed ≥1 challenge: ${improved}`);
console.log(`By organisation: ${ORGANIZATIONS.map((o) => `${o}=${users.filter((u) => u.organization === o).length}`).join(', ')}, none=${users.filter((u) => !u.organization).length}`);
warnings.forEach((w) => console.log(`WARN  ${w}`));
errors.forEach((e) => console.log(`ERROR ${e}`));
console.log(errors.length ? `✗ ${errors.length} error(s), ${warnings.length} warning(s)` : `✓ no errors, ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
