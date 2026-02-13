import { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuration de Capacitor pour l'application TrackNJump.
 *
 * - appId : identifiant unique de l'application (format reverse-domain)
 * - appName : nom affiché de l'application
 * - webDir : dossier de sortie du build Angular (www par défaut pour Ionic)
 * - server.androidScheme : utilise HTTPS pour le serveur Android interne
 */
const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'TrackNJump',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
