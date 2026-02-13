import { Component } from '@angular/core';

/**
 * Composant racine de l'application.
 *
 * Ce composant sert de conteneur principal pour le routeur Angular.
 * Il contient un <ion-app> qui enveloppe le <ion-router-outlet>,
 * lequel affiche dynamiquement les pages en fonction de la route active.
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {}
}
