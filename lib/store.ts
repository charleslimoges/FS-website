import fs from "fs";
import path from "path";
import { Building } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

interface Store {
  buildings: Record<string, Building>;
  units: string[];
}

function defaultStore(): Store {
  return { buildings: {}, units: [] };
}

export function getStore(): Store {
  try {
    if (!fs.existsSync(STORE_PATH)) return defaultStore();
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as Store;
  } catch {
    return defaultStore();
  }
}

function saveStore(store: Store): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function addBuilding(building: Building): void {
  const store = getStore();
  store.buildings[building.id] = building;
  saveStore(store);
}

export function removeBuilding(id: string): void {
  const store = getStore();
  delete store.buildings[id];
  saveStore(store);
}

export function addUnits(ids: string[]): void {
  const store = getStore();
  const set = new Set(store.units);
  ids.forEach((id) => set.add(id));
  store.units = Array.from(set);
  saveStore(store);
}

export function removeUnit(id: string): void {
  const store = getStore();
  store.units = store.units.filter((uid) => uid !== id);
  saveStore(store);
}

export function isUnitPublished(id: string): boolean {
  return getStore().units.includes(id);
}
