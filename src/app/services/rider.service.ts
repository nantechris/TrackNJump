import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * Interface représentant un cavalier (rider) dans l'ordre de passage.
 *
 * @property id - Identifiant unique du cavalier (généré automatiquement)
 * @property bib - Numéro de dossard du cavalier
 * @property name - Nom du cavalier
 * @property horse - Nom du cheval monté par le cavalier
 * @property isNonStarter - Indique si le cavalier est non-partant
 */
export interface Rider {
  id: string;
  bib: number;
  name: string;
  horse: string;
  isNonStarter: boolean;
}

/**
 * Service de gestion des cavaliers avec persistance des données.
 * 
 * Utilise @ionic/storage-angular (IndexedDB/localStorage) pour une compatibilité
 * Android, iOS et Web. Les données sont automatiquement sauvegardées après chaque
 * modification.
 */
@Injectable({
  providedIn: 'root'
})
export class RiderService {
  private readonly STORAGE_KEY = 'riders';
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  /**
   * Initialise le système de stockage.
   * Doit être appelé avant toute opération de lecture/écriture.
   */
  async init(): Promise<void> {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  /**
   * Récupère tous les cavaliers depuis le stockage.
   * @returns Liste des cavaliers triée (partants puis non-partants)
   */
  async getRiders(): Promise<Rider[]> {
    const riders = await this._storage?.get(this.STORAGE_KEY);
    
    // Si aucune donnée n'existe, initialiser avec des données par défaut
    if (!riders || riders.length === 0) {
      const defaultRiders = this.getDefaultRiders();
      await this.saveRiders(defaultRiders);
      return defaultRiders;
    }
    
    return this.sortRiders(riders);
  }

  /**
   * Retourne une liste de cavaliers par défaut pour l'initialisation.
   * @returns Liste de cavaliers célèbres du saut d'obstacles
   */
  private getDefaultRiders(): Rider[] {
    return [
      { id: this.generateId(), bib: 1, name: 'Christian Ahlmann', horse: 'Dominator 2000 Z', isNonStarter: false },
      { id: this.generateId(), bib: 2, name: 'Edwina Tops Alexander', horse: 'Itot du Chateau', isNonStarter: false },
      { id: this.generateId(), bib: 3, name: 'Marcus Ehning', horse: 'Comme Il Faut', isNonStarter: false },
      { id: this.generateId(), bib: 4, name: 'Judy-Ann Melchior', horse: 'Levisto Z', isNonStarter: false },
    ];
  }

  /**
   * Trie les cavaliers : partants en premier, puis non-partants à la fin.
   * @param riders - Liste des cavaliers à trier
   * @returns Liste triée
   */
  private sortRiders(riders: Rider[]): Rider[] {
    const starters = riders.filter(r => !r.isNonStarter);
    const nonStarters = riders.filter(r => r.isNonStarter);
    return [...starters, ...nonStarters];
  }

  /**
   * Sauvegarde la liste des cavaliers dans le stockage.
   * @param riders - Liste des cavaliers à sauvegarder
   */
  async saveRiders(riders: Rider[]): Promise<void> {
    const sorted = this.sortRiders(riders);
    await this._storage?.set(this.STORAGE_KEY, sorted);
  }

  /**
   * Ajoute un nouveau cavalier.
   * @param rider - Cavalier à ajouter (sans ID)
   * @returns Le cavalier ajouté avec son ID généré
   */
  async addRider(rider: Omit<Rider, 'id'>): Promise<Rider> {
    const riders = await this.getRiders();
    const newRider: Rider = {
      ...rider,
      id: this.generateId(),
      isNonStarter: rider.isNonStarter ?? false
    };
    riders.push(newRider);
    await this.saveRiders(riders);
    return newRider;
  }

  /**
   * Met à jour un cavalier existant.
   * @param id - ID du cavalier à modifier
   * @param updates - Propriétés à mettre à jour
   */
  async updateRider(id: string, updates: Partial<Omit<Rider, 'id'>>): Promise<void> {
    const riders = await this.getRiders();
    const index = riders.findIndex(r => r.id === id);
    if (index !== -1) {
      riders[index] = { ...riders[index], ...updates };
      await this.saveRiders(riders);
    }
  }

  /**
   * Supprime un cavalier.
   * @param id - ID du cavalier à supprimer
   */
  async deleteRider(id: string): Promise<void> {
    const riders = await this.getRiders();
    const filtered = riders.filter(r => r.id !== id);
    await this.saveRiders(filtered);
  }

  /**
   * Marque un cavalier comme non-partant et le déplace à la fin de la liste.
   * @param id - ID du cavalier
   */
  async markAsNonStarter(id: string): Promise<void> {
    await this.updateRider(id, { isNonStarter: true });
  }

  /**
   * Restaure un cavalier non-partant en partant.
   * @param id - ID du cavalier
   */
  async markAsStarter(id: string): Promise<void> {
    await this.updateRider(id, { isNonStarter: false });
  }

  /**
   * Réordonne la liste des cavaliers.
   * @param riders - Nouvelle liste ordonnée
   */
  async reorderRiders(riders: Rider[]): Promise<void> {
    await this.saveRiders(riders);
  }

  /**
   * Génère un ID unique pour un cavalier.
   * @returns ID unique basé sur le timestamp et un nombre aléatoire
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Supprime toutes les données.
   */
  async clearAll(): Promise<void> {
    await this._storage?.remove(this.STORAGE_KEY);
  }
}
