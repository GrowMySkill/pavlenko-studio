import type { Booking } from './booking-store';

export async function sendBookingToMax(booking: Booking) {
  const token = process.env.MAX_BOT_TOKEN;
  const recipient = process.env.MAX_RECIPIENT_ID;
  if (!token || !recipient || !/^\d+$/.test(recipient)) {
    throw new Error('MAX: проверьте настройки токена и ID получателя');
  }

  const url = new URL('https://platform-api2.max.ru/messages');
  url.searchParams.set('user_id', recipient);
  const { name, phone, service, master, date, time, branch } = booking;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Новая заявка: ${name}, ${phone}, ${service}, мастер: ${master}, ${date}, ${time}\nФилиал: ${branch}`,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error('MAX: ошибка соединения или превышено время ожидания');
  }
  if (!response.ok) throw new Error('MAX: HTTP ' + response.status);
}
