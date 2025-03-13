import { IPlayer } from './player.type';
import { IOption } from './option.type';

export type IPlayerStats = Omit<IPlayer, 'id' | 'nationalities' | 'date_of_birth' | 'first_name' | 'last_name'>;

export const playerStatsOptions: IOption<keyof IPlayerStats>[] = [
  { label: 'Max Speed (km/h)', value: 'max_speed_kmh' },
  { label: 'Number of Sprints', value: 'number_of_sprints' },
  { label: 'Distance Covered (km)', value: 'distance_covered_km' },
  { label: 'Running Distance (km)', value: 'distance_covered_running_km' },
  { label: 'Number of Passes', value: 'number_of_passes' },
  { label: 'Number of successful Passes', value: 'number_of_successful_passes' },
  { label: 'Number of Fouls', value: 'number_of_fouls' },
];
