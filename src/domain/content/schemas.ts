import { z } from 'zod';

export const ZONES = ['bauch', 'arme', 'brust', 'po', 'beine', 'ganzkoerper', 'ruecken'] as const;
export const BELASTUNGEN = ['knie', 'ruecken', 'handgelenke', 'bauchlage', 'rueckenlage'] as const;
export const CATEGORIES = [
  'wall_pilates',
  'ganzkoerper',
  'bauch',
  'po_beine',
  'arme',
  'ruecken_haltung',
  'stretching',
  'anfaenger',
] as const;

export const zoneSchema = z.enum(ZONES);
export const belastungSchema = z.enum(BELASTUNGEN);
export const categorySchema = z.enum(CATEGORIES);
export const levelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const text = z.object({ de: z.string().min(1), en: z.string().min(1) });
const textList = (min: number, max: number) =>
  z.object({
    de: z.array(z.string().min(1)).min(min).max(max),
    en: z.array(z.string().min(1)).min(min).max(max),
  });

/** /D020/ Übung */
export const exerciseSchema = z
  .object({
    id: z.string().regex(/^ex\d{2}_[a-z0-9_]+$/),
    name: text,
    beschreibung: text,
    schritte: textList(3, 5),
    atemhinweis: text,
    fehler: textList(2, 3),
    zielzonen: z.array(zoneSchema).min(1),
    level: levelSchema,
    rolle: z.enum(['aufwaermen', 'haupt', 'cooldown']),
    typ: z.enum(['zeit', 'wiederholung']),
    standard_dauer_s: z.number().int().positive().optional(),
    standard_wdh: z.number().int().positive().optional(),
    wand: z.boolean(),
    boden: z.boolean(),
    belastungen: z.array(belastungSchema),
    schwangerschaft_geeignet: z.boolean(),
    premium: z.boolean(),
    met_wert: z.number().positive(),
    variante_leicht_id: z.string().optional(),
    variante_schwer_id: z.string().optional(),
  })
  .refine(
    (e) => (e.typ === 'zeit' ? e.standard_dauer_s !== undefined : e.standard_wdh !== undefined),
    {
      message: 'zeit braucht standard_dauer_s, wiederholung braucht standard_wdh',
    },
  );

export const workoutEntrySchema = z
  .object({
    uebung_id: z.string(),
    dauer_s: z.number().int().positive().optional(),
    wdh: z.number().int().positive().optional(),
    reihenfolge: z.number().int().positive(),
  })
  .refine((e) => (e.dauer_s === undefined) !== (e.wdh === undefined), {
    message: 'genau eines von dauer_s oder wdh',
  });

/** /D030/ Workout */
export const workoutSchema = z.object({
  id: z.string().min(1),
  titel: text,
  kategorie: categorySchema,
  level: levelSchema,
  zielzonen: z.array(zoneSchema).min(1),
  uebungen: z.array(workoutEntrySchema).min(1),
  pause_s: z.number().int().nonnegative(),
  geschaetzte_dauer: z.number().int().positive(),
  premium: z.boolean(),
});

export const challengeDaySchema = z.object({
  tag: z.number().int().positive(),
  ruhetag: z.boolean(),
  workout_id: z.string().optional(),
});

export const challengeSchema = z.object({
  id: z.string().min(1),
  titel: text,
  beschreibung: text,
  level: levelSchema,
  tage: z.number().int().positive(),
  premium: z.boolean(),
  plan: z.array(challengeDaySchema).min(1),
});

export const exercisesFileSchema = z.array(exerciseSchema);
export const workoutsFileSchema = z.array(workoutSchema);
export const challengesFileSchema = z.array(challengeSchema);
