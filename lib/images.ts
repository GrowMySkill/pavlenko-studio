import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { StudioImage } from './studio';

const folder = join(process.cwd(), 'public', 'images');
const extension = /\.(avif|webp|jpe?g|png)$/i;

export function localImages(subfolder = '') {
  try {
    return readdirSync(join(folder, subfolder), { withFileTypes: true })
      .filter((entry) => entry.isFile() && extension.test(entry.name))
      .map(({ name }) => '/images/' + (subfolder ? subfolder + '/' : '') + encodeURIComponent(name))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export function findImage(image: StudioImage, available: string[]) {
  return available.includes(encodeURI(image.src)) || available.includes(image.src) ? image : null;
}
