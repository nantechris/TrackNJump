import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface CompetitionEvent {
  id: string;
  name: string;
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  events: CompetitionEvent[];
}

@Injectable({
  providedIn: 'root',
})
export class CompetitionService {
  private readonly STORAGE_KEY = 'competitions';
  private _storage: Storage | null = null;
  private initPromise: Promise<void>;

  constructor(private storage: Storage) {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    this._storage = await this.storage.create();
  }

  private async ensureInit(): Promise<void> {
    await this.initPromise;
  }

  async getCompetitions(): Promise<Competition[]> {
    await this.ensureInit();
    const competitions = (await this._storage?.get(this.STORAGE_KEY)) as
      | Competition[]
      | undefined;

    const normalized = (competitions ?? []).map((competition) => ({
      ...competition,
      date: this.normalizeFrenchDate(competition.date),
      events: (competition.events ?? []).map((event) => ({
        id: event.id,
        name: event.name,
      })),
    }));

    return normalized;
  }

  private async saveCompetitions(competitions: Competition[]): Promise<void> {
    await this.ensureInit();
    await this._storage?.set(this.STORAGE_KEY, competitions);
  }

  async createCompetition(data: {
    name: string;
    date: string;
  }): Promise<Competition> {
    const competitions = await this.getCompetitions();

    const competition: Competition = {
      id: this.generateId(),
      name: data.name.trim(),
      date: this.normalizeFrenchDate(data.date),
      events: [],
    };

    competitions.push(competition);
    await this.saveCompetitions(competitions);
    return competition;
  }

  async updateCompetition(
    competitionId: string,
    updates: Partial<Pick<Competition, 'name' | 'date'>>,
  ): Promise<void> {
    const competitions = await this.getCompetitions();
    const index = competitions.findIndex((c) => c.id === competitionId);
    if (index === -1) {
      return;
    }

    competitions[index] = {
      ...competitions[index],
      ...updates,
      name: updates.name?.trim() ?? competitions[index].name,
      date: this.normalizeFrenchDate(updates.date ?? competitions[index].date),
    };

    await this.saveCompetitions(competitions);
  }

  async deleteCompetition(competitionId: string): Promise<void> {
    const competitions = await this.getCompetitions();
    await this.saveCompetitions(
      competitions.filter((c) => c.id !== competitionId),
    );
  }

  async reorderCompetitions(competitions: Competition[]): Promise<void> {
    await this.saveCompetitions(competitions);
  }

  async getCompetitionById(competitionId: string): Promise<Competition | null> {
    const competitions = await this.getCompetitions();
    return competitions.find((c) => c.id === competitionId) ?? null;
  }

  async addEvent(
    competitionId: string,
    data: { name: string },
  ): Promise<CompetitionEvent | null> {
    const competitions = await this.getCompetitions();
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition || !data.name) {
      return null;
    }

    const event: CompetitionEvent = {
      id: this.generateId(),
      name: data.name.trim(),
    };

    competition.events.push(event);
    await this.saveCompetitions(competitions);
    return event;
  }

  async updateEvent(
    competitionId: string,
    eventId: string,
    updates: Partial<Pick<CompetitionEvent, 'name'>>,
  ): Promise<void> {
    const competitions = await this.getCompetitions();
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }

    const eventIndex = competition.events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      return;
    }

    const current = competition.events[eventIndex];
    competition.events[eventIndex] = {
      ...current,
      ...updates,
      name: updates.name?.trim() ?? current.name,
    };

    await this.saveCompetitions(competitions);
  }

  async deleteEvent(competitionId: string, eventId: string): Promise<void> {
    const competitions = await this.getCompetitions();
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }

    competition.events = competition.events.filter((e) => e.id !== eventId);
    await this.saveCompetitions(competitions);
  }

  async reorderEvents(
    competitionId: string,
    events: CompetitionEvent[],
  ): Promise<void> {
    const competitions = await this.getCompetitions();
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }

    competition.events = events.map((event) => ({
      id: event.id,
      name: event.name,
    }));

    await this.saveCompetitions(competitions);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  private normalizeFrenchDate(value: string): string {
    if (!value) {
      return value;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('fr-FR');
  }
}
