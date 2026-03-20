import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Eye, MessageSquare } from 'lucide-react';
import type { FeedbackTimestamp } from '../types';

interface ReplayPlayerProps {
  videoUrl: string;
  feedbackTimestamps: FeedbackTimestamp[];
  eyeContactTimeline?: number[];
  transcript?: string;
}

export default function ReplayPlayer({
  videoUrl,
  feedbackTimestamps,
  eyeContactTimeline = [],
  transcript,
}: ReplayPlayerProps) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const timelineRef  = useRef<HTMLDivElement>(null);

  const [isPlaying,      setIsPlaying]      = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [isMuted,        setIsMuted]        = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<FeedbackTimestamp[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else           videoRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !timelineRef.current || !duration || !isFinite(duration)) return;
    const rect  = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * duration;
    if (isFinite(target)) videoRef.current.currentTime = target;
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      setActiveFeedback(feedbackTimestamps.filter((f) => Math.abs(f.time_seconds - t) < 2));
    };
    const onLoaded = () => { if (isFinite(video.duration) && video.duration > 0) setDuration(video.duration); };
    const onEnded  = () => setIsPlaying(false);

    video.addEventListener('timeupdate',     onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('durationchange', onLoaded);
    video.addEventListener('ended',          onEnded);
    return () => {
      video.removeEventListener('timeupdate',     onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('durationchange', onLoaded);
      video.removeEventListener('ended',          onEnded);
    };
  }, [feedbackTimestamps]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  /* --- styles ------------------------------------------- */
  const ctrl: React.CSSProperties = {
    padding: '8px 10px', borderRadius: 8, background: 'none',
    border: 'none', cursor: 'pointer', color: '#E5E7EB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* -- Video card ----------------------------------- */}
      <div style={{ backgroundColor: '#111827', borderRadius: 16, overflow: 'hidden', border: '1px solid #374151' }}>

        {/* Video element */}
        <div
          onClick={togglePlay}
          style={{ position: 'relative', aspectRatio: '16/9', background: '#000', cursor: 'pointer' }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            playsInline
            preload="metadata"
          />
          {!isPlaying && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,.35)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                backgroundColor: 'rgba(255,101,117,.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={28} style={{ color: '#fff', marginLeft: 4 }} />
              </div>
            </div>
          )}
        </div>

        {/* Timeline scrubber */}
        <div style={{ padding: '12px 16px 0' }}>
          <div
            ref={timelineRef}
            onClick={seekTo}
            style={{
              position: 'relative', width: '100%', height: 10,
              borderRadius: 99, cursor: 'pointer',
              backgroundColor: 'rgba(148,163,184,.15)',
            }}
          >
            {/* Feedback markers */}
            {feedbackTimestamps.map((f, i) => {
              const pos = duration > 0 ? (f.time_seconds / duration) * 100 : 0;
              return (
                <div
                  key={i}
                  title={f.feedback}
                  style={{
                    position: 'absolute', top: 0, width: 4, height: '100%',
                    borderRadius: 99, opacity: 0.7, pointerEvents: 'none',
                    left: `${pos}%`,
                    backgroundColor: f.type === 'positive' ? '#22c55e' : '#ef4444',
                  }}
                />
              );
            })}

            {/* Eye contact overlay */}
            {eyeContactTimeline.length > 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', borderRadius: 99, overflow: 'hidden', opacity: 0.25, pointerEvents: 'none' }}>
                {eyeContactTimeline.map((score, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, pointerEvents: 'none',
                      backgroundColor: score > 0.7 ? '#22c55e' : score > 0.4 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Progress fill */}
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              borderRadius: 99, pointerEvents: 'none',
              background: '#2563EB',
              width: `${progress}%`,
              transition: 'width .1s linear',
            }} />

            {/* Thumb */}
            <div style={{
              position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
              width: 14, height: 14, borderRadius: '50%', pointerEvents: 'none',
              backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.4)',
              left: `${progress}%`,
            }} />
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={togglePlay}  style={ctrl}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
            <button onClick={toggleMute}  style={ctrl}>{isMuted   ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(226,232,240,.5)', marginLeft: 4 }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {transcript && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={{ ...ctrl, backgroundColor: showTranscript ? 'rgba(37,99,235,.15)' : 'transparent', color: showTranscript ? '#2563EB' : '#E5E7EB' }}
              >
                <MessageSquare size={16} />
              </button>
            )}
            <button onClick={toggleFullscreen} style={ctrl}><Maximize size={16} /></button>
          </div>
        </div>

        {/* Transcript panel */}
        <AnimatePresence>
          {showTranscript && transcript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ borderTop: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}
            >
              <div style={{ padding: '14px 16px', maxHeight: 150, overflowY: 'auto' }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(226,232,240,.65)', margin: 0 }}>{transcript}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* -- Feedback sidebar ------------------------------- */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Eye size={14} style={{ color: '#2563EB' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4B5563' }}>Live Feedback</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          <AnimatePresence mode="popLayout">
            {activeFeedback.map((f, i) => (
              <motion.div
                key={`${f.time_seconds}-${i}`}
                initial={{ opacity: 0, x: 16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16, scale: 0.97 }}
                style={{
                  padding: '10px 14px', borderRadius: 12, fontSize: 13,
                  backgroundColor: f.type === 'positive' ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
                  border: f.type === 'positive' ? '1px solid rgba(34,197,94,.2)' : '1px solid rgba(239,68,68,.2)',
                  color: f.type === 'positive' ? '#15803d' : '#dc2626',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.6, marginTop: 1, flexShrink: 0 }}>
                    {fmt(f.time_seconds)}
                  </span>
                  <span style={{ lineHeight: 1.55 }}>{f.feedback}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {activeFeedback.length === 0 && (
            <div style={{
              padding: '32px 16px', borderRadius: 12, textAlign: 'center',
              backgroundColor: '#fff', border: '1px solid #e9ecef',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <MessageSquare size={22} style={{ color: '#d1d5db' }} />
              <span style={{ fontSize: 13, color: '#9ca3af' }}>
                Feedback will appear here as the video plays
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Strong</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Improve</span>
          </div>
        </div>
      </div>

    </div>
  );
}
