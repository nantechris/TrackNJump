import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionDetailPage } from '../competition-detail/competition-detail.page';
import { EventRidersPage } from '../event-riders/event-riders.page';
import { CompetitionsPage } from './home.page';

/**
 * Routes internes du module CompetitionsPage.
 * Le chemin vide ('') correspond à la page d'accueil elle-même,
 * car ce module est chargé à la racine ('/') par le routeur principal.
 */
const routes: Routes = [
  {
    path: '',
    component: CompetitionsPage,
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
export class CompetitionsPageRoutingModule {}
