import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionDetailPage } from '../competition-detail/competition-detail.page';
import { EventRidersPage } from '../event-riders/event-riders.page';
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
  {
    path: 'competition/:id',
    component: CompetitionDetailPage,
  },
  {
    path: 'competition/:id/event/:eventId',
    component: EventRidersPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
