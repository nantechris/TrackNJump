import { IonList } from '@ionic/angular';

/**
 * Ferme les actions swipe ouvertes puis attend un court délai optionnel.
 */
export async function closeSlidingItems(
  list?: IonList,
  interval = 100,
): Promise<void> {
  await list?.closeSlidingItems();

  if (interval > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, interval));
  }
}
