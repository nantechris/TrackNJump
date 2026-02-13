import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/**
 * Module racine de l'application Angular.
 *
 * - BrowserModule : nécessaire pour toute application Angular qui s'exécute dans un navigateur
 * - IonicModule.forRoot() : initialise les composants Ionic pour l'ensemble de l'application
 * - AppRoutingModule : gère la navigation et le routage de l'application
 * - IonicRouteStrategy : stratégie de réutilisation des routes optimisée pour Ionic
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
