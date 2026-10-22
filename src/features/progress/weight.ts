import { getRepositories } from '@/data/init';
import type { DateKey } from '@/domain/dates';
import { useProfile } from '@/state/profile';

/**
 * Gewichtseinträge (/F730/, /F840/), nur mit Einwilligung (/F038/). Das Profilgewicht folgt dem
 * jüngsten Eintrag, damit kcal und BMI aktuell bleiben.
 */
function canStore(): boolean {
  return !!useProfile.getState().profile?.einwilligungGesundheitsdaten;
}

function syncProfileWeight(): void {
  const latest = getRepositories().weight.latest();
  if (latest) useProfile.getState().update({ gewichtKg: latest.gewichtKg });
}

export function addWeight(datum: DateKey, kg: number): boolean {
  if (!canStore()) return false;
  getRepositories().weight.add(datum, kg);
  syncProfileWeight();
  return true;
}

export function updateWeight(id: number, datum: DateKey, kg: number): void {
  if (!canStore()) return;
  getRepositories().weight.update(id, { datum, gewichtKg: kg });
  syncProfileWeight();
}

export function removeWeight(id: number): void {
  getRepositories().weight.delete(id);
  syncProfileWeight();
}
