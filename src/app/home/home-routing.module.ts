import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';

/**
 * Routes internes du module HomePage.
 * Le chemin vide ('') correspond à la page d'accueil elle-même,
 * car ce module est déjà chargé sous la route '/home' par le routeur principal.
 */
const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
