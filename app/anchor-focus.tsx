'use client';

import { useEffect } from 'react';

export default function AnchorFocus() {
  useEffect(() => {
    let returnLink: HTMLAnchorElement | null = null;
    const desktopPointer = window.matchMedia('(min-width: 768px) and (pointer: fine)');

    function focusAnchor(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!link?.hash || link.target) return;

      const section = document.getElementById(link.hash.slice(1));
      if (!section) return;

      if (!window.location.hash) returnLink = link;

      requestAnimationFrame(() => {
        if (event.defaultPrevented) return;
        const field = section.id === 'booking' && desktopPointer.matches
          ? section.querySelector<HTMLSelectElement>('select[name="serviceId"]:enabled')
          : null;
        (field ?? section).focus({ preventScroll: true });
      });
    }

    function restoreFocus() {
      if (!window.location.hash) returnLink?.focus({ preventScroll: true });
    }

    document.addEventListener('click', focusAnchor);
    window.addEventListener('hashchange', restoreFocus);
    return () => {
      document.removeEventListener('click', focusAnchor);
      window.removeEventListener('hashchange', restoreFocus);
    };
  }, []);

  return null;
}
