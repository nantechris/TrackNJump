import { Component } from '@angular/core';
import { ItemReorderEventDetail } from '@ionic/angular';

/**
 * Interface représentant un cavalier (rider) dans l'ordre de passage.
 *
 * @property bib - Numéro de dossard du cavalier
 * @property name - Nom du cavalier (modifiable en temps réel via l'input)
 * @property horse - Nom du cheval monté par le cavalier
 */
interface Rider {
  bib: number;
  name: string;
  horse: string;
}

/**
 * HomePage - Page principale de l'application TrackNJump.
 *
 * Cette page permet de gérer l'ordre de passage des cavaliers
 * lors d'une épreuve de saut d'obstacles (show jumping).
 *
 * Fonctionnalités :
 * 1. Affichage de la liste des cavaliers avec leur dossard, nom et cheval
 * 2. Réorganisation par glisser-déposer (drag & drop) via ion-reorder
 * 3. Édition inline du nom des cavaliers
 * 4. Choix de la position de la poignée de réordonnancement (droitier/gaucher)
 *    pour faciliter l'utilisation d'une seule main
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  /**
   * Indique si l'utilisateur est droitier (true) ou gaucher (false).
   * Détermine de quel côté apparaît la poignée de réordonnancement :
   * - Droitier (true) : poignée à droite (slot="end")
   * - Gaucher (false) : poignée à gauche (slot="start")
   */
  rightHanded = true;

  /**
   * Liste des cavaliers dans l'ordre de passage.
   * Chaque cavalier possède un dossard (bib), un nom (name) et un cheval (horse).
   *
   * Les données sont initialisées avec des cavaliers célèbres du saut d'obstacles :
   * - Christian Ahlmann (Dominator 2000 Z)
   * - Edwina Tops Alexander (Itot du Chateau)
   * - Marcus Ehning (Comme Il Faut)
   * - Judy-Ann Melchior (Levisto Z)
   *
   * La liste est répétée 3 fois pour simuler un ordre de passage plus long.
   */
  riders: Rider[] = [
    { bib: 1, name: 'Christian Alhmann', horse: 'Dominator 2000 Z' },
    { bib: 2, name: 'Edwina Tops Alexander', horse: 'Itot du Chateau' },
    { bib: 3, name: 'Marcus Ehning', horse: 'Comme Il Faut' },
    { bib: 4, name: 'Judy-Ann Melchior', horse: 'Levisto Z' },
    { bib: 1, name: 'Christian Alhmann', horse: 'Dominator 2000 Z' },
    { bib: 2, name: 'Edwina Tops Alexander', horse: 'Itot du Chateau' },
    { bib: 3, name: 'Marcus Ehning', horse: 'Comme Il Faut' },
    { bib: 4, name: 'Judy-Ann Melchior', horse: 'Levisto Z' },
    { bib: 1, name: 'Christian Alhmann', horse: 'Dominator 2000 Z' },
    { bib: 2, name: 'Edwina Tops Alexander', horse: 'Itot du Chateau' },
    { bib: 3, name: 'Marcus Ehning', horse: 'Comme Il Faut' },
    { bib: 4, name: 'Judy-Ann Melchior', horse: 'Levisto Z' },
  ];

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
   * L'appel à `event.detail.complete()` finalise le réordonnancement
   * en appliquant le déplacement au DOM.
   *
   * @param event - L'événement de réordonnancement Ionic contenant
   *                les indices source (from) et destination (to)
   */
  handleReorder(event: CustomEvent<ItemReorderEventDetail>): void {
    event.detail.complete();
  }
}
