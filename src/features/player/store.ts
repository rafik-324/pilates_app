import { getContent } from '@/data/content/loader';
import { getRepositories } from '@/data/init';
import { createPlayerService, type PlayerService } from './service';

export function getPlayerService(): PlayerService {
  const { exercises, workouts, challenges } = getContent();
  return createPlayerService({ repos: getRepositories(), exercises, workouts, challenges });
}
