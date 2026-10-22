import { and, eq } from 'drizzle-orm';
import { favorites } from '../db/schema';
import type { AppDb } from '../db/types';

export type FavoriteType = 'workout' | 'exercise';

export function createFavoriteRepository(db: AppDb) {
  const where = (type: FavoriteType, id: string) =>
    and(eq(favorites.itemType, type), eq(favorites.itemId, id));
  const has = (type: FavoriteType, id: string) =>
    db.select().from(favorites).where(where(type, id)).get() !== undefined;
  return {
    list(type: FavoriteType): string[] {
      return db
        .select()
        .from(favorites)
        .where(eq(favorites.itemType, type))
        .all()
        .map((r) => r.itemId);
    },
    has,
    /** Schaltet den Favoriten um und liefert den neuen Zustand. */
    toggle(type: FavoriteType, id: string): boolean {
      if (has(type, id)) {
        db.delete(favorites).where(where(type, id)).run();
        return false;
      }
      db.insert(favorites).values({ itemType: type, itemId: id }).run();
      return true;
    },
    deleteAll(): void {
      db.delete(favorites).run();
    },
  };
}

export type FavoriteRepository = ReturnType<typeof createFavoriteRepository>;
