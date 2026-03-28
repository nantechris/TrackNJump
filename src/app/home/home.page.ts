import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonList,
  ItemReorderEventDetail,
} from '@ionic/angular';
import {
  Competition,
  CompetitionService,
} from '../services/competition.service';
import { Rider, RiderService } from '../services/rider.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(IonList) list?: IonList;

  competitions: Competition[] = [];

  constructor(
    private competitionService: CompetitionService,
    private riderService: RiderService,
    private alertController: AlertController,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.ensureExampleData();
    await this.loadCompetitions();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadCompetitions();
  }

  async loadCompetitions(): Promise<void> {
    this.competitions = await this.competitionService.getCompetitions();
  }

  async createCompetition(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Créer un concours',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom du concours',
        },
        {
          name: 'date',
          type: 'date',
        },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Créer',
          handler: async (data) => {
            if (!data?.name?.trim() || !data?.date) {
              return false;
            }

            await this.competitionService.createCompetition({
              name: data.name,
              date: this.toFrenchDate(data.date),
            });
            await this.loadCompetitions();
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async editCompetition(competition: Competition): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Modifier le concours',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: competition.name,
          placeholder: 'Nom du concours',
        },
        {
          name: 'date',
          type: 'date',
          value: this.toInputDate(competition.date),
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

            await this.competitionService.updateCompetition(competition.id, {
              name: data.name,
              date: this.toFrenchDate(data.date),
            });
            await this.loadCompetitions();
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteCompetition(competition: Competition): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Supprimer le concours',
      message: `Supprimer « ${competition.name} » ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            await this.competitionService.deleteCompetition(competition.id);
            await this.loadCompetitions();
          },
        },
      ],
    });

    await alert.present();
  }

  openCompetition(competition: Competition): void {
    void this.router.navigate(['/competition', competition.id]);
  }

  onUpdateCompetition(
    competition: Competition,
    field: 'name' | 'date',
    event: any,
  ): void {
    const newValue = (event.target as HTMLInputElement).value.trim();

    if (!newValue) {
      event.target.value =
        field === 'name' ? competition.name : competition.date;
      return;
    }

    if (newValue === (field === 'name' ? competition.name : competition.date)) {
      return;
    }

    void this.competitionService
      .updateCompetition(competition.id, {
        ...(field === 'name' && { name: newValue }),
        ...(field === 'date' && { date: newValue }),
      })
      .then(() => this.loadCompetitions());
  }

  trackByCompetitionId(_index: number, competition: Competition): string {
    return competition.id;
  }

  async handleCompetitionReorder(
    event: CustomEvent<ItemReorderEventDetail>,
  ): Promise<void> {
    this.competitions = event.detail.complete(this.competitions);
    await this.competitionService.reorderCompetitions(this.competitions);
  }

  async toggleCompetitionPassed(competition: Competition): Promise<void> {
    await this.closeAllSlidingItems();
    await this.competitionService.updateCompetition(competition.id, {
      hasPassed: !competition.hasPassed,
    });
    await this.loadCompetitions();
  }

  private async closeAllSlidingItems(interval = 100): Promise<void> {
    await this.list?.closeSlidingItems();
    await new Promise((resolve) => setTimeout(resolve, interval));
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

  private async ensureExampleData(): Promise<void> {
    const existingCompetitions =
      await this.competitionService.getCompetitions();
    if (existingCompetitions.length > 0) {
      return;
    }

    const competition = await this.competitionService.createCompetition({
      name: 'Saut Hermès 2025',
      date: '05/07/2025',
    });

    const event = await this.competitionService.addEvent(competition.id, {
      name: 'CSI 5*',
    });

    if (!event) {
      return;
    }

    const sampleRiders: Omit<Rider, 'id'>[] = [
      {
        bib: 1,
        name: 'Christian Ahlmann',
        horse: 'Dominator 2000 Z',
        isNonStarter: false,
        hasPassed: false,
        passedWithoutPhoto: false,
      },
      {
        bib: 2,
        name: 'Edwina Tops Alexander',
        horse: 'Itot du Chateau',
        isNonStarter: false,
        hasPassed: false,
        passedWithoutPhoto: false,
      },
      {
        bib: 3,
        name: 'Marcus Ehning',
        horse: 'Comme Il Faut',
        isNonStarter: false,
        hasPassed: false,
        passedWithoutPhoto: false,
      },
      {
        bib: 4,
        name: 'Judy-Ann Melchior',
        horse: 'Levisto Z',
        isNonStarter: false,
        hasPassed: false,
        passedWithoutPhoto: false,
      },
      {
        bib: 5,
        name: 'Nanté Andriamanga',
        horse: 'Dunloughan Cruise',
        isNonStarter: false,
        hasPassed: false,
        passedWithoutPhoto: false,
      },
    ];

    await this.riderService.replaceAllRiders(sampleRiders, event.id);
  }
}
