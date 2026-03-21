import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Square, Pause, Play, RotateCcw, CheckCircle, Loader2, AlertCircle, User } from 'lucide-react';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // seconds
  questionText?: string;
  interviewMode?: boolean;
  compactMode?: boolean;
}

export default function VideoRecorder({
  onRecordingComplete,
  maxDuration = 180,
  questionText,
  interviewMode = false,
  compactMode = false,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'preview' | 'uploading' | 'submitted'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking]   = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── TTS: read question aloud in interview mode ──────────
  useEffect(() => {
    if (!interviewMode || !questionText) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const speak = () => {
      const utter = new SpeechSynthesisUtterance(questionText);
      utter.rate  = 0.92;
      utter.pitch = 0.88;
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find(v => /Google UK English Male|Microsoft George|Microsoft Ryan|Daniel/i.test(v.name)) ??
        voices.find(v => v.lang.startsWith('en-GB')) ??
        voices.find(v => v.lang.startsWith('en'));
      if (pick) utter.voice = pick;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend   = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (window.speechSynthesis.getVoices().length > 0) {
      timer = setTimeout(speak, 500);
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
    }

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', speak);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [interviewMode, questionText]);

  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
      }
      setStatus('preview');
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000);
    setStatus('recording');
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= maxDuration - 1) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stream, maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    clearInterval(timerRef.current);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setStatus('paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  }, [maxDuration, stopRecording]);

  const retake = useCallback(async () => {
    setRecordedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setElapsed(0);
    setStatus('idle');
    await startCamera();
  }, [previewUrl, startCamera]);

  const submit = useCallback(async () => {
    if (!recordedBlob) return;
    setUploadError(false);
    setStatus('uploading');
    try {
      await onRecordingComplete(recordedBlob);
      setStatus('submitted');
    } catch {
      setStatus('preview');
      setUploadError(true);
    }
  }, [recordedBlob, onRecordingComplete]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>

      {/* Video Container */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111827', borderRadius: 8, overflow: 'hidden', margin: 16 }}>

        {interviewMode && status !== 'preview' && status !== 'uploading' ? (
          <>
            {/* ── Interviewer main view ───────────────────────── */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(145deg, #0c1220 0%, #1a2744 55%, #0c1220 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: compactMode ? 'flex-start' : 'center',
              justifyContent: 'center', gap: 12,
              padding: compactMode ? '14px 0 14px 20px' : '0',
            }}>
              {/* Subtle grid */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.045, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />

              {/* Avatar or speaking waveform */}
              {isSpeaking ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, position: 'relative', zIndex: 1 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div
                      key={i}
                      style={{
                        width: 7, height: 60, borderRadius: 99,
                        background: 'linear-gradient(180deg, #93c5fd 0%, #2563EB 100%)',
                        originY: 1,
                      }}
                      animate={{ scaleY: [0.12, 0.9, 0.35, 1, 0.2, 0.75, 0.12] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  animate={status === 'recording' ? { boxShadow: ['0 0 0 0px rgba(37,99,235,.5)', '0 0 0 14px rgba(37,99,235,.0)'] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                    border: '3px solid rgba(96,165,250,.3)',
                    boxShadow: '0 0 40px rgba(37,99,235,.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                  }}
                >
                  <User size={42} style={{ color: '#fff' }} />
                </motion.div>
              )}

              {/* Name + title */}
              <div style={{ textAlign: compactMode ? 'left' : 'center', position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-.01em' }}>
                  Alex Chen
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: '4px 0 0' }}>
                  Sr. Technical Interviewer · Elevra AI
                </p>
              </div>

              {/* Status pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 99,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                position: 'relative', zIndex: 1,
              }}>
                <motion.div
                  style={{ width: 7, height: 7, borderRadius: '50%', background: isSpeaking ? '#fbbf24' : status === 'recording' ? '#4ade80' : status === 'submitted' ? '#4ade80' : '#60a5fa' }}
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>
                  {isSpeaking            ? 'Alex is asking your question…'
                  : status === 'idle'      ? 'Ready — start recording when you\'re set'
                  : status === 'recording' ? 'Listening…'
                  : status === 'paused'    ? 'Paused'
                  :                         'Answer received ✓'}
                </span>
              </div>

              {/* Bottom gradient name bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '28px 16px 10px',
                background: 'linear-gradient(0deg, rgba(0,0,0,.65) 0%, transparent 100%)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: .9 }}>Alex Chen</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', marginLeft: 6 }}>Elevra AI Interviewer</span>
              </div>
            </div>

            {/* ── User PiP ──────────────────────────────────────── */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              width: 160, aspectRatio: '16/9',
              borderRadius: 10, overflow: 'hidden',
              border: `2px solid ${status === 'recording' ? '#22c55e' : 'rgba(255,255,255,.18)'}`,
              boxShadow: '0 6px 20px rgba(0,0,0,.55)',
              transition: 'border-color .3s',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* "YOU" label */}
              <div style={{
                position: 'absolute', bottom: 5, left: 7,
                fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.9)',
                background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
                padding: '2px 6px', borderRadius: 4,
                letterSpacing: '.06em', textTransform: 'uppercase',
              }}>You</div>
              {/* Submitted mini-overlay on PiP */}
              {status === 'submitted' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  <CheckCircle size={20} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', letterSpacing: '.06em', textTransform: 'uppercase' }}>Done</span>
                </motion.div>
              )}
            </div>

            {/* ── REC badge (top-left) ─────────────────────────── */}
            <AnimatePresence>
              {status === 'recording' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 99, background: 'rgba(239,68,68,.9)', backdropFilter: 'blur(4px)' }}
                >
                  <motion.div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.04em' }}>REC</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Timer (bottom-left) ────────────────────────── */}
            {(status === 'recording' || status === 'paused') && (
              <div style={{
                position: 'absolute', bottom: 14, left: 14,
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
                fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#e2e8f0',
              }}>
                {formatTime(elapsed)} / {formatTime(maxDuration)}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── Standard single-video view (preview / non-interview mode) ── */}
            <video
              ref={videoRef}
              autoPlay={status === 'idle' || status === 'recording' || status === 'paused'}
              playsInline
              muted={status !== 'preview' && status !== 'uploading'}
              controls={status === 'preview' || status === 'uploading'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Recording indicator */}
            <AnimatePresence>
              {status === 'recording' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', top: 16, left: 16,
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px', borderRadius: 99,
                    background: 'rgba(239,68,68,.9)', backdropFilter: 'blur(4px)',
                  }}
                >
                  <motion.div
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>REC</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer */}
            {(status === 'recording' || status === 'paused') && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                padding: '6px 12px', borderRadius: 99,
                background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(6px)',
                fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#fff',
              }}>
                {formatTime(elapsed)} / {formatTime(maxDuration)}
              </div>
            )}

            {/* Submitted overlay */}
            {status === 'submitted' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(15,23,42,.8)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                }}
              >
                <CheckCircle size={48} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 17, fontWeight: 600, color: '#22c55e' }}>Answer Submitted</span>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, padding: '0 16px 16px' }}>
        {status === 'idle' && (
          <button
            onClick={startRecording}
            disabled={isSpeaking}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isSpeaking ? 0.45 : 1, cursor: isSpeaking ? 'not-allowed' : 'pointer' }}
          >
            <Video size={18} />
            {isSpeaking ? 'Wait for the question…' : 'Start Recording'}
          </button>
        )}

        {status === 'recording' && (
          <>
            <button onClick={pauseRecording} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
              <Pause size={16} />
              Pause
            </button>
            <button onClick={stopRecording} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
              <Square size={16} />
              Stop
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button onClick={resumeRecording} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
              <Play size={16} />
              Resume
            </button>
            <button onClick={stopRecording} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
              <Square size={16} />
              Stop
            </button>
          </>
        )}

        {status === 'preview' && (
          <>
            {uploadError && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444', width: '100%', justifyContent: 'center', margin: '0 0 4px' }}>
                <AlertCircle size={13} /> Upload failed — please try again.
              </p>
            )}
            <button onClick={retake} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
              <RotateCcw size={16} />
              Retake
            </button>
            <button onClick={submit} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
              <CheckCircle size={16} />
              Submit Answer
            </button>
          </>
        )}

        {status === 'uploading' && (
          <button disabled className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', opacity: 0.75, cursor: 'not-allowed' }}>
            <Loader2 size={16} className="animate-spin" />
            Uploading…
          </button>
        )}
      </div>
    </div>
  );
}
