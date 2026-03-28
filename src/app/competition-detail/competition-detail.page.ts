import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ItemReorderEventDetail } from '@ionic/angular';
import {
  Competition,
  CompetitionEvent,
  CompetitionService,
} from '../services/competition.service';

@Component({
  selector: 'app-competition-detail',
  templateUrl: './competition-detail.page.html',
  styleUrls: ['./competition-detail.page.scss'],
})
export class CompetitionDetailPage implements OnInit {
  competition: Competition | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private competitionService: CompetitionService,
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
      await this.router.navigate(['/']);
    }
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
          value: this.toInputDate(this.competition.date),
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
                date: this.toFrenchDate(data.date),
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

  onUpdateEvent(event: CompetitionEvent, eventObj: any): void {
    if (!this.competition) {
      return;
    }

    const newValue = (eventObj.target as HTMLInputElement).value.trim();

    if (!newValue) {
      eventObj.target.value = event.name;
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

  private toFrenchDate(inputDate: string): string {
    const [year, month, day] = inputDate.split('-');
    if (!year || !month || !day) {
      return inputDate;
    }

    return `${day}/${month}/${year}`;
  }

  private toInputDate(frenchDate: string): string {
    const [day, month, year] = frenchDate.split('/');
    if (!day || !month || !year) {
      return frenchDate;
    }

    return `${year}-${month}-${day}`;
  }
}
