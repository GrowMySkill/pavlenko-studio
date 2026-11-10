import Image from 'next/image';
import Link from 'next/link';
import AnchorFocus from './anchor-focus';
import BookingForm from './booking-form';
import CallPicker from './call-picker';
import { branches, categories, masters, scheduleLabel, studio, tel, type StudioImage } from '../lib/studio';
import { findImage, localImages } from '../lib/images';
import { businessJsonLd, homeMetadata } from '../lib/seo';

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH || '';
const demo = process.env.GITHUB_PAGES === 'true';

export function generateMetadata() {
  return homeMetadata(findImage(studio.images.hero, localImages())?.src);
}

function Photo({ image, hero = false, review = false }: { image: StudioImage; hero?: boolean; review?: boolean }) {
  return <div className={'photo' + (review ? ' review-photo' : '')}>
    <Image src={assetBase + image.src} alt={image.alt} fill preload={hero}
      sizes={hero ? '(min-width: 768px) 45vw, 100vw' : '(min-width: 768px) 33vw, 100vw'} />
  </div>;
}

const socialIcons = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  vkontakte: 'ВКонтакте',
} as const;

function SocialLink({ network, href }: { network: keyof typeof socialIcons; href: string }) {
  return <a className="button social-button" href={href} aria-label={socialIcons[network]}
    data-ym-goal={network === 'vkontakte' ? undefined : network + '_click'}>
    <Image src={assetBase + '/icons/' + network + '.svg'} alt="" width={22} height={22} />
  </a>;
}

const priceFormat = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

