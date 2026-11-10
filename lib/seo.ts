import type { Metadata } from 'next';
import { branches, studio } from './studio';

const title = studio.seo.title || studio.name;
const description = studio.seo.description ||
  [studio.name, studio.activity, studio.city, ...branches.map(({ address }) => address)].filter(Boolean).join(' · ');
const siteUrl = studio.seo.siteUrl || undefined;

export function homeMetadata(heroPath?: string): Metadata {
  return {
    title,
    description,
    ...(siteUrl && { metadataBase: new URL(siteUrl), alternates: { canonical: '/' } }),
    openGraph: {
      title, description, type: 'website', locale: 'ru_RU', siteName: studio.name,
      ...(siteUrl && { url: siteUrl, ...(heroPath && { images: [heroPath] }) }),
    },
  };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function businessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': branches.map((branch) => {
      const maps = [branch.links.yandex, branch.links.gis].filter(Boolean);
      return {
        '@type': 'LocalBusiness',
        '@id': siteUrl ? new URL('#' + branch.id, siteUrl).href : maps[0] || undefined,
        name: studio.name,
        description: studio.activity || undefined,
        address: {
          '@type': 'PostalAddress',
          streetAddress: branch.address,
          addressLocality: studio.city || undefined,
        },
        telephone: branch.phone || undefined,
        url: siteUrl,
        hasMap: maps[0],
        sameAs: maps.length ? maps : undefined,
        openingHoursSpecification: branch.hours.length ? branch.hours.map(({ days, opens, closes }) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: days.map((day) => 'https://schema.org/' + dayNames[day]),
          opens, closes,
        })) : undefined,
      };
    }),
  };
}
