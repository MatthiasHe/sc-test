import { Component, inject, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { AppService } from '../../app.service';
import { IOption, IPlayer, IPlayerStats, IStatFilter, playerStatsOptions } from '../../models/types';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,
  ]
})
export class PlayersComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport, { static: false })
  viewPort!: CdkVirtualScrollViewport;

  private appService: AppService = inject(AppService);
  private fb: FormBuilder = inject(FormBuilder);

  filterStatsOptions: IOption<keyof IPlayerStats>[] = playerStatsOptions;
  players: WritableSignal<IPlayer[]> = signal([]);
  selectedPlayer: WritableSignal<IPlayer | null> = signal(null);
  orderBy: WritableSignal<string> = signal('');
  currentPage: WritableSignal<number> = signal(1);
  isLastPage: WritableSignal<boolean> = signal(false);
  nationalitiesOptions: WritableSignal<IOption<string>[]> = signal([]);
  tableColumns: { property: keyof IPlayer; label: string }[] = [
    { property: 'first_name', label: 'First Name' },
    { property: 'last_name', label: 'Last Name' },
    { property: 'nationalities', label: 'Nationalities' },
    { property: 'date_of_birth', label: 'Date of Birth' },
    { property: 'max_speed_kmh', label: 'Max Speed (km/h)' },
    { property: 'number_of_sprints', label: 'Number of Sprints' },
    { property: 'distance_covered_km', label: 'Total Distance (km)' },
    { property: 'distance_covered_running_km', label: 'Running Distance (km)' },
    { property: 'number_of_passes', label: 'Number of Passes' },
    { property: 'number_of_successful_passes', label: 'Successful Passes' },
    { property: 'number_of_fouls', label: 'Number of Fouls' },
  ];
  filterForm: UntypedFormGroup = this.fb.group({
    name: '',
    nationality: '',
    statsFilters: new UntypedFormArray([]),
  });

  get inverseOfTranslation(): string {
    if (!this.viewPort || !this.viewPort['_renderedContentOffset']) {
      return '-0px';
    }
    let offset = this.viewPort['_renderedContentOffset'];
    return `-${offset}px`;
  }

  get selectedStatsFilters(): UntypedFormArray {
    return this.filterForm.get('statsFilters')! as UntypedFormArray;
  }

  get unselectedStatFilter(): IOption<keyof IPlayerStats>[] {
    const usedValues = (this.selectedStatsFilters as UntypedFormArray).getRawValue().map(
      (filter: any) => filter.value
    );

    return this.filterStatsOptions.filter(option => !usedValues.includes(option.value));
  };

  ngOnInit(): void {
    this.appService.getNationalitiesOptions().subscribe(nationalitiesOptions => {
      this.nationalitiesOptions.set(nationalitiesOptions);
    });
    this.updatePlayersList(true);
  }

  getDisplayedNationalities(player: IPlayer): string {
    if (player.nationalities.length === 1) {
      return `${player.nationalities[0]}`;
    } else {
      return `${player.nationalities.join(', ')}`;
    }
  }

  setOrderBy(property: string): void {
    if (this.orderBy() === property) {
      this.orderBy.set(`-${property}`);
    } else if (this.orderBy() === `-${property}`) {
      this.orderBy.set('');
    } else {
      this.orderBy.set(property);
    }

    this.updatePlayersList(true);
  }

  isDisplayedColumn(column: keyof IPlayer): boolean {
    return this.selectedStatsFilters.getRawValue().some(filter => filter.value === column)
      || column === `first_name`
      || column === `last_name`
      || column === `nationalities`;
  }

  onScroll(index: number): void {
    const bufferZone = 10;

    if ((index + bufferZone) === this.players().length && !this.isLastPage()) {
      this.updatePlayersList(false);
    }
  }

  applyFilter() {
    this.updatePlayersList(true);
  }

  addFilter() {
    this.selectedStatsFilters.push(this.fb.group({
      value: this.unselectedStatFilter[0].value,
      min: null,
      max: null,
    }));
  }

  getStatFilterOptions(subFormIndex?: number) {
    const selectedStatFilters = this.selectedStatsFilters
      .getRawValue()
      .map(statFilter => statFilter.value);

    const filteredSelectedStatFilter = selectedStatFilters
      .reduce(
        (x: string[], y: keyof IPlayerStats, index: number) => {
          const statFilter = subFormIndex !== index ? [y] : [];

          return x.concat(statFilter);
        },
        [],
      );

    return this.filterStatsOptions.filter(filterOption => !filteredSelectedStatFilter.includes(filterOption.value));
  }

  displayPlayerInfo(player: IPlayer): void {
    const myDialog = document.querySelector('#playerDialog')! as HTMLDialogElement;

    this.selectedPlayer.set(player);
    myDialog.showModal();
  }

  closePlayerInfo(): void {
    const myDialog = document.querySelector('#playerDialog')! as HTMLDialogElement;
    myDialog.close();
  }

  private updatePlayersList(isToReset: boolean = false): void {
    if (isToReset) {
      this.currentPage.set(1);
    } else {
      this.currentPage.set(this.currentPage() + 1);
    }

    const filters = this.filterForm.value;
    const statFilter: IStatFilter[] = this.selectedStatsFilters.getRawValue();
    this.appService.getPlayers(
      this.currentPage(),
      filters.name,
      this.orderBy(),
      filters.nationality,
      statFilter,
    )
      .pipe(finalize(() => {
        if (isToReset) {
          this.viewPort.scrollToIndex(0);
        }
      }))
      .subscribe(res => {
        const currentLoadedPlayers = this.players();

        this.players.set(
          isToReset
            ? res.results
            : [...currentLoadedPlayers, ...res.results]
        );
        this.isLastPage.set(res.next === null);
      });
  }
}
