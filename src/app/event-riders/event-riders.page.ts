import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonList,
  ItemReorderEventDetail,
  ModalController,
} from '@ionic/angular';
import {
  ImportEpreuveComponent,
  ImportResult,
} from '../home/import-epreuve/import-epreuve.component';
import {
  Competition,
  CompetitionEvent,
  CompetitionService,
} from '../services/competition.service';
import { Rider, RiderService } from '../services/rider.service';

@Component({
  selector: 'app-event-riders',
  templateUrl: './event-riders.page.html',
  styleUrls: ['./event-riders.page.scss'],
})
export class EventRidersPage implements OnInit {
  @ViewChild(IonList) list?: IonList;

  rightHanded = true;
  riders: Rider[] = [];

  competition: Competition | null = null;
  event: CompetitionEvent | null = null;
  private eventId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private riderService: RiderService,
    private competitionService: CompetitionService,
    private alertController: AlertController,
    private modalController: ModalController,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadContext();
    await this.loadRiders();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadContext();
    await this.loadRiders();
  }

  private async loadContext(): Promise<void> {
    const competitionId = this.route.snapshot.paramMap.get('id');
    const eventId = this.route.snapshot.paramMap.get('eventId');

    if (!competitionId || !eventId) {
      await this.router.navigate(['/home']);
      return;
    }

    const competition =
      await this.competitionService.getCompetitionById(competitionId);
    const event = competition?.events.find((e) => e.id === eventId) ?? null;

    if (!competition || !event) {
      await this.router.navigate(['/home']);
      return;
    }

    this.competition = competition;
    this.event = event;
    this.eventId = eventId;
  }

  async loadRiders(): Promise<void> {
    if (!this.eventId) {
      this.riders = [];
      return;
    }

    this.riders = await this.riderService.getRiders(this.eventId);
  }

  async addRider(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Ajouter un cavalier',
      inputs: [
        {
          name: 'bib',
          type: 'number',
          placeholder: 'Numéro de dossard',
          min: 1,
        },
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom du cavalier',
        },
        {
          name: 'horse',
          type: 'text',
          placeholder: 'Nom du cheval',
        },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Ajouter',
          handler: async (data) => {
            if (data.bib && data.name && data.horse) {
              await this.riderService.addRider(
                {
                  bib: parseInt(data.bib, 10),
                  name: data.name,
                  horse: data.horse,
                  isNonStarter: false,
                  hasPassed: false,
                  passedWithoutPhoto: false,
                },
                this.eventId,
              );
              await this.loadRiders();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async importRiders(): Promise<void> {
    const modal = await this.modalController.create({
      component: ImportEpreuveComponent,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss<ImportResult>();
    if (data) {
      if (data.mode === 'replace') {
        await this.riderService.replaceAllRiders(data.riders, this.eventId);
      } else {
        for (const rider of data.riders) {
          await this.riderService.addRider(rider, this.eventId);
        }
      }
      await this.loadRiders();
    }
  }

  async onRiderUpdated(data: {
    rider: Rider;
    field: 'bib' | 'name' | 'horse';
    event: any;
  }): Promise<void> {
    const value = data.event.target.value;
    const updates: any = {};

    if (data.field === 'bib') {
      updates.bib = parseInt(value, 10);
    } else {
      updates[data.field] = value;
    }

    await this.riderService.updateRider(data.rider.id, updates, this.eventId);
  }

  trackByRiderId(_index: number, rider: Rider): string {
    return rider.id;
  }

  async deleteRider(rider: Rider): Promise<void> {
    await this.closeAllSlidingItems();
    await this.riderService.deleteRider(rider.id, this.eventId);
    await this.loadRiders();
  }

  async toggleNonStarter(rider: Rider): Promise<void> {
    const idx = this.riders.indexOf(rider);
    if (idx === -1) {
      await this.closeAllSlidingItems();
      return;
    }

    const becomingNonStarter = !rider.isNonStarter;

    if (becomingNonStarter) {
      await this.closeAllSlidingItems(600);

      this.riders.splice(idx, 1);

      rider.isNonStarter = true;
      rider.hasPassed = false;
      rider.passedWithoutPhoto = false;
      this.riders.push(rider);
      await this.riderService.markAsNonStarter(rider.id, this.eventId);
    } else {
      this.riders.splice(idx, 1);
      rider.isNonStarter = false;

      const firstNonStarter = this.riders.findIndex((r) => r.isNonStarter);
      if (firstNonStarter === -1) {
        this.riders.push(rider);
        await this.closeAllSlidingItems(0);
      } else {
        await this.closeAllSlidingItems(0);
        this.riders.splice(firstNonStarter, 0, rider);
      }

      await this.riderService.markAsStarter(rider.id, this.eventId);
      await this.riderService.reorderRiders(this.riders, this.eventId);
    }
  }

  async togglePassed(rider: Rider): Promise<void> {
    if (rider.isNonStarter) {
      await this.closeAllSlidingItems();
      return;
    }

    const nowPassed = !rider.hasPassed;
    await this.closeAllSlidingItems();

    if (nowPassed) {
      rider.isNonStarter = false;

      const idx = this.riders.indexOf(rider);
      if (idx === -1) {
        return;
      }

      this.riders.splice(idx, 1);

      let lastPassed = -1;
      for (let i = 0; i < this.riders.length; i++) {
        if (this.riders[i].hasPassed) {
          lastPassed = i;
        }
      }

      rider.hasPassed = true;
      rider.passedWithoutPhoto = false;
      this.riders.splice(lastPassed + 1, 0, rider);
      await this.riderService.reorderRiders(this.riders, this.eventId);
    } else {
      rider.hasPassed = false;
      rider.passedWithoutPhoto = false;
      await this.riderService.updateRider(
        rider.id,
        {
          hasPassed: false,
          passedWithoutPhoto: false,
        },
        this.eventId,
      );
    }
  }

  async togglePassedWithoutPhoto(rider: Rider): Promise<void> {
    if (rider.isNonStarter) {
      await this.closeAllSlidingItems();
      return;
    }

    const nowWithoutPhoto = !rider.passedWithoutPhoto;
    await this.closeAllSlidingItems();

    if (nowWithoutPhoto) {
      rider.isNonStarter = false;

      const idx = this.riders.indexOf(rider);
      if (idx === -1) {
        return;
      }

      this.riders.splice(idx, 1);

      let lastPassed = -1;
      for (let i = 0; i < this.riders.length; i++) {
        if (this.riders[i].hasPassed) {
          lastPassed = i;
        }
      }

      rider.hasPassed = true;
      rider.passedWithoutPhoto = true;
      this.riders.splice(lastPassed + 1, 0, rider);

      await this.riderService.reorderRiders(this.riders, this.eventId);
    } else {
      rider.hasPassed = false;
      rider.passedWithoutPhoto = false;
      await this.riderService.updateRider(
        rider.id,
        {
          hasPassed: false,
          passedWithoutPhoto: false,
        },
        this.eventId,
      );
    }
  }

  changeLiterality(): void {
    this.rightHanded = !this.rightHanded;
  }

  async handleReorder(
    event: CustomEvent<ItemReorderEventDetail>,
  ): Promise<void> {
    this.riders = event.detail.complete(this.riders);
    await this.riderService.reorderRiders(this.riders, this.eventId);
  }

  private async closeAllSlidingItems(interval = 100): Promise<void> {
    await this.list?.closeSlidingItems();
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
