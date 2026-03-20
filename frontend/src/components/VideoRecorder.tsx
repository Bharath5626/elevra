import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Square, Pause, Play, RotateCcw, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // seconds
  questionText?: string;
}

export default function VideoRecorder({
  onRecordingComplete,
  maxDuration = 180,
  questionText,
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
      {questionText && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(37,99,235,.04)' }}>
          <p style={{ fontSize: 13, color: 'rgba(226,232,240,.75)', margin: 0 }}>{questionText}</p>
        </div>
      )}

      {/* Video Container */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111827', borderRadius: 8, overflow: 'hidden', margin: 16 }}>
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
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, padding: '0 16px 16px' }}>
        {status === 'idle' && (
          <button onClick={startRecording} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={18} />
            Start Recording
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
