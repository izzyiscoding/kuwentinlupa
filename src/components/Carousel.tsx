/**
 * A swipeable row of cards: native scroll with snap points (so touch, trackpad
 * and keyboard all work), plus previous/next buttons and dots. Two cards to a
 * view on a wide screen, one on a phone (see .carousel in app.css).
 */
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLang } from '../lib/lang';

export default function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useLang();
  const track = useRef<HTMLOListElement>(null);
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(1);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const first = el.children[0] as HTMLElement | undefined;
      if (!first) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
      setPerView(Math.max(1, Math.round(el.clientWidth / step)));
      setIndex(Math.round(el.scrollLeft / step));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const go = (i: number) => {
    const el = track.current;
    const target = el?.children[Math.max(0, Math.min(i, slides.length - 1))] as HTMLElement | undefined;
    if (!el || !target) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  };
  const last = Math.max(0, slides.length - perView);
  const pages = Array.from({ length: last + 1 }, (_, i) => i);

  return (
    <div className="carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <ol className="carousel-track" ref={track}>
        {slides.map((s, i) => (
          <li key={i} className="carousel-slide" aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}`}>
            {s}
          </li>
        ))}
      </ol>
      {last > 0 && (
        <div className="carousel-nav">
          <button type="button" className="icon-button" onClick={() => go(index - 1)} disabled={index <= 0} aria-label={t('Previous', 'Nakaraan')}>‹</button>
          <div className="carousel-dots">
            {pages.map((i) => (
              <button key={i} type="button" className={i === Math.min(index, last) ? 'on' : undefined} aria-label={`${i + 1}`} aria-current={i === Math.min(index, last) ? 'true' : undefined} onClick={() => go(i)} />
            ))}
          </div>
          <button type="button" className="icon-button" onClick={() => go(index + 1)} disabled={index >= last} aria-label={t('Next', 'Susunod')}>›</button>
        </div>
      )}
    </div>
  );
}
