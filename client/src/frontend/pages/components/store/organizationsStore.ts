import '/src/frontend/styles/organizations.css';


export type OrganizationItem = {
  organization_id: string; // PK
  name: string;
  description: string;
  created_at: string;
};

const STORAGE_KEY = "cp360.organizations.v1";
const EVENT_NAME = "cp360:organizations:changed";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getOrganizations(): OrganizationItem[] {
  return safeJsonParse<OrganizationItem[]>(localStorage.getItem(STORAGE_KEY), []);
}

function setOrganizations(next: OrganizationItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeOrganizations(listener: () => void) {
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

export function addOrganization(input: { name: string; description: string }): OrganizationItem {
  const now = new Date().toISOString();

  const org: OrganizationItem = {
    organization_id: "ORG_" + crypto.randomUUID().slice(0, 5).toUpperCase(),
    name: input.name.trim(),
    description: input.description.trim(),
    created_at: now,
  };

  const current = getOrganizations();
  setOrganizations([org, ...current]);
  return org;
}

export function updateOrganization(
  organization_id: string,
  patch: Partial<Pick<OrganizationItem, "name" | "description">>
) {
  const current = getOrganizations();
  const next = current.map((o) =>
    o.organization_id === organization_id
      ? {
          ...o,
          name: patch.name !== undefined ? patch.name.trim() : o.name,
          description:
            patch.description !== undefined ? patch.description.trim() : o.description,
        }
      : o
  );
  setOrganizations(next);
}

export function deleteOrganization(organization_id: string) {
  const current = getOrganizations();
  const next = current.filter((o) => o.organization_id !== organization_id);
  setOrganizations(next);
}