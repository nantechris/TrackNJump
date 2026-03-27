# TrackNJump 🐴

Application mobile de gestion d'ordre de passage pour les épreuves de saut d'obstacles équestre.

## Fonctionnalités

### Gestion des cavaliers

- ➕ **Ajouter un cavalier engagé terrain** : Bouton d'ajout rapide avec formulaire (dossard, nom, cheval)
- ✏️ **Modification rapide inline** : Cliquez sur le dossard, nom ou cheval pour modifier directement
- 🗑️ **Suppression par swipe** : Swipez vers la droite pour supprimer un cavalier
- 🚫 **Marquer comme non-partant** : Swipez vers la gauche pour marquer un cavalier non-partant (il passe automatiquement en fin de liste avec un style barré)

### Organisation

- 🔄 **Réorganisation par drag & drop** : Glissez l'icône fer à cheval pour changer l'ordre
- 🤚 **Choix droitier/gaucher** : La poignée de réordonnancement s'adapte à votre main dominante

### Persistance

- 💾 **Sauvegarde automatique** : Toutes les modifications sont automatiquement sauvegardées
- 📱 **Compatible Android & iOS** : Utilise `@ionic/storage-angular` (IndexedDB) pour une persistance multiplateforme

## Architecture

### Services

- **RiderService** (`src/app/services/rider.service.ts`) :
  - Gestion complète du CRUD (Create, Read, Update, Delete)
  - Persistance via `@ionic/storage-angular`
  - Tri automatique (partants en premier, non-partants à la fin)
  - Initialisation avec des données par défaut au premier lancement

### Composants

- **HomePage** (`src/app/home/`) :
  - Interface principale avec liste des cavaliers
  - Édition inline avec inputs natifs
  - Swipe gestures pour suppression et statut non-partant
  - Drag & drop pour réorganisation

## Technologies

- **Ionic 7** + **Angular 16**
- **Capacitor 5** pour le build natif Android/iOS
- **@ionic/storage-angular** pour la persistance des données
- **TypeScript** / **SCSS**

## Lancer le projet

```bash
# Installation des dépendances
npm install

# Lancer en mode développement (web)
npm start
# ou
ionic serve

# Build de production
ionic build --prod

# Ajouter les plateformes
npx cap add android
npx cap add ios

# Synchroniser et ouvrir dans l'IDE natif
npx cap sync
npx cap open android
npx cap open ios
```

## Guide d'utilisation

### Ajouter un cavalier

1. Cliquez sur le bouton **+** en haut à droite
2. Remplissez le formulaire (dossard, nom, cheval)
3. Cliquez sur "Ajouter"

### Modifier un cavalier

Cliquez directement sur le champ que vous voulez modifier (dossard, nom ou cheval), effectuez la modification, puis cliquez ailleurs pour sauvegarder.

### Supprimer un cavalier

Swipez l'item vers la droite et cliquez sur l'icône 🗑️ rouge.

### Marquer comme non-partant

Swipez l'item vers la gauche et cliquez sur l'icône ⚠️ orange. Le cavalier sera automatiquement déplacé en fin de liste et affiché barré. Pour restaurer, swipez à nouveau et cliquez sur l'icône ✓ verte.

### Réorganiser l'ordre

Maintenez et glissez l'icône fer à cheval 🐴 pour déplacer un cavalier dans la liste.

# Idées

- Gestion de plusieurs épreuves et concours
- Export de données pour pouvoir le partager (PDF)
- Marquer une épreuve/un concours passé(e)
- Fonction de recherche sur les concours et les épreuves
- API call à la FFE
