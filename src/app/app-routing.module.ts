import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

/**
 * Définition des routes de l'application.
 *
 * L'application n'a qu'une seule page (Home) qui est chargée en lazy-loading
 * via `loadChildren`. Cela permet de ne charger le module HomePage que lorsque
 * l'utilisateur accède à la route correspondante, améliorant ainsi les performances.
 *
 * - Le chemin vide ('') redirige vers '/home'
 * - Le chemin 'home' charge le module HomePageModule en lazy-loading
 * - Toute autre route ('**') redirige vers '/home'
 */
const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: '',
    redirectTo: 'home',
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
