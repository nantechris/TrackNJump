import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ItemReorderEventDetail } from '@ionic/angular';
import {
  Competition,
  CompetitionService,
} from '../services/competition.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  competitions: Competition[] = [];

  constructor(
    private competitionService: CompetitionService,
    private alertController: AlertController,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
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
    void this.router.navigate(['/home/competition', competition.id]);
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
