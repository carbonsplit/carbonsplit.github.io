## 2025-05-18 - [React + Tailwind Theme Memoization Pattern]
**Learning:** In a Tailwind-powered CSS application, when a parent component manages theme state (e.g., toggling a class on the `html` root element), static children don't need to re-render in React. Tailwind toggling is fully handled by the browser's CSS engine using the class present on the root element. Memoizing these static children avoids expensive React Virtual DOM diffs without breaking style toggling.
**Action:** Always wrap heavy components in `React.memo` if they do not directly consume theme state via React context or JS-level conditionals, even if the application's theme switches.

## 2025-05-18 - [Responsive Media-Based Link Preloading]
**Learning:** Preloading heavy LCP assets indiscriminately (e.g., preloading a light banner always) causes waste and slows down page loading for dark-theme users who default to the other asset. Using the `media` attribute on `<link rel="preload">` restricts preloads strictly to the active color scheme.
**Action:** Always define `media="(prefers-color-scheme: light/dark)"` when preloading theme-dependent LCP assets to avoid redundant image downloads.
