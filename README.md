# TrackNJump 🐴

Application mobile de gestion d'ordre de passage pour les épreuves de saut d'obstacles équestre.

## Fonctionnalités

- 📋 Liste des cavaliers avec dossard, nom et cheval
- 🔄 Réorganisation par glisser-déposer (drag & drop)
- ✏️ Édition inline du nom des cavaliers
- 🤚 Choix droitier/gaucher pour la position de la poignée de réordonnancement

## Technologies

- **Ionic 7** + **Angular 16**
- **Capacitor 5** pour le build natif Android
- **TypeScript** / **SCSS**

## Lancer le projet

```bash
# Installation des dépendances
npm install

# Lancer en mode développement
ionic serve

# Build de production
ionic build --prod

# Ajouter la plateforme Android
npx cap add android

# Synchroniser et ouvrir Android Studio
npx cap sync
npx cap open android
```
