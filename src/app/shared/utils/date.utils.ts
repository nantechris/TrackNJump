/**
 * Convertit une date HTML (YYYY-MM-DD) au format français (DD/MM/YYYY).
 */
export function inputDateToFrenchDate(inputDate: string): string {
  const [year, month, day] = inputDate.split('-');
  if (!year || !month || !day) {
    return inputDate;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Convertit une date française (DD/MM/YYYY) au format input HTML (YYYY-MM-DD).
 */
export function frenchDateToInputDate(frenchDate: string): string {
  const [day, month, year] = frenchDate.split('/');
  if (!day || !month || !year) {
    return frenchDate;
  }

  return `${year}-${month}-${day}`;
}
