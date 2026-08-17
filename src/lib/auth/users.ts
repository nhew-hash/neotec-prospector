import bcrypt from "bcryptjs";
import { getStore, TABLES } from "@/lib/db";
import type { PublicUser, User } from "@/types";
import { ensureSeedUsers } from "./seed";

export function toPublicUser(user: User): PublicUser {
  const { password_hash: _password_hash, ...rest } = user;
  void _password_hash;
  return rest;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureSeedUsers();
  const store = getStore();
  const users = await store.list<User>(TABLES.users, { where: { email } });
  return users[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureSeedUsers();
  const store = getStore();
  return store.get<User>(TABLES.users, id);
}

export async function listUsers(): Promise<User[]> {
  await ensureSeedUsers();
  const store = getStore();
  return store.list<User>(TABLES.users, { orderBy: { field: "name", dir: "asc" } });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
