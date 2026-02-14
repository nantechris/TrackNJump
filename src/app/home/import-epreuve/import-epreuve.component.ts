import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Rider } from '../../services/rider.service';

/**
 * Mode d'import des cavaliers.
 * - 'replace' : remplace toute la liste existante
 * - 'append' : ajoute à la liste existante
 */
export type ImportMode = 'replace' | 'append';

/**
 * Résultat renvoyé par le modal d'import.
 */
export interface ImportResult {
  riders: Omit<Rider, 'id'>[];
  mode: ImportMode;
}

/**
 * ImportEpreuveComponent - Modal d'import de cavaliers depuis un TSV FFE.
 *
 * Permet de coller les données TSV copiées depuis le site de la FFE,
 * les parser automatiquement, et choisir entre remplacer la liste
 * existante ou ajouter à celle-ci.
 */
@Component({
  selector: 'app-import-epreuve',
  templateUrl: './import-epreuve.component.html',
  styleUrls: ['./import-epreuve.component.scss'],
})
export class ImportEpreuveComponent {
  /** Données TSV saisies par l'utilisateur */
  tsvData = '';

  /** Cavaliers parsés depuis le TSV */
  parsedRiders: Omit<Rider, 'id'>[] = [];

  /** Indique si le parsing a été effectué */
  isParsed = false;

  /** Message d'erreur éventuel */
  errorMessage = '';

  constructor(private modalController: ModalController) {}

  /**
   * Ferme le modal sans importer.
   */
  dismiss(): void {
    this.modalController.dismiss();
  }

  /**
   * Parse les données TSV collées.
   */
  parseTsv(): void {
    this.parsedRiders = [];
    this.errorMessage = '';

    if (!this.tsvData.trim()) {
      this.errorMessage = 'Veuillez coller des données TSV.';
      return;
    }

    const lines = this.tsvData.trim().split('\n');

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
          this.parsedRiders.push({
            bib,
            name,
            horse,
            isNonStarter: false,
            hasPassed: false,
          });
        }
      }
    }

    if (this.parsedRiders.length === 0) {
      this.errorMessage =
        'Aucun cavalier trouvé. Vérifiez le format des données.';
    }

    this.isParsed = true;
  }

  /**
   * Importe les cavaliers en remplaçant la liste existante.
   */
  importReplace(): void {
    if (this.parsedRiders.length > 0) {
      const result: ImportResult = {
        riders: this.parsedRiders,
        mode: 'replace',
      };
      this.modalController.dismiss(result);
    }
  }

  /**
   * Importe les cavaliers en les ajoutant à la liste existante.
   */
  importAppend(): void {
    if (this.parsedRiders.length > 0) {
      const result: ImportResult = {
        riders: this.parsedRiders,
        mode: 'append',
      };
      this.modalController.dismiss(result);
    }
  }
}
