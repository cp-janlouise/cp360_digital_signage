// src/frontend/pages/store/usersStore.ts
export type Role = "superAdmin" | "admin" | "contentManager" | "viewer";

export type UserStatus = "active" | "inactive";

export type UserItem = {
  id: string;
  username: string;
  email: string;
  role: Role;
  organization_id: string;
  status: UserStatus;
  createdAt: string;
};

type UserCreate = {
  username: string;
  email: string;
  role: Role;
  organization_id: string;
  status: UserStatus;
};

type UserUpdate = Partial<Pick<UserItem, "username" | "email" | "role" | "organization_id" | "status">>;

const LS_USERS_KEY = "cp360_users_v1";
const LS_CURRENT_USER_KEY = "cp360_current_user_id";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readUsers(): UserItem[] {
  return safeParse<UserItem[]>(localStorage.getItem(LS_USERS_KEY), []);
}

function writeUsers(next: UserItem[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(next));
  emit();
}

function uid(prefix = "user"): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function subscribeUsers(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUsers(): UserItem[] {
  return readUsers();
}

export function addUser(payload: UserCreate): UserItem {
  const users = readUsers();

  const emailLower = payload.email.trim().toLowerCase();
  if (users.some((u) => u.email.trim().toLowerCase() === emailLower)) {
    throw new Error("Email already exists.");
  }

  const item: UserItem = {
    id: uid("usr"),
    username: payload.username.trim(),
    email: payload.email.trim(),
    role: payload.role,
    organization_id: payload.organization_id,
    status: payload.status,
    createdAt: new Date().toISOString(),
  };

  writeUsers([item, ...users]);
  return item;
}

export function updateUser(userId: string, patch: UserUpdate): UserItem {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("User not found.");

  const next: UserItem = {
    ...users[idx],
    ...patch,
  };

  const emailLower = next.email.trim().toLowerCase();
  if (users.some((u) => u.id !== userId && u.email.trim().toLowerCase() === emailLower)) {
    throw new Error("Email already exists.");
  }

  const updated = [...users];
  updated[idx] = next;
  writeUsers(updated);
  return next;
}

export function deleteUser(userId: string) {
  const users = readUsers();
  writeUsers(users.filter((u) => u.id !== userId));
}

export function seedUserIfMissing(seed: UserItem) {
  const users = readUsers();
  if (users.some((u) => u.id === seed.id)) return;

  writeUsers([seed, ...users]);

  // If no current user exists yet, default to this seeded user.
  const cur = getCurrentUserId();
  if (!cur) setCurrentUserId(seed.id);
}

// ── “Logged in user” helpers (simple localStorage auth shim) ──────────────────

export function getCurrentUserId(): string {
  return localStorage.getItem(LS_CURRENT_USER_KEY) ?? "";
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem(LS_CURRENT_USER_KEY, userId);
  emit();
}

export function getCurrentUser(): UserItem | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return readUsers().find((u) => u.id === id) ?? null;
}