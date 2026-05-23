/**
 * Seeds 10 challenge participants via the public API (register → profile → task updates).
 * Usage: npx ts-node src/scripts/seed-challenge-users.ts
 */
import '../load-env';

const API_BASE = process.env.SEED_API_URL || 'http://localhost:3001/api';
const RUN_ID = process.env.SEED_RUN_ID || Date.now().toString(36);
const USER_COUNT = Number(process.env.SEED_USER_COUNT || 10);

interface SurveyAnswer {
  questionId: number;
  answer: string;
  valueTotal: number;
  valueSaving: number;
  type: 'Task' | 'Achievement';
  category: string;
  timestamp: string;
}

function buildSurveyAnswers(seed: number): SurveyAnswer[] {
  const base = 80 + seed * 12;
  return Array.from({ length: 10 }, (_, i) => {
    const isAchievement = i % 2 === 0;
    return {
      questionId: i + 1,
      answer: isAchievement ? 'Yes' : 'No',
      valueTotal: base + i * 5,
      valueSaving: isAchievement ? 10 + seed : 0,
      type: isAchievement ? 'Achievement' : 'Task',
      category: ['dishwashing', 'shower', 'laundry', 'plumbing', 'daily'][i % 5],
      timestamp: new Date().toISOString(),
    };
  });
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data as T;
}

async function seedUser(index: number) {
  const n = String(index + 1).padStart(2, '0');
  const email = `challenge-${RUN_ID}-user${n}@waterapp.test`;
  const password = 'Challenge123!';
  const name = `Challenge User ${n}`;

  let registerRes: { userId: string; token: string };
  try {
    registerRes = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('already')) {
      throw err;
    }
    const loginRes = await api<{ userId: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    registerRes = loginRes;
  }

  const answers = buildSurveyAnswers(index);
  const initialWaterprint = answers.reduce((s, a) => s + a.valueTotal, 0);
  const achievementCount = answers.filter((a) => a.type === 'Achievement').length;

  await api('/waterprint/initial-profile', {
    method: 'POST',
    headers: { Authorization: `Bearer ${registerRes.token}` },
    body: JSON.stringify({
      initialWaterprint,
      answers,
      correctAnswersCount: achievementCount,
    }),
  });

  const completedTasks = Math.min(3, index % 4);
  let currentWaterprint = initialWaterprint;
  for (let t = 0; t < completedTasks; t++) {
    const reduction = 15 + t * 5 + index;
    currentWaterprint = Math.max(0, currentWaterprint - reduction);
    await api('/waterprint/update', {
      method: 'POST',
      headers: { Authorization: `Bearer ${registerRes.token}` },
      body: JSON.stringify({
        currentWaterprint,
        taskId: `q${t + 1}`,
        waterprintReduction: reduction,
      }),
    });
  }

  return {
    email,
    userId: registerRes.userId,
    initialWaterprint,
    currentWaterprint,
    completedTasks,
    saved: initialWaterprint - currentWaterprint,
  };
}

async function main() {
  console.log(`\n🌊 Seeding ${USER_COUNT} challenge users (run=${RUN_ID}) → ${API_BASE}\n`);
  const results = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const row = await seedUser(i);
    results.push(row);
    console.log(`  ✓ ${row.email} | ${row.initialWaterprint}L → ${row.currentWaterprint}L (saved ${row.saved}L)`);
  }
  console.log(`\n✅ Seeded ${results.length} users\n`);
  console.log(JSON.stringify({ runId: RUN_ID, users: results }, null, 2));
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
