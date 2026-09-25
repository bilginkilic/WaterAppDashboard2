/**
 * Local API backed by the in-memory Firebase, for end-to-end tests from the
 * mobile repo (WaterAppDaily: `npm run test:live`). Never touches real data.
 */
process.env.WATERAPP_FAKE_FIREBASE = '1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-jwt-secret';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('../src/app');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fakeFirebase } = require('../src/config/firebase');

const app = createApp();
// Test-only: expose the in-memory collections so a test can build dashboard rows
// from exactly what the API stored. Exists only in this e2e server.
app.get('/__e2e/store', (_req: unknown, res: { json: (body: unknown) => void }) => {
  const out: Record<string, Array<Record<string, unknown>>> = {};
  for (const [name, docs] of fakeFirebase.store.collections) {
    out[name] = [...docs.entries()].map(([id, data]: [string, Record<string, unknown>]) => ({ id, ...data }));
  }
  res.json(out);
});
app.post('/__e2e/reset', (_req: unknown, res: { json: (body: unknown) => void }) => {
  fakeFirebase.store.reset();
  fakeFirebase.auth.users.clear();
  res.json({ ok: true });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`E2E API (in-memory Firebase) on http://localhost:${port}/api`);
});
