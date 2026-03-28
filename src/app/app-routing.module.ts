import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

/**
 * Définition des routes de l'application.
 *
 * L'application n'a qu'une seule page (Competitions) qui est chargée en lazy-loading
 * via `loadChildren`. Cela permet de ne charger le module CompetitionsPage que lorsque
 * l'utilisateur accède à la route correspondante, améliorant ainsi les performances.
 *
 * - Le chemin vide ('') charge le module CompetitionsPageModule en lazy-loading
 * - Toute autre route ('**') redirige vers '/'
 */
const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.CompetitionsPageModule),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
