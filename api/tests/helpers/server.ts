import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { createApp } from '../../src/app';
import { fakeFirebase } from '../../src/config/firebase';

export interface TestServer {
  base: string;
  close: () => Promise<void>;
  api: <T = any>(path: string, init?: { method?: string; token?: string; body?: unknown }) => Promise<{ status: number; data: T }>;
}

export async function startServer(): Promise<TestServer> {
  const server: Server = await new Promise((resolve) => {
    const s = createApp().listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}/api`;
  return {
    base,
    close: () => new Promise((resolve) => server.close(() => resolve())),
    api: async (path, { method = 'GET', token, body } = {}) => {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    },
  };
}

export function resetStore() {
  fakeFirebase!.store.reset();
  fakeFirebase!.auth.users.clear();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collection(name: string): Array<Record<string, any>> {
  return [...fakeFirebase!.store.col(name).entries()].map(([id, data]) => ({ id, ...data }));
}
