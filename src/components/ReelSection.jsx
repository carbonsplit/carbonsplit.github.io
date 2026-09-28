import VideoPlayer from '@/components/ui/video-player';

// Web copy of "opus 5.5 video v1.mp4" (1080p30, faststart) + poster frame at 0:02
const REEL_SRC = './videos/carbonsplit-reel.mp4';
const REEL_POSTER = './videos/carbonsplit-reel-poster.jpg';

export default function ReelSection() {
  return (
    <div className="w-full mt-10 pt-8 border-t border-black/[0.06] dark:border-white/[0.08] transition-colors duration-500">
      <h2 className="mb-8 font-display font-normal text-[2.75rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[0.95] tracking-[-0.025em] text-neutral-900 dark:text-white transition-colors duration-500">
        Showcase
      </h2>

      <VideoPlayer
        src={REEL_SRC}
        poster={REEL_POSTER}
        title="carbonsplit reel"
        className="rounded-[26px] border border-black/[0.06] dark:border-white/[0.07] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
