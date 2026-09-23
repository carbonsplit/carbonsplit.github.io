import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './PillNav.css';

/*
 * Adapted from React Bits "PillNav" (reactbits.dev) — same rising-circle
 * hover animation, reworked as an accessible tab bar: no router, no logo,
 * the active pill stays filled, and the row scrolls on narrow screens.
 */
const PillNav = ({
  items,
  activeIndex = 0,
  onChange,
  ariaLabel = 'Tabs',
  idPrefix = 'pill',
  panelId,
  className = '',
  ease = 'power2.inOut',
}) => {
  const listRef = useRef(null);
  const pillRefs = useRef([]);
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const tweenRefs = useRef([]);
  const hovered = useRef(-1);
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  const progressTo = (i, filled, duration) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    tweenRefs.current[i]?.kill();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    tweenRefs.current[i] = tl.tweenTo(filled ? tl.duration() : 0, {
      duration: reduce ? 0 : duration,
      ease,
      overwrite: 'auto',
    });
  };

  // Build one timeline per pill, sized to the pill's current box
  useLayoutEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        const pill = circle?.parentElement;
        if (!pill) return;

        const { width: w, height: h } = pill.getBoundingClientRect();
        if (!w || !h) return;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        const label = pill.querySelector('.pill-label');
        const hover = pill.querySelector('.pill-label-hover');

        tweenRefs.current[index]?.kill();
        tlRefs.current[index]?.kill();
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });
        if (label) gsap.set(label, { y: 0 });
        if (hover) gsap.set(hover, { y: Math.ceil(h + 100), opacity: 0 });

        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        if (hover) tl.to(hover, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        tlRefs.current[index] = tl;

        // Restore resting state instantly after a re-layout
        if (index === activeRef.current || index === hovered.current) tl.progress(1);
      });
    };

    layout();
    const ro = new ResizeObserver(layout);
    if (listRef.current) ro.observe(listRef.current);
    document.fonts?.ready.then(layout).catch(() => {});

    return () => {
      ro.disconnect();
      tlRefs.current.forEach((tl) => tl?.kill());
    };
  }, [items, ease]);

  // Active pill stays filled; the previous one drains
  useEffect(() => {
    items.forEach((_, i) => {
      if (i === hovered.current) return;
      progressTo(i, i === activeIndex, i === activeIndex ? 0.6 : 0.5);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, items]);

  const handleEnter = (i) => {
    hovered.current = i;
    progressTo(i, true, 0.55);
  };

  const handleLeave = (i) => {
    if (hovered.current === i) hovered.current = -1;
    if (i !== activeRef.current) progressTo(i, false, 0.45);
  };

  const select = (i, focus = false) => {
    onChange?.(i);
    const pill = pillRefs.current[i];
    if (focus) pill?.focus();
    pill?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };

  const onKeyDown = (e) => {
    const n = items.length;
    const keys = {
      ArrowRight: (activeIndex + 1) % n,
      ArrowLeft: (activeIndex - 1 + n) % n,
      Home: 0,
      End: n - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key], true);
  };

  const renderLabel = (item) => (
    <>
      {item.number != null && <span className="pill-number">{item.number}</span>}
      {item.label}
    </>
  );

  return (
    <nav className={`pill-nav ${className}`} aria-label={ariaLabel}>
      <ul className="pill-list scrollbar-hide" role="tablist" ref={listRef} onKeyDown={onKeyDown}>
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={item.label} role="none">
              <button
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${i}`}
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                ref={(el) => (pillRefs.current[i] = el)}
                className={`pill${isActive ? ' is-active' : ''}`}
                onClick={() => select(i)}
                onMouseEnter={() => handleEnter(i)}
                onMouseLeave={() => handleLeave(i)}
                onFocus={() => handleEnter(i)}
                onBlur={() => handleLeave(i)}
              >
                <span
                  className="hover-circle"
                  aria-hidden="true"
                  ref={(el) => (circleRefs.current[i] = el)}
                />
                <span className="label-stack">
                  <span className="pill-label">{renderLabel(item)}</span>
                  <span className="pill-label-hover" aria-hidden="true">
                    {renderLabel(item)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default PillNav;
