import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/*
 * Liquid Morph Floating Menu — by aayush-duhan (21st.dev), ported to JSX.
 * Changes from the original: sits inline (not fixed to the viewport), opens
 * downward, size adapts to the items, tracks a selected item, closes on
 * Escape / selection, and uses the site's fonts.
 */

const ease = [0.22, 1, 0.36, 1];

const CLOSED_H = 40;
const ITEM_H = 30;
const ITEM_GAP = 16;

function MenuButton({ label, onClick, isOpen, index, selected }) {
  const [hovered, setHovered] = useState(false);
  const animatingRef = useRef(false);
  const pendingLeaveRef = useRef(false);
  const chars = label.split('');
  const lockDuration = 30 * chars.length + 300;

  const handleEnter = useCallback(() => {
    pendingLeaveRef.current = false;
    if (hovered) return;
    setHovered(true);
    animatingRef.current = true;
    setTimeout(() => {
      animatingRef.current = false;
      if (pendingLeaveRef.current) {
        pendingLeaveRef.current = false;
        setHovered(false);
      }
    }, lockDuration);
  }, [hovered, lockDuration]);

  const handleLeave = useCallback(() => {
    if (animatingRef.current) {
      pendingLeaveRef.current = true;
    } else {
      setHovered(false);
    }
  }, []);

  return (
    <motion.button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      aria-label={label}
      tabIndex={isOpen ? 0 : -1}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      className="relative flex items-center gap-2.5 font-display text-[1.45rem] leading-none text-[#eeece8] outline-none focus-visible:underline underline-offset-4"
      style={{ letterSpacing: '-0.01em', height: `${ITEM_H}px` }}
      animate={{ opacity: isOpen ? (selected ? 1 : 0.55) : 0 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: isOpen ? 0.3 + 0.07 * index : 0, ease }}
    >
      <span
        aria-hidden
        className="block h-1 w-1 rounded-full bg-[#eeece8] transition-opacity duration-300"
        style={{ opacity: selected ? 1 : 0 }}
      />
      <span className="flex" aria-hidden>
        {chars.map((char, i) => (
          <span key={i} className="inline-block overflow-hidden" style={{ height: '1.15em' }}>
            <span
              className="flex flex-col"
              style={{
                transitionProperty: 'transform',
                transitionDuration: hovered ? '800ms' : '0ms',
                transitionDelay: hovered ? `${30 * i}ms` : '0ms',
                transform: hovered ? 'translateY(-50%)' : 'translateY(0%)',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <span className="block whitespace-pre" style={{ height: '1.15em', lineHeight: '1.15em' }}>
                {char}
              </span>
              <span className="block whitespace-pre" style={{ height: '1.15em', lineHeight: '1.15em' }}>
                {char}
              </span>
            </span>
          </span>
        ))}
      </span>
    </motion.button>
  );
}

export default function FloatingMenu({
  items = [{ label: 'Home' }, { label: 'Works' }, { label: 'Contact' }],
  label = 'Menu',
  selectedIndex = -1,
  onSelect,
  closedWidth = 150,
  openWidth = 280,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const toggleRef = useRef(null);

  const openHeight = CLOSED_H + 12 + items.length * ITEM_H + (items.length - 1) * ITEM_GAP + 28;

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const choose = (item, idx) => {
    item.onClick?.();
    onSelect?.(idx);
    setIsOpen(false);
  };

  return (
    // Reserves the closed pill's footprint; the open menu overlays content below
    <div
      ref={containerRef}
      className={`relative shrink-0 ${className}`}
      style={{ width: closedWidth, height: CLOSED_H }}
    >
      <motion.div
        className="absolute left-0 top-0 z-50 flex flex-col overflow-hidden"
        style={{ letterSpacing: '-0.02em', cursor: isOpen ? 'default' : 'pointer' }}
        onClick={() => {
          if (!isOpen) setIsOpen(true);
        }}
        initial={false}
        animate={{
          width: isOpen ? openWidth : closedWidth,
          height: isOpen ? openHeight : CLOSED_H,
          borderRadius: isOpen ? 22 : 72,
        }}
        transition={{
          duration: 0.8,
          ease,
          height: { duration: isOpen ? 0.8 : 0.3, ease },
        }}
      >
        {/* Matte base layer */}
        <div
          className="absolute inset-0 border border-black/[0.07] dark:border-white/[0.07] bg-[#ecebe7] dark:bg-[#161616] transition-colors duration-500"
          style={{ borderRadius: 'inherit' }}
        />

        {/* Dark circle expanding from the top */}
        <motion.div
          className="absolute left-1/2 bg-[#1f1f1e] dark:bg-[#232322]"
          style={{ width: '220%', height: '220%', borderRadius: '50%', x: '-50%' }}
          initial={false}
          animate={{ top: isOpen ? '-30%' : '-220%' }}
          transition={{ duration: 0.8, ease, delay: isOpen ? 0.08 : 0 }}
        />

        {/* Top bar: label + morphing toggle */}
        <motion.button
          ref={toggleRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={`relative z-10 flex w-full shrink-0 items-center justify-between gap-3 rounded-full outline-none focus-visible:ring-1 focus-visible:ring-neutral-400/60 transition-colors duration-300 ${
            isOpen ? 'text-[#eeece8]' : 'text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((o) => !o);
          }}
          initial={false}
          animate={{ paddingLeft: isOpen ? 22 : 18, paddingRight: isOpen ? 16 : 14, height: CLOSED_H }}
          transition={{ duration: 0.8, ease }}
        >
          <span className="whitespace-nowrap text-[13px] font-normal leading-none tracking-[0.01em]">
            {label}
          </span>
          <span
            className={`relative flex h-5 w-5 items-center justify-center transition-colors duration-300 ${
              isOpen ? 'text-white' : 'text-black dark:text-white'
            }`}
          >
            <motion.span
              className="absolute block h-[1.5px] w-4 rounded-full bg-current"
              initial={false}
              animate={{
                rotate: isOpen ? 45 : 0,
                y: isOpen ? 0 : -3,
              }}
              transition={{ duration: 0.4, ease }}
            />
            <motion.span
              className="absolute block h-[1.5px] w-4 rounded-full bg-current"
              initial={false}
              animate={{
                rotate: isOpen ? -45 : 0,
                y: isOpen ? 0 : 3,
              }}
              transition={{ duration: 0.4, ease }}
            />
          </span>
        </motion.button>

        {/* Menu items */}
        <div
          role="menu"
          aria-label={label}
          className="relative z-10 flex flex-col items-start px-6 pt-3"
          style={{
            gap: ITEM_GAP,
            pointerEvents: isOpen ? 'auto' : 'none',
            visibility: isOpen ? 'visible' : 'hidden',
            transition: `visibility 0s ${isOpen ? '0s' : '0.3s'}`,
          }}
        >
          {items.map((item, idx) => (
            <MenuButton
              key={item.label}
              label={item.label}
              onClick={() => choose(item, idx)}
              isOpen={isOpen}
              index={idx}
              selected={idx === selectedIndex}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
