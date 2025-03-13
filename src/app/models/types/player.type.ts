export type IPlayer = {
  id: number;
  nationalities: string[] | { name: string }[];
  first_name: string;
  last_name: string;
  date_of_birth: string;
  max_speed_kmh: number;
  number_of_sprints: number;
  distance_covered_km: number;
  distance_covered_running_km: number;
  number_of_passes: number;
  number_of_successful_passes: number;
  number_of_fouls: number;
};
