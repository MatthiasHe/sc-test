import { IPlayerStats } from './player-stats.type';

export type IStatFilter = {
  value: keyof IPlayerStats;
  min: number;
  max: number;
};
