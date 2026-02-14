import { Component, OnInit, ViewChild } from '@angular/core';
import {
  AlertController,
  IonList,
  ItemReorderEventDetail,
  ModalController,
} from '@ionic/angular';
import { Rider, RiderService } from '../services/rider.service';
import {
  ImportEpreuveComponent,
  ImportResult,
} from './import-epreuve/import-epreuve.component';

/**
 * HomePage - Page principale de l'application TrackNJump.
 *
 * Cette page permet de gérer l'ordre de passage des cavaliers
 * lors d'une épreuve de saut d'obstacles (show jumping).
 *
 * Fonctionnalités :
 * 1. Affichage de la liste des cavaliers avec leur dossard, nom et cheval
 * 2. Ajout d'un cavalier engagé terrain
 * 3. Modification rapide du dossard, nom et cheval
 * 4. Suppression d'un cavalier par swipe
 * 5. Marquage d'un cavalier comme non-partant (déplacé en fin de liste)
 * 6. Réorganisation par glisser-déposer (drag & drop)
 * 7. Persistance des données sur Android/iOS via @ionic/storage-angular
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  /**
   * Référence à la liste pour fermer les sliding items
   */
  @ViewChild(IonList) list?: IonList;

  /**
   * Indique si l'utilisateur est droitier (true) ou gaucher (false).
   * Détermine de quel côté apparaît la poignée de réordonnancement :
   * - Droitier (true) : poignée à droite (slot="end")
   * - Gaucher (false) : poignée à gauche (slot="start")
   */
  rightHanded = true;

  /**
   * Liste des cavaliers dans l'ordre de passage.
   * Chargée depuis le stockage local au démarrage de la page.
   */
  riders: Rider[] = [];

  constructor(
    private riderService: RiderService,
    private alertController: AlertController,
    private modalController: ModalController,
  ) {}

  /**
   * Initialise la page en chargeant les cavaliers depuis le stockage.
   */
  async ngOnInit(): Promise<void> {
    await this.loadRiders();
  }

  /**
   * Charge les cavaliers depuis le service de persistance.
   */
  async loadRiders(): Promise<void> {
    this.riders = await this.riderService.getRiders();
  }

  /**
   * Affiche une alerte pour ajouter un nouveau cavalier engagé terrain.
   */
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
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Ajouter',
          handler: async (data) => {
            if (data.bib && data.name && data.horse) {
              await this.riderService.addRider({
                bib: parseInt(data.bib, 10),
                name: data.name,
                horse: data.horse,
                isNonStarter: false,
                hasPassed: false,
              });
              await this.loadRiders();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Ouvre le modal d'import de cavaliers depuis un TSV FFE.
   */
  async importRiders(): Promise<void> {
    const modal = await this.modalController.create({
      component: ImportEpreuveComponent,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss<ImportResult>();
    if (data) {
      if (data.mode === 'replace') {
        await this.riderService.replaceAllRiders(data.riders);
      } else {
        for (const rider of data.riders) {
          await this.riderService.addRider(rider);
        }
      }
      await this.loadRiders();
    }
  }

  /**
   * Met à jour un cavalier (dossard, nom ou cheval).
   * Appelé par le composant rider-card.
   */
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

    await this.riderService.updateRider(data.rider.id, updates);
  }

  /**
   * TrackBy pour optimiser le rendu de la liste.
   */
  trackByRiderId(index: number, rider: Rider): string {
    return rider.id;
  }

  /**
   * Supprime un cavalier de la liste.
   * @param rider - Le cavalier à supprimer
   */
  async deleteRider(rider: Rider): Promise<void> {
    await this.closeAllSlidingItems();
    await this.riderService.deleteRider(rider.id);
    await this.loadRiders();
  }

  /**
   * Marque un cavalier comme non-partant et le déplace en fin de liste.
   * @param rider - Le cavalier à marquer
   */
  async toggleNonStarter(rider: Rider): Promise<void> {
    // Mettre à jour l'objet en place pour que le DOM ne soit pas reconstruit
    rider.isNonStarter = !rider.isNonStarter;
    // Si on passe en non-partant, retirer le statut passé
    if (rider.isNonStarter) {
      rider.hasPassed = false;
    }
    // Sauvegarder en arrière-plan
    if (rider.isNonStarter) {
      await this.riderService.markAsNonStarter(rider.id);
    } else {
      await this.riderService.markAsStarter(rider.id);
    }
    // Fermer le slide puis réordonner (NP va en fin de liste)
    await this.closeAllSlidingItems();
    await this.loadRiders();
  }

  /**
   * Bascule l'état "passé" d'un cavalier.
   * Ne fait rien si le cavalier est non-partant.
   * @param rider - Le cavalier à marquer comme passé/non passé
   */
  async togglePassed(rider: Rider): Promise<void> {
    // Un non-partant ne peut pas être marqué comme passé
    if (rider.isNonStarter) {
      await this.closeAllSlidingItems();
      return;
    }
    // Mettre à jour l'objet en place pour que le DOM ne soit pas reconstruit
    rider.hasPassed = !rider.hasPassed;
    // Sauvegarder en arrière-plan
    await this.riderService.togglePassed(rider.id);
    // Fermer le slide proprement
    await this.closeAllSlidingItems();
  }

  /**
   * Bascule la préférence de latéralité (droitier ↔ gaucher).
   * Cela déplace la poignée de réordonnancement de l'autre côté de l'écran
   * pour faciliter l'utilisation de l'application d'une seule main.
   */
  changeLiterality(): void {
    this.rightHanded = !this.rightHanded;
  }

  /**
   * Gère l'événement de réordonnancement des cavaliers dans la liste.
   *
   * Lorsque l'utilisateur glisse un élément pour le déplacer,
   * l'événement `ionItemReorder` est déclenché.
   * L'appel à `event.detail.complete(this.riders)` finalise le réordonnancement
   * et met à jour le tableau.
   *
   * @param event - L'événement de réordonnancement Ionic contenant
   *                les indices source (from) et destination (to)
   */
  async handleReorder(
    event: CustomEvent<ItemReorderEventDetail>,
  ): Promise<void> {
    // Complete retourne le nouveau tableau réordonné
    this.riders = event.detail.complete(this.riders);
    // Sauvegarde le nouvel ordre
    await this.riderService.reorderRiders(this.riders);
  }

  /**
   * Ferme tous les éléments swipés ouverts avec animation.
   * Attend la fin de l'animation avant de résoudre.
   */
  private async closeAllSlidingItems(): Promise<void> {
    await this.list?.closeSlidingItems();
    // Attendre la fin de l'animation CSS de fermeture du slide
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
