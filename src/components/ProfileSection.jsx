import { useState } from 'react';
import TradingPerformance from './TradingPerformance';

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
      <div className="flex items-center gap-5 mb-6">
        <img
          src="/avatar.jpg"
          alt="Profile avatar"
          className="
            w-20 h-20 aspect-square rounded-full object-cover
            ring-2 ring-black/[0.06] dark:ring-white/[0.08]
            shadow-md shadow-black/10 dark:shadow-black/30
            transition-all duration-500
          "
          draggable="false"
        />
        <div className="flex flex-col justify-center items-start">
          <h1
            className="
              text-[1.5rem] font-semibold tracking-tight leading-tight
              text-neutral-900 dark:text-white
              transition-colors duration-500
            "
          >
            M <span className="text-neutral-400 dark:text-neutral-500 font-normal transition-colors duration-500">(@carbonsplit)</span>
          </h1>
          <p
            className="
              text-[0.9rem] font-normal mt-1
              text-neutral-500 dark:text-neutral-400
              transition-colors duration-500
            "
          >
            Trading & Motorsports.
          </p>
        </div>
      </div>

      {/* Description */}
      <div
        className="
          text-[0.95rem] leading-[1.7] font-normal
          text-neutral-600 dark:text-neutral-400
          transition-colors duration-500
          max-w-[680px] mt-4 text-justify
        "
      >
        <p>
          Foraging currencies, futures and metals since '23, developed{' '}
          <a
            href="https://journalx-ada8e.web.app"
            target="_blank"
            rel="noopener noreferrer"
            className="
              text-neutral-900 dark:text-white font-medium
              hover:underline underline-offset-4 decoration-neutral-400/50
              transition-colors duration-500
            "
          ><img src="/jx-logo.png" alt="" className="w-3.5 h-3.5 rounded-sm inline align-top mr-0.5 -translate-y-1 dark:invert transition-all duration-500" />JournalX</a>{' '}
          (a simple, fast paced trading journal) & educating people in the
          industry along the way. Scaling
          <a
            href="https://discord.gg/fPGE5Jn9pN"
            target="_blank"
            rel="noopener noreferrer"
            className="
              text-neutral-900 dark:text-white font-medium
              hover:underline underline-offset-4 decoration-neutral-400/50
              transition-colors duration-500
            "
          >
            <img
              src="/favicon.png"
              alt=""
              className="w-4 h-4 rounded-sm inline align-top ml-1 mr-0.5 -translate-y-0.5 transition-all duration-500"
            />
            Memoir Capital
          </a>
          {' '}slowly, driving organic engagement, and shaping an intimate space that traders actually feel at home in.
        </p>
        <p className="mt-4">
          You can reach out to me at{' '}
          <span className="relative group inline-block">
            <a
              href="mailto:carbonsplit@proton.me"
              className="
                text-neutral-900 dark:text-white font-medium
                hover:underline underline-offset-4 decoration-neutral-400/50
                transition-colors duration-500
              "
            >
              carbonsplit@proton.me
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
                  Copy
                </>
              )}
            </button>
          </span>{' '}
          or message me on{' '}
          <a
            href="https://x.com/carbonsplit"
            target="_blank"
            rel="noopener noreferrer"
            title="Twitter / X"
            className="
              inline-block text-neutral-900 dark:text-white
              hover:opacity-70 transition-opacity duration-300 align-middle -translate-y-[3.5px] ml-0.5
            "
          >
            <svg
              className="w-[0.95rem] h-[0.95rem] fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          .
        </p>
      </div>

      {/* Prop Firm Performance Stats */}
      <TradingPerformance />
    </section>
  );
}
