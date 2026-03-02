export type Role = "admin" | "tLeader";

export type UserItem = {
  id: string;
  username: string;
  email: string;
  role: Role;
  organization_id: string;
  status: "active" | "inactive";
  createdAt: string;
};

const STORAGE_KEY = "cp360.users.v1";
const EVENT_NAME = "cp360:users:changed";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getUsers(): UserItem[] {
  return safeJsonParse<UserItem[]>(localStorage.getItem(STORAGE_KEY), []);
}

function setUsers(next: UserItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeUsers(listener: () => void) {
  const onCustom = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };

  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function addUser(input: Omit<UserItem, "id" | "createdAt">): UserItem {
  const now = new Date().toISOString();
  const user: UserItem = {
    id: crypto.randomUUID(),
    createdAt: now,
    ...input,
  };

  const current = getUsers();

  // Ensure unique email (case-insensitive)
  const exists = current.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) {
    throw new Error("Email already exists.");
  }

  setUsers([user, ...current]);
  return user;
}

export function updateUser(
  userId: string,
  patch: Partial<Pick<UserItem, "role" | "organization_id" | "status">>
) {
  const current = getUsers();
  const next = current.map((u) =>
    u.id === userId
      ? {
          ...u,
          role: patch.role ?? u.role,
          organization_id: patch.organization_id ?? u.organization_id,
          status: patch.status ?? u.status,
        }
      : u
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function deleteUser(userId: string) {
  const current = getUsers();
  const next = current.filter((u) => u.id !== userId);
  setUsers(next);
}

export function seedUserIfMissing(seed: UserItem) {
  const current = getUsers();
  if (current.some((u) => u.id === seed.id)) return;
  setUsers([seed, ...current]);
}