export default function Home() {
  const bookable = branches.filter(({ id, hours }) =>
    hours.length && categories.some(({ items }) => items.some(({ branchIds }) => branchIds.includes(id))));
  const callable = branches.filter(({ phone }) => phone)
    .map(({ id, address, phone }) => ({ id, address, phone, href: tel(phone) }));
  const imageFiles = localImages();
  const reviewFiles = localImages('reviews');
  const hero = findImage(studio.images.hero, imageFiles);
  const configuredGallery = studio.images.gallery.flatMap((image) => findImage(image, imageFiles) ?? []);
  const reserved = new Set([hero?.src, ...masters.map(({ image }) => image.src)].filter(Boolean).map((src) => encodeURI(src!)));
  const gallery = configuredGallery.length ? configuredGallery : imageFiles
    .filter((src) => !reserved.has(src)).map((src) => ({ src, alt: 'Фото студии' }));
  const sourceNames = { yandex: 'Яндекс Карты', '2gis': '2ГИС' } as const;
  const reviews = studio.reviews.flatMap((review) => {
    if (review.source !== 'yandex' && review.source !== '2gis') return [];
    const url = review.url || studio.links.reviews[review.source];
    return review.rating === 5 && review.author && review.text && url
      ? [{ ...review, url, sourceName: sourceNames[review.source], image: findImage(review.image, reviewFiles) }]
      : [];
  });
  const ratings = studio.ratingSummary.flatMap((entry) => {
    if (entry.source !== 'yandex' && entry.source !== '2gis') return [];
    const address = branches.find(({ id }) => id === entry.branchId)?.address;
    const url = studio.links.reviews[entry.source];
    return address && url && entry.rating != null && entry.ratingCount != null
      ? [{ ...entry, address, url, sourceName: sourceNames[entry.source] }]
      : [];
  });
  const extraReviews = reviewFiles.filter((src) => !reviews.some(({ image }) => image?.src === src || (image && encodeURI(image.src) === src)));

  return <>
    <AnchorFocus />
    {branches.length > 0 && <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd()).replace(/</g, '\\u003c') }}
    />}
    <header className="rule">
      <div className="wrap flex flex-wrap items-center justify-between gap-3 py-4">
        <a href="#top" className="max-w-xs text-sm font-bold">{studio.name}</a>
        <nav className="actions" aria-label="Запись и звонок">
          {callable.length > 0 && <CallPicker branches={callable} />}
          {bookable.length > 0 && <a className="button" href="#booking">Записаться</a>}
        </nav>
      </div>
    </header>
    <main id="top" tabIndex={-1} className="wrap">
      <section className="rule hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          {studio.city && <p className="eyebrow hero-city">{studio.city}</p>}
          <h1 id="hero-title">{studio.name}</h1>
          {studio.activity && <p className="hero-activity">{studio.activity}</p>}
          {bookable.length > 0 && <a className="button button-primary hero-cta" href="#booking">Записаться</a>}
          {branches.length > 0 && <ul className="hero-branches" aria-label="Адреса студии">
            {branches.map(({ id, address }) => <li key={id}>
              <a href={'#' + id}>{address}</a>
            </li>)}
          </ul>}
        </div>
        {hero && <Photo image={hero} hero />}
      </section>
      {categories.length > 0 && <section className="section rule" aria-labelledby="services-title">
        <h2 id="services-title">Услуги и цены</h2>
        <div className="mt-7 grid gap-6 md:grid-cols-2">
          {categories.map(({ name, items }) => <div key={name} className="panel">
            <h3 className="mb-4">{name}</h3>
            <ul>{items.map((item) => <li className="service-row rule" key={item.id}>
              <div>{item.name}
                {item.branchIds.length < branches.length && <p className="text-sm">
                  {branches.filter(({ id }) => item.branchIds.includes(id)).map(({ address }) => address).join(' · ')}
                </p>}
              </div>
              {item.price !== null && <span className="price">{priceFormat.format(item.price)}</span>}
            </li>)}</ul>
          </div>)}
        </div>
      </section>}
      {masters.length > 0 && <section className="section rule">
        <h2>Мастера</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {masters.map((master) => {
            const image = findImage(master.image, imageFiles);
            return <article className="panel" key={master.id}>
              {image && <Photo image={image} />}
              <h3 className={image ? 'mt-4' : undefined}>{master.name}</h3>
              {master.role && <p className="mt-2">{master.role}</p>}
            </article>;
          })}
        </div>
      </section>}
      {gallery.length > 0 && <section className="section rule">
        <h2>Галерея</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((image) => <Photo key={image.src} image={image} />)}
        </div>
      </section>}
      {(reviews.length > 0 || extraReviews.length > 0 || ratings.length > 0) && <section className="section rule">
        <h2>Отзывы</h2>
        {ratings.length > 0 && <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {ratings.map(({ source, sourceName, address, url }) => <li key={source}>
            <a className="underline" href={url}>{sourceName} · {address}</a>
          </li>)}
        </ul>}
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {reviews.map((review, index) => <figure className="panel" key={index}>
            <div className="mb-3 flex gap-1" role="img" aria-label={review.rating + ' из 5 звёзд'}>
              {Array.from({ length: review.rating }, (_, star) =>
                <Image key={star} src={assetBase + '/icons/star.svg'} alt="" width={18} height={18} />)}
            </div>
            <blockquote className="whitespace-pre-wrap">{review.text}</blockquote>
            <figcaption className="mt-4 text-sm">{review.author}
              {review.date && <> · <time dateTime={review.date}>{review.date.split('-').reverse().join('.')}</time></>}
              {' · '}<a className="underline" href={review.url}>{review.sourceName}</a></figcaption>
            {review.image && <div className="mt-4"><Photo image={review.image} review /></div>}
          </figure>)}
          {extraReviews.map((src) => <Photo key={src} image={{ src, alt: 'Скриншот отзыва о студии' }} review />)}
        </div>
      </section>}
      {bookable.length > 0 && <section className="section rule" id="booking" tabIndex={-1} aria-labelledby="booking-title">
        <h2 id="booking-title">Запись в студию</h2>
        <BookingForm
          branches={bookable.map(({ id, address, hours }) => ({ id, address, hours }))}
          categories={categories.map(({ name, items }) => ({
            name, items: items.map(({ id, name, branchIds }) => ({ id, name, branchIds })),
          }))}
          masters={masters.map(({ id, name, branchIds, serviceIds }) => ({ id, name, branchIds, serviceIds }))}
          timezone={studio.timezone}
          privacyTitle={studio.privacy.title}
          demo={demo}
        />
      </section>}
      {branches.length > 0 && <section className="section" id="contacts" tabIndex={-1} aria-labelledby="contacts-title">
        <h2 id="contacts-title">Контакты</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {branches.map((branch) => <article className="panel" key={branch.id} id={branch.id} tabIndex={-1}>
            <h3>{branch.address}</h3>
            {branch.hours.length > 0 && <ul className="mt-4">{branch.hours.map((group, index) => <li key={index}>{scheduleLabel(group)}</li>)}</ul>}
            {branch.hoursNote && <p className="mt-1 text-sm">{branch.hoursNote}</p>}
            {branch.phone && <a className="mt-3 inline-block underline" href={tel(branch.phone)} data-ym-goal="phone_click">{branch.phone}</a>}
            <div className="actions mt-4">
              {branch.links.whatsapp && <SocialLink network="whatsapp" href={branch.links.whatsapp} />}
              {branch.links.telegram && <SocialLink network="telegram" href={branch.links.telegram} />}
              {branch.links.yandex && <a className="button" href={branch.links.yandex}>Яндекс Карты</a>}
              {branch.links.gis && <a className="button" href={branch.links.gis}>2ГИС</a>}
            </div>
          </article>)}
        </div>
      </section>}
    </main>
    <footer className="border-t border-[var(--line)]">
      <div className="wrap flex flex-wrap justify-between gap-3 py-6 text-sm">
        <span>{studio.name}</span>
        {studio.links.vkontakte && <SocialLink network="vkontakte" href={studio.links.vkontakte} />}
        <Link className="underline" href="/privacy">{studio.privacy.title}</Link>
      </div>
      {studio.demoNotice && <p className="wrap border-t border-[var(--line)] py-4 text-center text-xs font-semibold">
        {studio.demoNotice}
      </p>}
    </footer>
  </>;
}
