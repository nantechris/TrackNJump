import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  AlertController,
  IonList,
  ItemReorderEventDetail,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ImportEpreuveComponent,
  ImportResult,
} from '../home/import-epreuve/import-epreuve.component';
import {
  Competition,
  CompetitionEvent,
  CompetitionService,
} from '../services/competition.service';
import { Rider, RiderService } from '../services/rider.service';

@Component({
  selector: 'app-event-riders',
  templateUrl: './event-riders.page.html',
  styleUrls: ['./event-riders.page.scss'],
})
export class EventRidersPage implements OnInit {
  @ViewChild(IonList) list?: IonList;

  rightHanded = true;
  isExporting = false;
  riders: Rider[] = [];

  competition: Competition | null = null;
  event: CompetitionEvent | null = null;
  private eventId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private riderService: RiderService,
    private competitionService: CompetitionService,
    private alertController: AlertController,
    private modalController: ModalController,
    private toastController: ToastController,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadContext();
    await this.loadRiders();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadContext();
    await this.loadRiders();
  }

  private async loadContext(): Promise<void> {
    const competitionId = this.route.snapshot.paramMap.get('id');
    const eventId = this.route.snapshot.paramMap.get('eventId');

    if (!competitionId || !eventId) {
      await this.router.navigate(['/']);
      return;
    }

    const competition =
      await this.competitionService.getCompetitionById(competitionId);
    const event = competition?.events.find((e) => e.id === eventId) ?? null;

    if (!competition || !event) {
      await this.router.navigate(['/']);
      return;
    }

    this.competition = competition;
    this.event = event;
    this.eventId = eventId;
  }

  async loadRiders(): Promise<void> {
    if (!this.eventId) {
      this.riders = [];
      return;
    }

    this.riders = await this.riderService.getRiders(this.eventId);
  }

  async addRider(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Ajouter un cavalier',
      inputs: [
        {
          name: 'bib',
          type: 'number',
          placeholder: 'Numéro de dossard',
          min: 1,
        },
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom du cavalier',
        },
        {
          name: 'horse',
          type: 'text',
          placeholder: 'Nom du cheval',
        },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Ajouter',
          handler: async (data) => {
            if (data.bib && data.name && data.horse) {
              await this.riderService.addRider(
                {
                  bib: parseInt(data.bib, 10),
                  name: data.name,
                  horse: data.horse,
                  isNonStarter: false,
                  hasPassed: false,
                  passedWithoutPhoto: false,
                },
                this.eventId,
              );
              await this.loadRiders();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async importRiders(): Promise<void> {
    const modal = await this.modalController.create({
      component: ImportEpreuveComponent,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss<ImportResult>();
    if (data) {
      if (data.mode === 'replace') {
        await this.riderService.replaceAllRiders(data.riders, this.eventId);
      } else {
        for (const rider of data.riders) {
          await this.riderService.addRider(rider, this.eventId);
        }
      }
      await this.loadRiders();
    }
  }

  async onRiderUpdated(data: {
    rider: Rider;
    field: 'bib' | 'name' | 'horse';
    event: any;
  }): Promise<void> {
    const value = data.event.target.value;
    const updates: any = {};

    if (data.field === 'bib') {
      updates.bib = parseInt(value, 10);
    } else {
      updates[data.field] = value;
    }

    await this.riderService.updateRider(data.rider.id, updates, this.eventId);
  }

  trackByRiderId(_index: number, rider: Rider): string {
    return rider.id;
  }

  async deleteRider(rider: Rider): Promise<void> {
    await this.closeAllSlidingItems();
    await this.riderService.deleteRider(rider.id, this.eventId);
    await this.loadRiders();
  }

  async toggleNonStarter(rider: Rider): Promise<void> {
    const idx = this.riders.indexOf(rider);
    if (idx === -1) {
      await this.closeAllSlidingItems();
      return;
    }

    const becomingNonStarter = !rider.isNonStarter;

    if (becomingNonStarter) {
      await this.closeAllSlidingItems(600);

      this.riders.splice(idx, 1);

      rider.isNonStarter = true;
      rider.hasPassed = false;
      rider.passedWithoutPhoto = false;
      this.riders.push(rider);
      await this.riderService.markAsNonStarter(rider.id, this.eventId);
    } else {
      this.riders.splice(idx, 1);
      rider.isNonStarter = false;

      const firstNonStarter = this.riders.findIndex((r) => r.isNonStarter);
      if (firstNonStarter === -1) {
        this.riders.push(rider);
        await this.closeAllSlidingItems(0);
      } else {
        await this.closeAllSlidingItems(0);
        this.riders.splice(firstNonStarter, 0, rider);
      }

      await this.riderService.markAsStarter(rider.id, this.eventId);
      await this.riderService.reorderRiders(this.riders, this.eventId);
    }
  }

  async togglePassed(rider: Rider): Promise<void> {
    if (rider.isNonStarter) {
      await this.closeAllSlidingItems();
      return;
    }

    const nowPassed = !rider.hasPassed;
    await this.closeAllSlidingItems();

    if (nowPassed) {
      rider.isNonStarter = false;

      const idx = this.riders.indexOf(rider);
      if (idx === -1) {
        return;
      }

      this.riders.splice(idx, 1);

      let lastPassed = -1;
      for (let i = 0; i < this.riders.length; i++) {
        if (this.riders[i].hasPassed) {
          lastPassed = i;
        }
      }

      rider.hasPassed = true;
      rider.passedWithoutPhoto = false;
      this.riders.splice(lastPassed + 1, 0, rider);
      await this.riderService.reorderRiders(this.riders, this.eventId);
    } else {
      rider.hasPassed = false;
      rider.passedWithoutPhoto = false;
      await this.riderService.updateRider(
        rider.id,
        {
          hasPassed: false,
          passedWithoutPhoto: false,
        },
        this.eventId,
      );
    }
  }

  async togglePassedWithoutPhoto(rider: Rider): Promise<void> {
    if (rider.isNonStarter) {
      await this.closeAllSlidingItems();
      return;
    }

    const nowWithoutPhoto = !rider.passedWithoutPhoto;
    await this.closeAllSlidingItems();

    if (nowWithoutPhoto) {
      rider.isNonStarter = false;

      const idx = this.riders.indexOf(rider);
      if (idx === -1) {
        return;
      }

      this.riders.splice(idx, 1);

      let lastPassed = -1;
      for (let i = 0; i < this.riders.length; i++) {
        if (this.riders[i].hasPassed) {
          lastPassed = i;
        }
      }

      rider.hasPassed = true;
      rider.passedWithoutPhoto = true;
      this.riders.splice(lastPassed + 1, 0, rider);

      await this.riderService.reorderRiders(this.riders, this.eventId);
    } else {
      rider.hasPassed = false;
      rider.passedWithoutPhoto = false;
      await this.riderService.updateRider(
        rider.id,
        {
          hasPassed: false,
          passedWithoutPhoto: false,
        },
        this.eventId,
      );
    }
  }

  changeLiterality(): void {
    this.rightHanded = !this.rightHanded;
  }

  async handleReorder(
    event: CustomEvent<ItemReorderEventDetail>,
  ): Promise<void> {
    this.riders = event.detail.complete(this.riders);
    await this.riderService.reorderRiders(this.riders, this.eventId);
  }

  async exportRidersPdf(): Promise<void> {
    await this.generateRidersPdf('download');
  }

  async shareRidersPdf(): Promise<void> {
    await this.generateRidersPdf('share');
  }

  private async generateRidersPdf(mode: 'download' | 'share'): Promise<void> {
    if (!this.event || !this.competition || this.riders.length === 0) {
      await this.presentToast('Aucun cavalier à exporter.', 'warning');
      return;
    }

    this.isExporting = true;

    try {
      const doc = await this.buildRidersPdf();
      const fileName = this.buildPdfFileName();

      if (Capacitor.isNativePlatform()) {
        const fileUri = await this.savePdfToDevice(doc, fileName);

        if (mode === 'share') {
          await Share.share({
            title: 'TrackNJump - Liste des cavaliers',
            text: `Liste des cavaliers - ${this.event.name}`,
            files: [fileUri],
            dialogTitle: 'Partager via Mail ou WhatsApp',
          });
          return;
        }

        await this.presentToast('PDF exporté dans les documents.', 'success');
        return;
      }

      if (mode === 'share') {
        const blob = doc.output('blob');
        const file = new File([blob], fileName, { type: 'application/pdf' });
        const canShareFile =
          typeof navigator !== 'undefined' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] });

        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' &&
          canShareFile
        ) {
          await navigator.share({
            title: 'TrackNJump - Liste des cavaliers',
            text: `Liste des cavaliers - ${this.event.name}`,
            files: [file],
          });
          return;
        }
      }

      doc.save(fileName);
      await this.presentToast('PDF généré.', 'success');
    } catch {
      await this.presentToast(
        "Une erreur est survenue pendant l'export PDF.",
        'danger',
      );
    } finally {
      this.isExporting = false;
    }
  }

  private async buildRidersPdf(): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 30;

    doc.setFillColor(19, 37, 61);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    const logoDataUrl = await this.getLogoDataUrl();

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);

    const title = 'TrackNJump';
    const titleWidth = doc.getTextWidth(title);
    const logoSize = logoDataUrl ? 12 : 0;
    const headerGap = logoDataUrl ? 4 : 0;
    const groupWidth = logoSize + headerGap + titleWidth;
    const groupStartX = (pageWidth - groupWidth) / 2;
    const contentCenterY = headerHeight / 2;

    if (logoDataUrl) {
      doc.addImage(
        logoDataUrl,
        'PNG',
        groupStartX,
        contentCenterY - logoSize / 2,
        logoSize,
        logoSize,
      );
    }

    doc.text(title, groupStartX + logoSize + headerGap, contentCenterY + 2.4);

    doc.setTextColor(19, 37, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(this.competition?.name ?? '', 14, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Date : ${this.competition?.date ?? ''}`, 14, 46);
    doc.text(`Épreuve : ${this.event?.name ?? ''}`, 14, 52);

    const rows = this.riders.map((rider, index) => [
      String(index + 1),
      String(rider.bib),
      rider.name,
      rider.horse,
      this.getRiderStatusCode(rider),
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['#', 'Dossard', 'Cavalier', 'Cheval', 'Statut']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [19, 37, 61],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        textColor: [19, 37, 61],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 22 },
        4: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 10,
        cellPadding: 2.8,
      },
      didParseCell: (data) => {
        if (data.section !== 'body') {
          return;
        }

        const rider = this.riders[data.row.index];
        if (!rider) {
          return;
        }

        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.textColor = [19, 37, 61];

        if (data.column.index === 4) {
          data.cell.styles.fontStyle = 'bold';
        }

        if (rider.isNonStarter) {
          data.cell.styles.fillColor = [244, 244, 244];
          data.cell.styles.textColor = [107, 114, 128];

          if (data.column.index === 4) {
            data.cell.styles.fillColor = [245, 158, 11];
            data.cell.styles.textColor = [255, 255, 255];
          }

          return;
        }

        if (rider.passedWithoutPhoto) {
          data.cell.styles.fillColor = [255, 243, 205];

          if (data.column.index === 4) {
            data.cell.styles.fillColor = [255, 196, 9];
            data.cell.styles.textColor = [19, 37, 61];
          }

          return;
        }

        if (rider.hasPassed) {
          data.cell.styles.fillColor = [212, 237, 218];

          if (data.column.index === 4) {
            data.cell.styles.fillColor = [45, 211, 111];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 58;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 80, 95);
    doc.text(
      'Légende : NP = Non-partant | SP = Sans photo | P = Passé',
      10,
      finalY + 8,
    );

    return doc;
  }

  private getRiderStatusCode(rider: Rider): string {
    if (rider.isNonStarter) {
      return 'NP';
    }

    if (rider.passedWithoutPhoto) {
      return 'SP';
    }

    if (rider.hasPassed) {
      return 'P';
    }

    return '';
  }

  private async savePdfToDevice(doc: jsPDF, fileName: string): Promise<string> {
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.split(',')[1] ?? '';

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    return savedFile.uri;
  }

  private buildPdfFileName(): string {
    const now = new Date();
    const dateFr = `${String(now.getDate()).padStart(2, '0')}-${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}-${now.getFullYear()}`;
    const eventName = this.sanitizeForFileName(this.event?.name ?? 'Epreuve');
    const competitionName = this.sanitizeForFileName(
      this.competition?.name ?? 'Concours',
    );

    return `TrackNJump_${eventName}_${competitionName}_${dateFr}.pdf`;
  }

  private sanitizeForFileName(value: string): string {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-\s_]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    return normalized.length > 0 ? normalized : 'Epreuve';
  }

  private async getLogoDataUrl(): Promise<string | null> {
    try {
      const response = await fetch('assets/icon/tracknjump.png');
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result);
            return;
          }
          reject(new Error('Logo invalide'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      return dataUrl;
    } catch {
      return null;
    }
  }

  private async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 1800,
      position: 'bottom',
    });

    await toast.present();
  }

  private async closeAllSlidingItems(interval = 100): Promise<void> {
    await this.list?.closeSlidingItems();
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
