import Link from 'next/link';
import { studio } from '../../lib/studio';

export default function Privacy() {
  return <main className="wrap section">
    <Link href="/" className="mb-7 inline-block underline">На главную</Link>
    <h1>{studio.privacy.title}</h1>
    <p className="mt-6 max-w-prose whitespace-pre-line">{studio.privacy.text || 'Текст политики пока не опубликован.'}</p>
  </main>;
}
