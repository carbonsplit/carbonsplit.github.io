export default function HeroBanner({ isDark }) {
  return (
    <section data-pit-banner className="w-full">
      <div
        className="
          relative w-full
          h-[160px] sm:h-[200px] md:h-[240px] lg:h-[260px]
          rounded-2xl overflow-hidden
          shadow-lg shadow-black/10 dark:shadow-black/40
          border border-black/[0.05] dark:border-white/[0.06]
          transition-[border-color,box-shadow] duration-500 ease-in-out
        "
      >
        {/* Light mode image (daytime) */}
        <img
          src="/banner_light.jpg"
          alt="Ford Mustang GT3 – Daytime"
          className={`
            absolute inset-0 w-full h-full object-cover object-center
            transition-opacity duration-700 ease-in-out
            ${isDark ? 'opacity-0' : 'opacity-100'}
          `}
          loading="eager"
          fetchPriority="high"
          draggable="false"
        />

        {/* Dark mode image (nighttime) */}
        <img
          src="/banner_dark.jpg"
          alt="Ford Mustang GT3 – Nighttime"
          className={`
            absolute inset-0 w-full h-full object-cover object-center
            transition-opacity duration-700 ease-in-out
            ${isDark ? 'opacity-100' : 'opacity-0'}
          `}
          loading="eager"
          fetchPriority="high"
          draggable="false"
        />

        {/* Subtle inner vignette for cinematic depth */}
        <div
          className="
            absolute inset-0 pointer-events-none
            bg-gradient-to-t from-black/20 via-transparent to-black/10
            dark:from-black/40 dark:via-transparent dark:to-black/20
            transition-opacity duration-700
          "
        />
      </div>
    </section>
  );
}

