import studio from '../content/studio.json';

export { studio };
export type Branch = (typeof studio.branches)[number];
export type StudioImage = { src: string; alt: string };

export const categories = studio.categories
  .filter(({ name }) => name.trim())
  .map(({ name, items }) => ({
    name,
    items: items.filter((item) => item.id.trim() && item.name.trim()),
  }))
  .filter(({ items }) => items.length);

export const services = categories.flatMap(({ items }) => items);
type Master = {
  id: string;
  name: string;
  role: string;
  image: StudioImage;
  branchIds: string[];
  serviceIds: string[];
};
export const masters: Master[] = studio.masters.filter(({ id, name }) => id.trim() && name.trim());
export const branches = studio.branches.filter(({ id, address }) => id.trim() && address.trim());
export const tel = (phone: string) => 'tel:' + phone.replace(/[^+\d]/g, '');
export const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function scheduleLabel(group: Branch['hours'][number]) {
  const label = new Set(group.days).size === 7
    ? 'Ежедневно'
    : [...group.days].sort((a, b) => (a + 6) % 7 - (b + 6) % 7).map((day) => days[day]).join(', ');
  return label + ' · ' + group.opens + '–' + group.closes;
}
