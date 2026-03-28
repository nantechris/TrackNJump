import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CompetitionDetailPage } from '../competition-detail/competition-detail.page';
import { EventRidersPage } from '../event-riders/event-riders.page';
import { HelpModalComponent } from './help-modal.component';
import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { ImportEpreuveComponent } from './import-epreuve/import-epreuve.component';
import { RiderCardComponent } from './rider-card/rider-card.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule],
  declarations: [
    HomePage,
    RiderCardComponent,
    ImportEpreuveComponent,
    CompetitionDetailPage,
    EventRidersPage,
    HelpModalComponent,
  ],
})
export class HomePageModule {}
