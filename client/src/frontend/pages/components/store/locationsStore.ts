export type LocationItem = {
  location_id: string; // PK
  organization_id: string; // FK
  name: string;
  address: string;
  created_at: string;
};

const STORAGE_KEY = "cp360.locations.v1";
const EVENT_NAME = "cp360:locations:changed";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getLocations(): LocationItem[] {
  return safeJsonParse<LocationItem[]>(localStorage.getItem(STORAGE_KEY), []);
}

function setLocations(next: LocationItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeLocations(listener: () => void) {
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

export function addLocation(input: {
  organization_id: string;
  name: string;
  address: string;
}): LocationItem {
  const now = new Date().toISOString();
  const item: LocationItem = {
    location_id: "CEBU" + crypto.randomUUID().slice(0, 3).toUpperCase(),
    organization_id: input.organization_id,
    name: input.name.trim(),
    address: input.address.trim(),
    created_at: now,
  };

  const current = getLocations();
  setLocations([item, ...current]);
  return item;
}

export function updateLocation(
  location_id: string,
  patch: Partial<Pick<LocationItem, "organization_id" | "name" | "address">>
) {
  const current = getLocations();
  const next = current.map((l) =>
    l.location_id === location_id
      ? {
          ...l,
          organization_id:
            patch.organization_id !== undefined ? patch.organization_id : l.organization_id,
          name: patch.name !== undefined ? patch.name.trim() : l.name,
          address: patch.address !== undefined ? patch.address.trim() : l.address,
        }
      : l
  );
  setLocations(next);
}

export function deleteLocation(location_id: string) {
  const current = getLocations();
  const next = current.filter((l) => l.location_id !== location_id);
  setLocations(next);
}