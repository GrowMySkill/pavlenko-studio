import type { Branch } from './studio';

export const ANY_MASTER = 'Любой';

export function studioClock(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = (key: Intl.DateTimeFormatPartTypes) => parts.find(({ type }) => type === key)?.value;
  return {
    date: [value('year'), value('month'), value('day')].join('-'),
    time: [value('hour'), value('minute')].join(':'),
  };
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const timeLabel = (minute: number) =>
  String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');

export function slotsFor(hours: Branch['hours'], date: string, clock: ReturnType<typeof studioClock>) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < clock.date) return [];
  const day = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(day.valueOf()) || day.toISOString().slice(0, 10) !== date) return [];
  const slots = new Set<string>();
  for (const { days, opens, closes } of hours) {
    if (!days.includes(day.getUTCDay())) continue;
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(opens) ||
        !/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/.test(closes)) continue;
    for (let start = minutes(opens); start + 30 <= minutes(closes); start += 30) {
      const time = timeLabel(start);
      if (date !== clock.date || time > clock.time) slots.add(time);
    }
  }
  return [...slots].sort();
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const national = (/^\+7/.test(value) || /^[78]\d{10,}$/.test(digits) ? digits.slice(1) : digits).slice(0, 10);
  if (!national) return '';
  return '+7 (' + national.slice(0, 3) +
    (national.length > 3 ? ') ' + national.slice(3, 6) : '') +
    (national.length > 6 ? '-' + national.slice(6, 8) : '') +
    (national.length > 8 ? '-' + national.slice(8) : '');
}
