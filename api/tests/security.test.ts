import jwt from 'jsonwebtoken';
import { startServer, resetStore, TestServer } from './helpers/server';

let srv: TestServer;

beforeAll(async () => {
  srv = await startServer();
});
afterAll(() => srv.close());
beforeEach(() => resetStore());

async function user(email: string) {
  const { data } = await srv.api<{ userId: string; token: string }>('/auth/register', {
    method: 'POST',
    body: { email, password: 'Secret123!', name: email },
  });
  return data;
}

it('waterprint routes need a token', async () => {
  expect((await srv.api('/waterprint/sync', { method: 'POST', body: {} })).status).toBe(401);
  expect((await srv.api('/waterprint/progress/anyone')).status).toBe(401);
});

it('a token signed with the old public default secret is rejected', async () => {
  const forged = jwt.sign({ userId: 'victim' }, 'your-secret-key');
  expect((await srv.api('/waterprint/progress/victim', { token: forged })).status).toBe(401);
});

it("a user cannot read another user's progress", async () => {
  const alice = await user('alice@waterapp.test');
  const bob = await user('bob@waterapp.test');
  const res = await srv.api(`/waterprint/progress/${alice.userId}`, { token: bob.token });
  expect(res.status).toBe(403);
});

it('admin statistics and leaderboards need an admin token', async () => {
  const u = await user('carol@waterapp.test');
  expect((await srv.api('/admin/statistics')).status).toBe(401);
  expect((await srv.api('/admin/statistics', { token: u.token })).status).toBe(403);
  expect((await srv.api('/admin/leaderboards', { token: u.token })).status).toBe(403);

  const login = await srv.api<{ token: string }>('/admin/login', {
    method: 'POST',
    body: { email: 'admin@waterapp.test', password: 'admin-pass' },
  });
  expect(login.status).toBe(200);
  const stats = await srv.api('/admin/statistics', { token: login.data.token });
  expect(stats.status).toBe(200);
  expect(stats.data).toEqual(expect.objectContaining({ totalUsers: 1 }));
});

it('wrong admin password is rejected', async () => {
  const res = await srv.api('/admin/login', { method: 'POST', body: { email: 'admin@waterapp.test', password: 'x' } });
  expect(res.status).toBe(401);
});

it('reset-password no longer lets a caller set any uid\'s password', async () => {
  const victim = await user('dave@waterapp.test');
  const res = await srv.api('/auth/reset-password', {
    method: 'POST',
    body: { token: victim.userId, newPassword: 'hijacked!' },
  });
  expect(res.status).toBe(410);
  const login = await srv.api('/auth/login', { method: 'POST', body: { email: 'dave@waterapp.test', password: 'hijacked!' } });
  expect(login.status).toBe(401);
});

it('server errors never leak internals', async () => {
  const u = await user('erin@waterapp.test');
  const res = await srv.api('/waterprint/update', { method: 'POST', token: u.token, body: { taskId: 't', waterprintReduction: 1 } });
  expect(res.status).toBe(404);
  expect(JSON.stringify(res.data)).not.toMatch(/stack|Error:/);
});
