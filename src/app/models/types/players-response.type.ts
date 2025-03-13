import { IPlayer } from './player.type';

export type IPlayersResponse = {
 count: number;
 next: string;
 results: IPlayer[];
};
