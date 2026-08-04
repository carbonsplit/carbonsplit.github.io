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
            CRBN <span className="text-neutral-400 dark:text-neutral-500 font-normal transition-colors duration-500">(@carbonsplit)</span>
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
          ><img src="/jx-logo.png" alt="" aria-hidden="true" className="w-5 h-5 rounded-sm inline align-middle mr-1 -translate-y-0.5 dark:invert transition-all duration-500" />JournalX</a>{' '}
          (a simple, fast paced trading journal) & educating people in the
          industry along the way. Scaling{' '}
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
            <svg
              aria-hidden="true"
              className="w-5 h-5 inline align-middle mr-1 -translate-y-0.5 fill-[#5865F2]"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
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
                focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none rounded
              "
            >
              carbonsplit@proton.me
            </a>
            <button
              onClick={handleCopyEmail}
              aria-label={copied ? "Email address copied to clipboard" : "Copy email address to clipboard"}
              className="
                absolute -top-8 left-1/2 -translate-x-1/2 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0
                opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                transition-all duration-300
                bg-neutral-900 dark:bg-white
                text-white dark:text-black
                text-[0.7rem] font-medium px-2 py-1.5 rounded shadow-lg
                whitespace-nowrap pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto
                flex items-center gap-1.5
                focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none
              "
            >
              {copied ? (
                <>
                  <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
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
            className="
              inline-flex items-center
              text-neutral-900 dark:text-white font-medium
              hover:underline underline-offset-4 decoration-neutral-400/50
              transition-colors duration-500
              focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none rounded
            "
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5 inline align-middle mr-1 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>
          .
        </p>
      </div>

      {/* Prop Firm Performance Stats */}
      <TradingPerformance />
    </section>
  );
}
