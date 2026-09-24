import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import ProfileSection from './components/ProfileSection';
import ProgressiveBlur from './components/ProgressiveBlur';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { isDark, toggle } = useTheme();

  return (
    <div
      className="
        min-h-screen
        bg-[#fafafa] dark:bg-[#0a0a0a]
        transition-colors duration-500 ease-in-out
      "
    >
      <Header isDark={isDark} onToggle={toggle} />

      {/* Content softens as it scrolls under the header */}
      <ProgressiveBlur position="top" offset={56} height={40} />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Main content area */}
      <main className="max-w-[1140px] mx-auto px-6 md:px-8 pt-8 pb-24">
        <HeroBanner isDark={isDark} />
        <ProfileSection />
      </main>
    </div>
  );
}
