import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonList,
  ItemReorderEventDetail,
} from '@ionic/angular';
import {
  Competition,
  CompetitionEvent,
  CompetitionService,
} from '../services/competition.service';
import { RiderService } from '../services/rider.service';
import {
  frenchDateToInputDate,
  inputDateToFrenchDate,
} from '../shared/utils/date.utils';
import { closeSlidingItems } from '../shared/utils/sliding-items.utils';

@Component({
  selector: 'app-competition-detail',
  templateUrl: './competition-detail.page.html',
  styleUrls: ['./competition-detail.page.scss'],
})
export class CompetitionDetailPage implements OnInit {
  @ViewChild(IonList) list?: IonList;

  competition: Competition | null = null;
  riderCounts: Record<string, number> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private competitionService: CompetitionService,
    private riderService: RiderService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCompetition();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadCompetition();
  }

  async loadCompetition(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/']);
      return;
    }

    this.competition = await this.competitionService.getCompetitionById(id);
    if (!this.competition) {
      this.riderCounts = {};
      await this.router.navigate(['/']);
      return;
    }

    await this.loadRiderCounts();
  }

  async editCompetition(): Promise<void> {
    if (!this.competition) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Modifier le concours',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: this.competition.name,
          placeholder: 'Nom du concours',
        },
        {
          name: 'date',
          type: 'date',
          value: frenchDateToInputDate(this.competition.date),
        },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Enregistrer',
          handler: async (data) => {
            if (!data?.name?.trim() || !data?.date) {
              return false;
            }

            await this.competitionService.updateCompetition(
              this.competition!.id,
              {
                name: data.name,
                date: inputDateToFrenchDate(data.date),
              },
            );
            await this.loadCompetition();
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async createEvent(): Promise<void> {
    if (!this.competition) {
      return;
    }

    const alert = await this.alertController.create({
      header: `Ajouter une épreuve - ${this.competition.name}`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: "Nom de l'épreuve",
        },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Ajouter',
          handler: async (data) => {
            if (!data?.name?.trim()) {
              return false;
            }

            await this.competitionService.addEvent(this.competition!.id, {
              name: data.name,
            });
            await this.loadCompetition();
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async editEvent(event: CompetitionEvent): Promise<void> {
    if (!this.competition) {
      return;
    }

    const alert = await this.alertController.create({
      header: `Modifier l'épreuve - ${this.competition.name}`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: event.name,
          placeholder: "Nom de l'épreuve",
        },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Enregistrer',
          handler: async (data) => {
            if (!data?.name?.trim()) {
              return false;
            }

            await this.competitionService.updateEvent(
              this.competition!.id,
              event.id,
              {
                name: data.name,
              },
            );
            await this.loadCompetition();
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteEvent(event: CompetitionEvent): Promise<void> {
    if (!this.competition) {
      return;
    }

    await this.competitionService.deleteEvent(this.competition.id, event.id);
    await this.loadCompetition();
  }

  openEvent(event: CompetitionEvent): void {
    if (!this.competition) {
      return;
    }

    void this.router.navigate([
      '/competition',
      this.competition.id,
      'event',
      event.id,
    ]);
  }

  onUpdateEvent(event: CompetitionEvent, eventObj: Event): void {
    if (!this.competition) {
      return;
    }

    const input = eventObj.target as HTMLInputElement | null;
    const newValue = input?.value.trim() ?? '';

    if (!newValue) {
      if (input) {
        input.value = event.name;
      }
      return;
    }

    if (newValue === event.name) {
      return;
    }

    void this.competitionService
      .updateEvent(this.competition.id, event.id, { name: newValue })
      .then(() => this.loadCompetition());
  }

  trackByEventId(_index: number, event: CompetitionEvent): string {
    return event.id;
  }

  async handleEventReorder(
    event: CustomEvent<ItemReorderEventDetail>,
  ): Promise<void> {
    if (!this.competition) {
      return;
    }

    this.competition.events = event.detail.complete(this.competition.events);
    await this.competitionService.reorderEvents(
      this.competition.id,
      this.competition.events,
    );
  }

  async toggleEventPassed(event: CompetitionEvent): Promise<void> {
    if (!this.competition) {
      return;
    }

    await closeSlidingItems(this.list);

    await this.competitionService.updateEvent(this.competition.id, event.id, {
      hasPassed: !event.hasPassed,
    });
    await this.loadCompetition();
  }

  getRiderCount(eventId: string): number {
    return this.riderCounts[eventId] ?? 0;
  }

  private async loadRiderCounts(): Promise<void> {
    if (!this.competition) {
      this.riderCounts = {};
      return;
    }

    const counts = await Promise.all(
      this.competition.events.map(async (event) => {
        const riders = await this.riderService.getRiders(event.id);
        return [event.id, riders.length] as const;
      }),
    );

    this.riderCounts = Object.fromEntries(counts);
  }
}
