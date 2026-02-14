import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { ImportEpreuveComponent } from './import-epreuve/import-epreuve.component';
import { RiderCardComponent } from './rider-card/rider-card.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule],
  declarations: [HomePage, RiderCardComponent, ImportEpreuveComponent],
})
export class HomePageModule {}
