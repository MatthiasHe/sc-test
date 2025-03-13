import { Component, inject, model, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { AppService } from '../../app.service';
import { IOption, IPlayer, IPlayerStats, playerStatsOptions } from '../../models/types';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ScrollingModule,
    NgClass,
  ]
})
export class AnalyticsComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport, {static: false})
  viewPort!: CdkVirtualScrollViewport;

  private appService: AppService = inject(AppService);
  private fb: FormBuilder = inject(FormBuilder);

  players: WritableSignal<IPlayer[]> = signal([]);
  chart: WritableSignal<Chart | null> = signal(null);
  selectedPlayers: WritableSignal<IPlayer[]> = signal([]);
  orderBy: WritableSignal<string> = signal('');
  currentPage: WritableSignal<number> = signal(1);
  isLastPage: WritableSignal<boolean> = signal(false);
  playerStatsOptions: WritableSignal<IOption<keyof IPlayerStats>[]> = signal(playerStatsOptions);
  nationalitiesOptions: WritableSignal<IOption<string>[]> = signal([]);
  selectedStatProperty = model<keyof IPlayerStats>(this.playerStatsOptions()[0].value);
  onSelectedStatPropertyChange(newProperty: keyof IPlayerStats) {
    this.selectedStatProperty.set(newProperty);
    this.filterForm.reset();
    this.updatePlayersList(true);
    this.destroyChart();
    this.selectedPlayers.set([]);
    this.orderBy.set('')
  }
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
    min: null,
    max: null,
  });

  get inverseOfTranslation(): string {
    if (!this.viewPort || !this.viewPort["_renderedContentOffset"]) {
      return "-0px";
    }
    let offset = this.viewPort["_renderedContentOffset"];
    return `-${offset}px`;
  }

  ngOnInit(): void {
    this.appService.getNationalitiesOptions().subscribe(nationalitiesOptions => {
      this.nationalitiesOptions.set(nationalitiesOptions);
    });
    this.updatePlayersList(true);
  };

  getDisplayedNationalities(player: IPlayer): string {
    if (player.nationalities.length === 1) {
      return `${player.nationalities[0]}`;
    } else {
      return `${player.nationalities.join(', ')}`;
    }
  }

  addPlayerToSelectedList(player: any): void {
    if (!this.isPlayerInList(player)) {
      this.selectedPlayers.set([...this.selectedPlayers(), player]);

      if (this.selectedPlayers().length > 1) {
        this.initBarChart();
      }
    }
  }

  removePlayerFromSelectedList(player: any): void {
    this.selectedPlayers.set(this.selectedPlayers().filter((p) => p.id !== player.id));

    if (this.selectedPlayers().length > 1) {
      this.initBarChart();
    } else {
      this.destroyChart();
    }
  }

  isPlayerInList(player: any): boolean {
    return this.selectedPlayers().some((p) => p.id === player.id);
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
    return this.selectedStatProperty() === column
      || column === `first_name`
      || column === `last_name`
      || column === `nationalities`;
  }

  initBarChart(): void {
    this.destroyChart();

    const data = {
      labels: this.selectedPlayers()
        .map(player => `${player.first_name} ${player.last_name}`),
      datasets: [
        {
          barPercentage: 0.9,
          data: this.selectedPlayers().map(player => player.distance_covered_km),
          backgroundColor: [
            '#8ABBED',
            '#FCD34D',
            '#6EE7B7',
            '#C4B5FD',
            '#FCA5A5',
            '#FDBA74',
            '#5EEAD4',
            '#D8BFD8',
            '#67E8F9',
            '#F9A8D4',
          ],
          hoverOffset: 4,
        },
      ],
    };

    const config = {
      type: 'bar',
      data: data,
      options: {
        aspectRatio: 2,
        responsive: true,
        borderRadius: 2,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: this.playerStatsOptions().find(option => option.value === this.selectedStatProperty())!.label,
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (context: number): string => {
                let unit: string;

                switch (this.selectedStatProperty()) {
                  case 'distance_covered_km':
                  case 'distance_covered_running_km':
                    unit = 'km';
                    break;
                  case 'max_speed_kmh':
                    unit = 'km/h';
                    break;
                  default:
                    unit = '';
                }
                return `${context} ${unit}`;
              },
            },
          },
        },
      },
    };

    const ctx = (document.getElementById(`chart`) as HTMLCanvasElement).getContext('2d');

    this.chart.set(new Chart(ctx as CanvasRenderingContext2D, config as unknown as ChartConfiguration));
  }

  onScroll(index: number): void {
    const bufferZone = 10;

    if ((index + bufferZone) === this.players().length && !this.isLastPage()) {
      this.updatePlayersList(false);
    }
  }

  private updatePlayersList(isToReset: boolean = false): void {
    if (isToReset) {
      this.currentPage.set(1);
    } else {
      this.currentPage.set(this.currentPage() + 1);
    }

    const filters = this.filterForm.value;
    const statFilter = [{
      value: this.selectedStatProperty(),
      min: filters.min,
      max: filters.max,
    }];

    this.appService.getPlayers(
      this.currentPage(),
      filters.name,
      this.orderBy(),
      filters.nationality,
      statFilter,
    )
      .pipe(finalize(() => {
        if (isToReset) {
          this.viewPort.scrollToIndex(0)
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

  applyFilter() {
    this.updatePlayersList(true);
  }

  private destroyChart() {
    this.chart()?.destroy();
    this.chart.set(null);
  }
}
