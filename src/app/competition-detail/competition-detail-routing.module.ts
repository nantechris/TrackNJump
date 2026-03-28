import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionDetailPage } from './competition-detail.page';

/**
 * Legacy placeholder.
 * This file is not referenced by the app routing/module graph anymore.
 */

const routes: Routes = [
  {
    path: '',
    component: CompetitionDetailPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompetitionDetailPageRoutingModule {}
