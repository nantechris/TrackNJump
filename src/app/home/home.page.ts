import { Component, OnInit } from '@angular/core';
import { AlertController, ItemReorderEventDetail } from '@ionic/angular';
import { Rider, RiderService } from '../services/rider.service';

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
   * Affiche une alerte pour importer une liste de cavaliers depuis un TSV.
   * Format attendu : Dossard\tCavalier\tClub engageur\tÉquidé\tCoach
   */
  async importRiders(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Importer des cavaliers',
      message: "Collez les données TSV de la FFE (incluant l'entête)",
      inputs: [
        {
          name: 'tsvData',
          type: 'textarea',
          placeholder:
            'Dossard\tCavalier\tClub engageur\tÉquidé\tCoach\n1\tChristian Ahlmann\t...',
        },
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Importer',
          handler: async (data) => {
            if (data.tsvData) {
              await this.parseTsvAndImport(data.tsvData);
              await this.loadRiders();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Parse les données TSV et importe les cavaliers.
   * @param tsvData - Données TSV copiées-collées
   */
  private async parseTsvAndImport(tsvData: string): Promise<void> {
    const lines = tsvData.trim().split('\n');
    const ridersToAdd: Omit<Rider, 'id'>[] = [];

    // Ignorer la première ligne (entête)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split('\t');

      // Format: Dossard\tCavalier\tClub engageur\tÉquidé\tCoach
      if (columns.length >= 4) {
        const bib = parseInt(columns[0], 10);
        const name = columns[1].trim();
        const horse = columns[3].trim();

        if (!isNaN(bib) && name && horse) {
          ridersToAdd.push({
            bib,
            name,
            horse,
            isNonStarter: false,
            hasPassed: false,
          });
        }
      }
    }

    // Ajouter tous les cavaliers en une seule fois
    for (const rider of ridersToAdd) {
      await this.riderService.addRider(rider);
    }
  }

  /**
   * Met à jour un cavalier (dossard, nom ou cheval).
   * @param rider - Le cavalier à mettre à jour
   * @param field - Le champ modifié ('bib', 'name' ou 'horse')
   * @param event - L'événement de modification
   */
  async updateRider(
    rider: Rider,
    field: 'bib' | 'name' | 'horse',
    event: any,
  ): Promise<void> {
    const value = event.target.value;
    const updates: any = {};

    if (field === 'bib') {
      updates.bib = parseInt(value, 10);
    } else {
      updates[field] = value;
    }

    await this.riderService.updateRider(rider.id, updates);
  }

  /**
   * Supprime un cavalier de la liste.
   * @param rider - Le cavalier à supprimer
   */
  async deleteRider(rider: Rider): Promise<void> {
    await this.riderService.deleteRider(rider.id);
    await this.loadRiders();
  }

  /**
   * Marque un cavalier comme non-partant et le déplace en fin de liste.
   * @param rider - Le cavalier à marquer
   */
  async toggleNonStarter(rider: Rider): Promise<void> {
    if (rider.isNonStarter) {
      await this.riderService.markAsStarter(rider.id);
    } else {
      await this.riderService.markAsNonStarter(rider.id);
    }
    await this.loadRiders();
  }

  /**
   * Bascule l'état "passé" d'un cavalier.
   * @param rider - Le cavalier à marquer comme passé/non passé
   */
  async togglePassed(rider: Rider): Promise<void> {
    await this.riderService.togglePassed(rider.id);
    await this.loadRiders();
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
}
