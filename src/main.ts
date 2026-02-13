/**
 * Point d'entrée principal de l'application Angular.
 * Bootstrap le module racine AppModule via la plateforme navigateur.
 */
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Active le mode production si l'environnement le spécifie
if (environment.production) {
  enableProdMode();
}

// Démarre l'application en bootstrappant le module racine
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
