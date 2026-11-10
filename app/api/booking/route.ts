import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { z } from 'zod';
import { ANY_MASTER, slotsFor, studioClock } from '../../../lib/booking';
import { bookingStore, type Booking } from '../../../lib/booking-store';
import { sendBookingToMax } from '../../../lib/max';
import { branches, masters, services, studio } from '../../../lib/studio';

export const runtime = 'nodejs';

const schema = z.strictObject({
  branchId: z.string().min(1).max(100),
  serviceId: z.string().min(1).max(100),
  masterId: z.string().max(100),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(100).regex(/^[^\p{Cc}]+$/u),
  phone: z.string().regex(/^\+7\d{10}$/),
  consent: z.literal(true),
  website: z.literal(''),
});

const windowMs = 10 * 60_000;
const limit = 5;
const requests = new Map<string, { count: number; expires: number }>();
let nextCleanup = 0;

function retryAfter(request: Request) {
  const header = process.env.BOOKING_IP_HEADER;
  const ip = header ? request.headers.get(header)?.trim() : undefined;
  const key = ip && isIP(ip) ? ip : 'local';
  const now = Date.now();
  if (now >= nextCleanup) {
    for (const [client, entry] of requests) {
      if (entry.expires <= now) requests.delete(client);
    }
    nextCleanup = now + 60_000;
  }
  const entry = requests.get(key);
  if (entry && entry.expires > now) {
    if (entry.count >= limit) return Math.ceil((entry.expires - now) / 1000);
    entry.count++;
  } else {
    requests.set(key, { count: 1, expires: now + windowMs });
  }
  return 0;
}

export async function POST(request: Request) {
  const retry = retryAfter(request);
  if (retry) return Response.json({ error: 'Слишком много попыток. Попробуйте позже.' }, {
    status: 429, headers: { 'Retry-After': String(retry) },
  });

  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return Response.json({ error: 'Проверьте поля формы и поставьте галочку в поле согласия.' }, { status: 400 });

  const { branchId, serviceId, masterId, date, time, name, phone, consent } = result.data;
  const branch = branches.find(({ id }) => id === branchId);
  const service = services.find(({ id, branchIds }) => id === serviceId && branchIds.includes(branchId));
  const master = masters.find(({ id, branchIds, serviceIds }) =>
    id === masterId && branchIds.includes(branchId) && (!serviceIds.length || serviceIds.includes(serviceId)));
  const clock = studioClock(studio.timezone);

  if (!branch || !service || (masterId && !master) || !slotsFor(branch.hours, date, clock).includes(time)) {
    return Response.json({ error: 'Проверьте филиал, услугу, мастера, дату и время.' }, { status: 400 });
  }

  const booking: Booking = {
    id: randomUUID(), createdAt: new Date().toISOString(),
    branchId, branch: branch.address, service: service.name, master: master?.name ?? ANY_MASTER,
    date, time, name, phone, consent,
  };
  try {
    await bookingStore.save(booking);
  } catch (error) {
    console.error('[booking] Storage failure', booking.id, (error as NodeJS.ErrnoException).code);
    return Response.json({ error: 'Не удалось сохранить заявку. Попробуйте позже.' }, { status: 503 });
  }

  try {
    await sendBookingToMax(booking);
  } catch (error) {
    console.error('[booking] MAX delivery failure', booking.id, (error as Error).message);
  }
  return Response.json({ ok: true }, { status: 201 });
}
