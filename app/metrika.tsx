'use client';

import Script from 'next/script';
import { useEffect } from 'react';

const rawId = process.env.NEXT_PUBLIC_YM_ID ?? '';
const id = /^\d{1,12}$/.test(rawId) ? Number(rawId) : 0;
type Goal = 'phone_click' | 'whatsapp_click' | 'telegram_click' | 'booking_submit';

type Counter = {
  (...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};
declare global {
  interface Window { ym?: Counter }
}

function init() {
  if (window.ym) return;
  const queue: Counter = (...args) => (queue.a ??= []).push(args);
  queue.l = Date.now();
  window.ym = queue;
  window.ym(id, 'init', { accurateTrackBounce: true, webvisor: false, trackLinks: false });
}

export function reachGoal(goal: Goal) {
  if (!id) return;
  init();
  window.ym?.(id, 'reachGoal', goal);
}

export default function Metrika() {
  useEffect(() => {
    if (!id) return;
    init();
    function track(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      const goal = link?.dataset.ymGoal;
      if (goal === 'phone_click' || goal === 'whatsapp_click' || goal === 'telegram_click') {
        reachGoal(goal);
      }
    }
    document.addEventListener('click', track);
    return () => document.removeEventListener('click', track);
  }, []);

  return id ? <Script src="https://mc.yandex.ru/metrika/tag.js" strategy="lazyOnload" /> : null;
}
