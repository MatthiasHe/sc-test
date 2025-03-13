import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IPlayer } from './models/types/player.type';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IPlayersResponse, IPlayerStats, IStatFilter } from './models/types';
import { IOption } from './models/types/option.type';

@Injectable()
export class AppService {

  private http: HttpClient = inject(HttpClient);
  private readonly baseUrl = 'https://fakeapi.skillcorner.com/api/';

  getNationalitiesOptions(): Observable<IOption<string>[]> {
    return this.http.get<{ name: string }[]>(`${this.baseUrl}nationalities`)
      .pipe(map((nationalities) => nationalities
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((nationality) => ({
          value: nationality.name,
          label: nationality.name,
        })
      )));
  }

  getPlayers(
    page: number,
    search: string | null,
    orderBy: string | null,
    nationality: string | null,
    statFilters: IStatFilter[],
  ): Observable<IPlayersResponse> {
    const pageSize = 99;
    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }

    if (orderBy) {
      params = params.set('ordering', orderBy);
    }

    if (nationality) {
      params = params.set('nationality', nationality);
    }

    if (statFilters.length) {
      statFilters.forEach((statFilter) => {
        if (statFilter.min) {
          params = params.set(`${statFilter.value}_min`, statFilter.min);
        }

        if (statFilter.max) {
          params = params.set(`${statFilter.value}_max`, statFilter.max);
        }
      })
    }

    params = params.set('page', page.toString());
    params = params.set('page_size', pageSize.toString());

    return this.http
      .get<IPlayersResponse>(`${this.baseUrl}players`, { params })
      .pipe(
        map((response) => ({
          ...response,
          results: response.results.map((player) => ({
            ...player,
            nationalities: player.nationalities.map(
              (nationality) => (nationality as { name: string }).name),
          })),
        }))
      );
  }
}
