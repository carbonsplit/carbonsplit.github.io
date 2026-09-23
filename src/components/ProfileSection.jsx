import { useState } from 'react';
import TradingPerformance from './TradingPerformance';
import CalendarSection from './CalendarSection';
import CarbonScripts from './CarbonScripts';

// Quiet underlined links (the reference style); logos only for my own products
const LINK =
  'font-medium text-neutral-900 dark:text-neutral-100 underline decoration-1 underline-offset-[5px] decoration-neutral-300 dark:decoration-neutral-600 hover:decoration-neutral-900 dark:hover:decoration-neutral-100 transition-colors duration-300';
const LOGO = 'inline-block h-[0.95em] w-[0.95em] align-[-0.12em] mr-1.5 rounded-[3px]';

export default function ProfileSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('carbonsplit@proton.me');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full mt-8">
      {/* Avatar + Name row */}
      <div className="flex items-center gap-4">
        <img
          src="/avatar.jpg"
          alt="Profile avatar"
          className="
            w-14 h-14 aspect-square rounded-full object-cover
            ring-1 ring-black/[0.06] dark:ring-white/[0.08]
            transition-all duration-500
          "
          draggable="false"
        />
        <div className="flex flex-col justify-center items-start">
          <h1 className="text-[1.05rem] font-medium leading-snug text-neutral-900 dark:text-white transition-colors duration-500">
            M
          </h1>
          <p className="text-[0.9rem] leading-snug text-neutral-500 dark:text-neutral-400 transition-colors duration-500">
            @carbonsplit · Trading &amp; Motorsports
          </p>
        </div>
      </div>

      {/* Bio */}
      <div className="max-w-[580px] mt-10 transition-colors duration-500">
        <p className="text-[1.05rem] leading-[1.7] [text-wrap:pretty] text-neutral-500 dark:text-neutral-400">
          Foraging currencies, futures and metals since ’23. I built{' '}
          <a href="https://journalx-ada8e.web.app" target="_blank" rel="noopener noreferrer" className={`${LINK} whitespace-nowrap`}>
            <img src="/jx-logo.png" alt="" className={`${LOGO} dark:invert`} />
            JournalX
          </a>
          , a simple, fast-paced trading journal, and I educate traders along the way. I’m also
          slowly scaling{' '}
          <a href="https://discord.gg/fPGE5Jn9pN" target="_blank" rel="noopener noreferrer" className={`${LINK} whitespace-nowrap`}>
            <img src="/favicon.png" alt="" className={LOGO} />
            Memoir Capital
          </a>
          , an intimate space traders actually feel at home in.
        </p>

        <p className="mt-5 text-[1.05rem] leading-[1.7] [text-wrap:pretty] text-neutral-500 dark:text-neutral-400">
          Join{' '}
          <a href="https://discord.gg/fPGE5Jn9pN" target="_blank" rel="noopener noreferrer" className={LINK}>
            Memoir on Discord
          </a>
          , find me on{' '}
          <a href="https://x.com/carbonsplit" target="_blank" rel="noopener noreferrer" className={LINK}>
            X
          </a>
          , or reach me by{' '}
          <span className="relative group inline-block">
            <a href="mailto:carbonsplit@proton.me" className={LINK}>
              email
            </a>
            <button
              onClick={handleCopyEmail}
              className="
                absolute -top-8 left-1/2 -translate-x-1/2 translate-y-1 group-hover:translate-y-0
                opacity-0 group-hover:opacity-100
                transition-all duration-300
                bg-neutral-900 dark:bg-white
                text-white dark:text-black
                text-[0.7rem] font-medium px-2 py-1.5 rounded shadow-lg
                whitespace-nowrap pointer-events-none group-hover:pointer-events-auto
                flex items-center gap-1.5
              "
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy carbonsplit@proton.me
                </>
              )}
            </button>
          </span>
          .
        </p>
      </div>

      {/* Prop Firm Performance Stats */}
      <TradingPerformance />

      {/* Trading Calendar */}
      <CalendarSection />

      {/* Carbon indicator suite */}
      <CarbonScripts />
    </section>
  );
}
