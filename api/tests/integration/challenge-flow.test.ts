/**
 * Integration: mobile-like API flow (register → survey profile → task update → progress).
 * Requires API running at SEED_API_URL or http://localhost:3001/api
 */
const API_BASE = process.env.SEED_API_URL || 'http://localhost:3001/api';

async function api<T>(path: string, options: RequestInit = {}): Promise<{ status: number; data: T }> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

describe('Challenge API integration', () => {
  const runId = `it-${Date.now()}`;
  let token = '';
  let userId = '';
  const email = `integration-${runId}@waterapp.test`;
  const password = 'Integration123!';

  it('registers a new user', async () => {
    const { status, data } = await api<{ userId: string; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: 'Integration User' }),
    });
    expect(status).toBe(201);
    expect(data.token).toBeTruthy();
    expect(data.userId).toBeTruthy();
    token = data.token;
    userId = data.userId;
  });

  it('creates initial waterprint profile with survey answers', async () => {
    const answers = [
      { questionId: 1, answer: 'Yes', valueTotal: 15, valueSaving: 10, type: 'Achievement', category: 'dishwashing' },
      { questionId: 2, answer: 'No', valueTotal: 36, valueSaving: 0, type: 'Task', category: 'dishwashing' },
    ];
    const { status, data } = await api<{ profileId: string }>('/waterprint/initial-profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        initialWaterprint: 51,
        answers,
        correctAnswersCount: 1,
      }),
    });
    expect(status).toBe(201);
    expect(data.profileId).toBeTruthy();
  });

  it('updates waterprint after completing a challenge task', async () => {
    const { status, data } = await api<{ newWaterprint: number; totalReduction: number }>(
      '/waterprint/update',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentWaterprint: 51,
          taskId: 'q2',
          waterprintReduction: 21,
        }),
      }
    );
    expect(status).toBe(200);
    expect(data.newWaterprint).toBe(30);
    expect(data.totalReduction).toBeGreaterThan(0);
  });

  it('returns progress for the user', async () => {
    const { status, data } = await api<{
      initialWaterprint: number;
      currentWaterprint: number;
      completedTasks: unknown[];
    }>(`/waterprint/progress/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.initialWaterprint).toBe(51);
    expect(data.currentWaterprint).toBe(30);
    expect(Array.isArray(data.completedTasks)).toBe(true);
    expect(data.completedTasks.length).toBeGreaterThan(0);
  });

  it('rejects requests with invalid token', async () => {
    const { status } = await api('/waterprint/initial-profile', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token' },
      body: JSON.stringify({ initialWaterprint: 100, answers: [], correctAnswersCount: 0 }),
    });
    expect(status).toBe(401);
  });
});
