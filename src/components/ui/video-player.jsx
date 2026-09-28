import { useRef, useState } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/*
 * Video Player — by chetanverma16 (21st.dev), ported to JSX.
 * Changes from the original: plain buttons instead of shadcn/Radix Button
 * (no extra deps), play state synced from the <video> element's own events
 * (fixes the icon sticking on "pause" after the video ends), poster + centre
 * play button, controls stay visible while paused or focused (so touch and
 * keyboard users can reach them), and it fills its container.
 */

const formatTime = (seconds) => {
  if (!isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CONTROL_BTN =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50';

const CustomSlider = ({ value, onChange, className, label }) => (
  <motion.div
    role="slider"
    tabIndex={0}
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value)}
    className={cn(
      'relative h-1 w-full cursor-pointer rounded-full bg-white/20 outline-none focus-visible:ring-1 focus-visible:ring-white/50',
      className
    )}
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      onChange(Math.min(Math.max(percentage, 0), 100));
    }}
    onKeyDown={(e) => {
      if (e.key === 'ArrowRight') onChange(Math.min(value + 5, 100));
      if (e.key === 'ArrowLeft') onChange(Math.max(value - 5, 0));
    }}
  >
    <motion.div
      className="absolute left-0 top-0 h-full rounded-full bg-white"
      style={{ width: `${value}%` }}
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
  </motion.div>
);

const VideoPlayer = ({ src, poster, title = 'Video', className, defaultVolume = 0.4 }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [started, setStarted] = useState(false);

  const showControls = hovered || focused || (started && !isPlaying);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play();
    else v.pause();
  };

  const handleVolumeChange = (value) => {
    const v = videoRef.current;
    if (!v) return;
    const newVolume = value / 100;
    v.volume = newVolume;
    v.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = (v.currentTime / v.duration) * 100;
    setProgress(isFinite(p) ? p : 0);
    setCurrentTime(v.currentTime);
  };

  const handleSeek = (value) => {
    const v = videoRef.current;
    if (!v?.duration) return;
    const time = (value / 100) * v.duration;
    if (isFinite(time)) {
      v.currentTime = time;
      setProgress(value);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !isMuted;
    v.muted = next;
    setIsMuted(next);
    if (!next && v.volume === 0) {
      v.volume = defaultVolume;
      setVolume(defaultVolume);
    }
  };

  const setSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  return (
    <motion.div
      className={cn('group relative w-full overflow-hidden bg-black', className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
    >
      <video
        ref={videoRef}
        className="block aspect-video w-full cursor-pointer"
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        aria-label={title}
        onClick={togglePlay}
        onPlay={() => {
          setIsPlaying(true);
          setStarted(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          e.currentTarget.volume = volume; // start at the default (40%) unless already changed
        }}
      />

      {/* Centre play button before first play */}
      <AnimatePresence>
        {!started && (
          <motion.button
            type="button"
            onClick={togglePlay}
            aria-label={`Play ${title}`}
            className="absolute inset-0 flex items-center justify-center bg-black/10 focus-visible:outline-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <Play className="ml-1 h-6 w-6 fill-current" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {started && showControls && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 mx-auto m-2 max-w-xl rounded-2xl bg-[#11111198] p-3 sm:p-4 backdrop-blur-md"
            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: 'circInOut', type: 'spring' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="w-9 text-sm tabular-nums text-white">{formatTime(currentTime)}</span>
              <CustomSlider value={progress} onChange={handleSeek} className="flex-1" label="Seek" />
              <span className="w-9 text-right text-sm tabular-nums text-white">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className={CONTROL_BTN}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </motion.button>
                <div className="flex items-center gap-x-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className={CONTROL_BTN}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : volume > 0.5 ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <Volume1 className="h-5 w-5" />
                    )}
                  </motion.button>
                  <div className="hidden w-24 sm:block">
                    <CustomSlider
                      value={isMuted ? 0 : volume * 100}
                      onChange={handleVolumeChange}
                      label="Volume"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <motion.button
                    type="button"
                    key={speed}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSpeed(speed)}
                    aria-pressed={playbackSpeed === speed}
                    className={cn(CONTROL_BTN, playbackSpeed === speed && 'bg-white/10')}
                  >
                    {speed}x
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoPlayer;
