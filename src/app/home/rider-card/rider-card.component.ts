import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Rider } from '../../services/rider.service';

/**
 * RiderCardComponent - Composant réutilisable pour afficher un cavalier.
 *
 * Affiche les informations d'un cavalier (dossard, nom, cheval) sous forme de carte
 * avec les actions de swipe (passé, non-partant, suppression) et l'édition inline.
 */
@Component({
  selector: 'app-rider-card',
  templateUrl: './rider-card.component.html',
  styleUrls: ['./rider-card.component.scss'],
})
export class RiderCardComponent {
  /** Le cavalier à afficher */
  @Input() rider!: Rider;

  /** Indique si la poignée de drag est à droite (droitier) ou à gauche (gaucher) */
  @Input() rightHanded = true;

  /** Émis quand le cavalier est marqué comme passé / non passé */
  @Output() passed = new EventEmitter<Rider>();

  /** Émis quand le cavalier est marqué comme non-partant / partant */
  @Output() nonStarter = new EventEmitter<Rider>();

  /** Émis quand le cavalier est supprimé */
  @Output() deleted = new EventEmitter<Rider>();

  /** Émis quand un champ du cavalier est modifié */
  @Output() updated = new EventEmitter<{
    rider: Rider;
    field: 'bib' | 'name' | 'horse';
    event: any;
  }>();

  private touchStartX: number | null = null;

  constructor(private el: ElementRef) {}

  onTogglePassed(): void {
    this.passed.emit(this.rider);
  }

  // touch handlers to detect a right swipe and toggle passed
  onTouchStart(event: TouchEvent): void {
    if (event.touches && event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) {
      this.touchStartX = null;
      return;
    }
    const deltaX = touch.clientX - this.touchStartX;
    const SWIPE_THRESHOLD = 40;
    if (deltaX > SWIPE_THRESHOLD && !this.rider.isNonStarter) {
      this.onTogglePassed();
      // close parent ion-item-sliding if any to avoid showing options
      const sliding = (this.el.nativeElement as HTMLElement).closest('ion-item-sliding');
      if (sliding && typeof (sliding as any).close === 'function') {
        try {
          (sliding as any).close();
        } catch {}
      }
    }
    this.touchStartX = null;
  }

  onTouchCancel(): void {
    this.touchStartX = null;
  }

  onToggleNonStarter(): void {
    this.nonStarter.emit(this.rider);
  }

  onDelete(): void {
    this.deleted.emit(this.rider);
  }

  onUpdate(field: 'bib' | 'name' | 'horse', event: any): void {
    // Do not allow updates when the rider is marked non-starter
    if (this.rider && this.rider.isNonStarter) return;
    this.updated.emit({ rider: this.rider, field, event });
  }
}
