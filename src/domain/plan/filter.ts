import type { Exercise } from '../content';
import type { Einschraenkung } from '../profile';

/**
 * Abbildung Einschränkung auf Übung (Pflichtenheft Kapitel 5):
 * knie / ruecken / handgelenke -> belastungen, kein_boden -> boden = true, schwangerschaft -> schwangerschaft_geeignet = false.
 */
export function isAllowed(exercise: Exercise, einschraenkungen: Einschraenkung[]): boolean {
  for (const e of einschraenkungen) {
    switch (e) {
      case 'knie':
        if (exercise.belastungen.includes('knie')) return false;
        break;
      case 'ruecken':
        if (exercise.belastungen.includes('ruecken')) return false;
        break;
      case 'handgelenke':
        if (exercise.belastungen.includes('handgelenke')) return false;
        break;
      case 'kein_boden':
        if (exercise.boden) return false;
        break;
      case 'schwangerschaft':
        if (!exercise.schwangerschaft_geeignet) return false;
        break;
    }
  }
  return true;
}

export function filterExercises(
  exercises: Exercise[],
  einschraenkungen: Einschraenkung[],
): Exercise[] {
  return exercises.filter((e) => isAllowed(e, einschraenkungen));
}
