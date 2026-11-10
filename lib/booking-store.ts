import { mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface Booking {
  id: string;
  createdAt: string;
  branchId: string;
  branch: string;
  service: string;
  master: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  consent: true;
}

export interface BookingStore {
  save(booking: Booking): Promise<void>;
}

class FileBookingStore implements BookingStore {
  constructor(private readonly directory: string) {}

  async save(booking: Booking) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temporary = join(this.directory, booking.id + '.tmp');
    try {
      await writeFile(temporary, JSON.stringify(booking, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      await rename(temporary, join(this.directory, booking.id + '.json'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') await unlink(temporary).catch(() => {});
      throw error;
    }
  }
}

export const bookingStore: BookingStore = new FileBookingStore(
  process.env.BOOKING_DATA_DIR || join(process.cwd(), '.data', 'bookings'),
);
