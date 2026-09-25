/**
 * Contract: the exact payloads the mobile app sends produce the Firestore
 * documents the dashboard reads (WaterprintProfiles + users).
 */
import fixture from './fixtures/mobile-sync.json';
import { startServer, resetStore, collection, TestServer } from './helpers/server';

let srv: TestServer;

beforeAll(async () => {
  srv = await startServer();
});
afterAll(() => srv.close());
beforeEach(() => resetStore());

const { _comment, ...syncBody } = fixture;

async function registerAndLogin(email = 'e2e@waterapp.test') {
  const reg = await srv.api<{ userId: string; token: string }>('/auth/register', {
    method: 'POST',
    body: { email, password: 'Secret123!', name: 'E2E User' },
  });
  expect(reg.status).toBe(201);
  const login = await srv.api<{ userId: string; token: string; name: string }>('/auth/login', {
    method: 'POST',
    body: { email, password: 'Secret123!' },
  });
  expect(login.status).toBe(200);
  expect(login.data.userId).toBe(reg.data.userId);
  return login.data;
}

it('register + login write the users/{uid} doc the dashboard reads', async () => {
  const { userId, name } = await registerAndLogin();
  expect(name).toBe('E2E User');
  const [user] = collection('users');
  expect(user).toEqual(expect.objectContaining({
    id: userId,
    email: 'e2e@waterapp.test',
    name: 'E2E User',
    createdAt: expect.any(String),
    lastLoginAt: expect.any(String),
  }));
});

it('wrong password and duplicate registration are rejected cleanly', async () => {
  await registerAndLogin();
  const bad = await srv.api('/auth/login', { method: 'POST', body: { email: 'e2e@waterapp.test', password: 'nope' } });
  expect(bad.status).toBe(401);
  const dup = await srv.api('/auth/register', {
    method: 'POST',
    body: { email: 'e2e@waterapp.test', password: 'Secret123!', name: 'Again' },
  });
  expect(dup.status).toBe(409);
});

it('mobile flow: initial-profile → sync → challenge sync → progress', async () => {
  const { userId, token } = await registerAndLogin();

  const created = await srv.api('/waterprint/initial-profile', {
    method: 'POST',
    token,
    body: { initialWaterprint: syncBody.initialWaterprint, answers: syncBody.answers, correctAnswersCount: 0 },
  });
  expect(created.status).toBe(201);

  expect((await srv.api('/waterprint/sync', { method: 'POST', token, body: syncBody })).status).toBe(200);
  // A repeat sync with no change (app launch) must not grow the history.
  expect((await srv.api('/waterprint/sync', { method: 'POST', token, body: syncBody })).status).toBe(200);

  // Q1 challenge completed in the app: dishwasher "Yes" saves 111.
  const afterChallenge = { ...syncBody, currentWaterprint: syncBody.initialWaterprint - 111 };
  expect((await srv.api('/waterprint/sync', { method: 'POST', token, body: afterChallenge })).status).toBe(200);

  const profiles = collection('WaterprintProfiles');
  expect(profiles).toHaveLength(1);
  const profile = profiles[0];
  expect(profile).toEqual(expect.objectContaining({
    userId,
    initialWaterprint: 20996,
    currentWaterprint: 20885,
    createdAt: expect.anything(),
  }));
  expect(profile.initialAssessment.answers).toHaveLength(10);
  expect(profile.initialAssessment.answers[0]).toEqual(expect.objectContaining({
    questionId: 1, answer: 'No', valueTotal: 126, type: 'Task',
  }));
  expect(profile.progressHistory.map((p: { waterprint: number }) => p.waterprint)).toEqual([20996, 20885]);

  const progress = await srv.api<{ initialWaterprint: number; currentWaterprint: number; waterprintReduction: number }>(
    `/waterprint/progress/${userId}`,
    { token }
  );
  expect(progress.status).toBe(200);
  expect(progress.data).toEqual(expect.objectContaining({
    initialWaterprint: 20996, currentWaterprint: 20885, waterprintReduction: 111,
  }));
});

it('/waterprint/update reduces from the stored value, not the client copy', async () => {
  const { token } = await registerAndLogin();
  await srv.api('/waterprint/sync', { method: 'POST', token, body: syncBody });
  const res = await srv.api<{ newWaterprint: number; totalReduction: number }>('/waterprint/update', {
    method: 'POST',
    token,
    // An already-reduced client value used to be reduced a second time.
    body: { taskId: 'q1', currentWaterprint: 20885, waterprintReduction: 111 },
  });
  expect(res.status).toBe(200);
  expect(res.data).toEqual({ newWaterprint: 20885, totalReduction: 111 });
});

it('rejects invalid footprint values', async () => {
  const { token } = await registerAndLogin();
  const cases = [
    { ...syncBody, currentWaterprint: -5 },
    { ...syncBody, currentWaterprint: syncBody.initialWaterprint + 1 },
    { ...syncBody, initialWaterprint: 'abc' },
  ];
  for (const body of cases) {
    expect((await srv.api('/waterprint/sync', { method: 'POST', token, body })).status).toBe(400);
  }
  const upd = await srv.api('/waterprint/update', { method: 'POST', token, body: { taskId: 'x', waterprintReduction: -1 } });
  expect(upd.status).toBe(400);
  expect(collection('WaterprintProfiles')).toHaveLength(0);
});

it('delete-account removes the user and all of their data', async () => {
  const { userId, token } = await registerAndLogin();
  await srv.api('/waterprint/sync', { method: 'POST', token, body: syncBody });
  const del = await srv.api('/auth/delete-account', { method: 'DELETE', token, body: { userId } });
  expect(del.status).toBe(200);
  expect(collection('WaterprintProfiles')).toHaveLength(0);
  expect(collection('users')).toHaveLength(0);
});
