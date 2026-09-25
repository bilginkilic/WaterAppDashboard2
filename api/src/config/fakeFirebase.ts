/**
 * In-memory stand-in for the parts of firebase-admin this API uses. Enabled with
 * WATERAPP_FAKE_FIREBASE=1 for tests and the local e2e server; never in production.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static now() {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
  toMillis() {
    return this.toDate().getTime();
  }
}

class ArrayUnion {
  constructor(public values: any[]) {}
}

const FieldValue = {
  arrayUnion: (...values: any[]) => new ArrayUnion(values),
};

let idCounter = 0;
const newId = () => `fake${(++idCounter).toString(36)}${Date.now().toString(36)}`;

function applyWrite(existing: Doc | undefined, data: Doc): Doc {
  const out: Doc = { ...(existing || {}) };
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof ArrayUnion) {
      const current: any[] = Array.isArray(out[key]) ? [...out[key]] : [];
      for (const v of value.values) {
        if (!current.some((c) => JSON.stringify(c) === JSON.stringify(v))) current.push(v);
      }
      out[key] = current;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export class FakeStore {
  collections = new Map<string, Map<string, Doc>>();

  col(name: string) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return this.collections.get(name)!;
  }

  reset() {
    this.collections.clear();
  }
}

function snapshotOf(ref: DocRef) {
  const data = ref.store.col(ref.collection).get(ref.id);
  return { id: ref.id, ref, exists: data !== undefined, data: () => (data ? { ...data } : undefined) };
}

class DocRef {
  constructor(public store: FakeStore, public collection: string, public id: string) {}
  async get() {
    return snapshotOf(this);
  }
  async set(data: Doc, options?: { merge?: boolean }) {
    const col = this.store.col(this.collection);
    col.set(this.id, applyWrite(options?.merge ? col.get(this.id) : undefined, data));
  }
  async update(data: Doc) {
    const col = this.store.col(this.collection);
    if (!col.has(this.id)) throw new Error(`No document to update: ${this.collection}/${this.id}`);
    col.set(this.id, applyWrite(col.get(this.id), data));
  }
  async delete() {
    this.store.col(this.collection).delete(this.id);
  }
}

class Query {
  constructor(
    public store: FakeStore,
    public collection: string,
    private filters: Array<[string, string, any]> = [],
    private max?: number,
  ) {}
  where(field: string, op: string, value: any) {
    if (op !== '==') throw new Error(`Fake Firestore supports only ==, got ${op}`);
    return new Query(this.store, this.collection, [...this.filters, [field, op, value]], this.max);
  }
  limit(n: number) {
    return new Query(this.store, this.collection, this.filters, n);
  }
  orderBy() {
    return this;
  }
  async get() {
    const col = this.store.col(this.collection);
    let docs = [...col.entries()]
      .filter(([, d]) => this.filters.every(([f, , v]) => d[f] === v))
      .map(([id]) => snapshotOf(new DocRef(this.store, this.collection, id)));
    if (this.max !== undefined) docs = docs.slice(0, this.max);
    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach: (fn: (d: any) => void) => docs.forEach(fn),
    };
  }
}

class CollectionRef extends Query {
  doc(id?: string) {
    return new DocRef(this.store, this.collection, id || newId());
  }
  async add(data: Doc) {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

interface FakeUser {
  uid: string;
  email: string;
  password: string;
  displayName?: string;
  metadata: { creationTime: string; lastSignInTime: string | null };
}

export class FakeAuth {
  users = new Map<string, FakeUser>();

  async createUser({ email, password, displayName }: { email: string; password: string; displayName?: string }) {
    if ([...this.users.values()].some((u) => u.email === email)) {
      const err: any = new Error('The email address is already in use by another account.');
      err.code = 'auth/email-already-exists';
      throw err;
    }
    const user: FakeUser = {
      uid: newId(),
      email,
      password,
      displayName,
      metadata: { creationTime: new Date().toUTCString(), lastSignInTime: null },
    };
    this.users.set(user.uid, user);
    return this.publicUser(user);
  }

  async getUser(uid: string) {
    const user = this.users.get(uid);
    if (!user) {
      const err: any = new Error('There is no user record corresponding to the provided identifier.');
      err.code = 'auth/user-not-found';
      throw err;
    }
    return this.publicUser(user);
  }

  async deleteUser(uid: string) {
    this.users.delete(uid);
  }

  async listUsers() {
    return { users: [...this.users.values()].map((u) => this.publicUser(u)) };
  }

  async updateUser(uid: string, patch: Partial<FakeUser>) {
    const user = this.users.get(uid);
    if (!user) throw new Error('user not found');
    Object.assign(user, patch);
    return this.publicUser(user);
  }

  async generatePasswordResetLink(email: string) {
    return `https://example.invalid/reset?email=${encodeURIComponent(email)}`;
  }

  /** Mirrors identitytoolkit signInWithPassword: returns the uid or null. */
  signIn(email: string, password: string): string | null {
    const user = [...this.users.values()].find((u) => u.email === email && u.password === password);
    if (!user) return null;
    user.metadata.lastSignInTime = new Date().toUTCString();
    return user.uid;
  }

  private publicUser(u: FakeUser) {
    const { password: _password, ...rest } = u;
    return { ...rest, metadata: { ...u.metadata } };
  }
}

export function createFakeAdmin() {
  const store = new FakeStore();
  const auth = new FakeAuth();
  const firestoreInstance = {
    collection: (name: string) => new CollectionRef(store, name),
    batch: () => {
      const ops: Array<() => Promise<void>> = [];
      return {
        delete: (ref: DocRef) => ops.push(() => ref.delete()),
        set: (ref: DocRef, data: Doc, options?: { merge?: boolean }) => ops.push(() => ref.set(data, options)),
        update: (ref: DocRef, data: Doc) => ops.push(() => ref.update(data)),
        commit: async () => {
          for (const op of ops) await op();
        },
      };
    },
  };
  const firestore: any = () => firestoreInstance;
  firestore.Timestamp = Timestamp;
  firestore.FieldValue = FieldValue;

  return {
    apps: [{}],
    firestore,
    auth: () => auth,
    __fake: { store, auth },
  };
}
