import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Store, StoreRecord, Identifiable, QueryOptions } from "./store";

// Simple file-backed JSON store for local/dev usage when no Supabase
// credentials are configured. Not meant for concurrent multi-instance
// production use, but perfectly adequate for running the app locally or
// for a small team pointed at a single dev server.

const DATA_DIR = path.join(process.cwd(), "src", "data");
const DB_FILE = path.join(DATA_DIR, "local-db.json");

type Database = Record<string, StoreRecord[]>;

// Very small in-process write queue to avoid interleaved read/modify/write
// races when multiple requests hit the store concurrently.
let writeChain: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeChain.then(fn, fn);
  writeChain = result.catch(() => undefined);
  return result;
}

// Serverless platforms (Vercel, most others) run functions on a read-only
// filesystem, so this store cannot persist anything there. Fail fast with a
// clear, actionable message instead of a confusing raw ENOENT/EROFS error
// the first time someone tries to write (e.g. logging in).
function assertWritableEnvironment(): void {
  const looksServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
  );
  if (looksServerless) {
    throw new Error(
      "O banco de dados local (arquivo JSON) não funciona em ambientes serverless como a " +
        "Vercel, porque o sistema de arquivos é somente leitura em produção. Configure o " +
        "Supabase definindo NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas " +
        "variáveis de ambiente do projeto na Vercel (veja o README, seção 'Conectando " +
        "dados e integrações reais' e rode as migrations em supabase/migrations)."
    );
  }
}

async function ensureDb(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify({}, null, 2), "utf-8");
    }
  } catch (err) {
    assertWritableEnvironment();
    throw err;
  }
}

async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, "utf-8");
  try {
    return JSON.parse(raw) as Database;
  } catch {
    return {};
  }
}

async function writeDb(db: Database): Promise<void> {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    assertWritableEnvironment();
    throw err;
  }
}

function matches<T extends Identifiable>(record: T, where?: Partial<Record<keyof T, unknown>>) {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    const recordValue = (record as Record<string, unknown>)[key];
    if (Array.isArray(recordValue)) return recordValue.includes(value);
    return recordValue === value;
  });
}

export class LocalJsonStore implements Store {
  isLive(): boolean {
    return false;
  }

  async list<T extends Identifiable>(table: string, opts: QueryOptions<T> = {}): Promise<T[]> {
    const db = await readDb();
    let rows = ((db[table] ?? []) as T[]).filter((r) => matches(r, opts.where));
    if (opts.orderBy) {
      const { field, dir } = opts.orderBy;
      rows = [...rows].sort((a, b) => {
        const av = a[field] as unknown;
        const bv = b[field] as unknown;
        if (av === bv) return 0;
        const cmp = (av as number | string) > (bv as number | string) ? 1 : -1;
        return dir === "asc" ? cmp : -cmp;
      });
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  }

  async get<T extends Identifiable>(table: string, id: string): Promise<T | null> {
    const db = await readDb();
    const rows = (db[table] ?? []) as T[];
    return rows.find((r) => r.id === id) ?? null;
  }

  async insert<T extends Identifiable>(table: string, data: Partial<T> & { id?: string }): Promise<T> {
    return enqueue(async () => {
      const db = await readDb();
      if (!db[table]) db[table] = [];
      const record = { ...data, id: data.id ?? randomUUID() } as T;
      db[table].push(record as unknown as StoreRecord);
      await writeDb(db);
      return record;
    });
  }

  async update<T extends Identifiable>(table: string, id: string, patch: Partial<T>): Promise<T> {
    return enqueue(async () => {
      const db = await readDb();
      const rows = (db[table] ?? []) as T[];
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`Record ${id} not found in ${table}`);
      rows[idx] = { ...rows[idx], ...patch, id } as T;
      db[table] = rows as unknown as StoreRecord[];
      await writeDb(db);
      return rows[idx];
    });
  }

  async remove(table: string, id: string): Promise<void> {
    return enqueue(async () => {
      const db = await readDb();
      db[table] = (db[table] ?? []).filter((r) => r.id !== id);
      await writeDb(db);
    });
  }
}
