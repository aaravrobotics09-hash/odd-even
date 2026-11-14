import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import {
  FingerTelemetry,
  GestureStabilityTracker,
  recognizeCustomHandGesture,
} from '../utils/gestureRecognizer';
import HandIcon from './HandIcon';

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

interface WebcamPanelProps {
  webcamEnabled: boolean;
  canLock: boolean;
  turnId: number;
  onConfirmNumber: (num: number) => void;
  onEnableFallback: () => void;
}

export default function WebcamPanel({
  webcamEnabled,
  canLock,
  turnId,
  onConfirmNumber,
  onEnableFallback,
}: WebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const trackerRef = useRef<GestureStabilityTracker>(new GestureStabilityTracker(750));
  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(0);

  const canLockRef = useRef<boolean>(canLock);
  const turnIdRef = useRef<number>(turnId);
  const onConfirmRef = useRef<(num: number) => void>(onConfirmNumber);
  const lockedTurnRef = useRef<number>(-1);

  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectedNum, setDetectedNum] = useState<number | null>(null);
  const [hint, setHint] = useState<string>('Show hand gesture 1–9');
  const [stabilityProgress, setStabilityProgress] = useState<number>(0);
  const [fingerState, setFingerState] = useState<FingerTelemetry | null>(null);

  useEffect(() => {
    canLockRef.current = canLock;
  }, [canLock]);

  useEffect(() => {
    onConfirmRef.current = onConfirmNumber;
  }, [onConfirmNumber]);

  useEffect(() => {
    turnIdRef.current = turnId;
    trackerRef.current.reset();
    setStabilityProgress(0);
    setDetectedNum(null);
  }, [turnId]);

  useEffect(() => {
    if (!webcamEnabled) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraStatus('idle');
      return;
    }

    let cancelled = false;

    async function setupVisionAndCamera() {
      setCameraStatus('loading');
      setErrorMessage('');

      try {
        if (!landmarkerRef.current) {
          const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
          const modelPath =
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

          try {
            landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
              baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
              runningMode: 'VIDEO',
              numHands: 1,
              minHandDetectionConfidence: 0.6,
              minHandPresenceConfidence: 0.6,
              minTrackingConfidence: 0.6,
            });
          } catch {
            landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
              baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
              runningMode: 'VIDEO',
              numHands: 1,
              minHandDetectionConfidence: 0.6,
              minHandPresenceConfidence: 0.6,
              minTrackingConfidence: 0.6,
            });
          }
        }

        if (cancelled) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('UNSUPPORTED');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        setCameraStatus('ready');

        const renderLoop = () => {
          if (cancelled) return;
          const v = videoRef.current;
          const canvas = canvasRef.current;
          const detector = landmarkerRef.current;

          if (v && canvas && detector && v.readyState >= 2 && v.videoWidth > 0) {
            if (canvas.width !== v.videoWidth || canvas.height !== v.videoHeight) {
              canvas.width = v.videoWidth;
              canvas.height = v.videoHeight;
            }

            if (v.currentTime !== lastVideoTimeRef.current) {
              lastVideoTimeRef.current = v.currentTime;
              const now = Math.max(performance.now(), lastTimestampRef.current + 1);
              lastTimestampRef.current = now;

              const results = detector.detectForVideo(v, now);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.landmarks && results.landmarks.length > 0) {
                  const lm = results.landmarks[0];
                  const aspect = v.videoWidth / v.videoHeight;
                  const recognition = recognizeCustomHandGesture(lm, aspect);

                  setDetectedNum(recognition.number);
                  setHint(recognition.hint);
                  setFingerState(recognition.fingers);

                  ctx.lineWidth = 3;
                  ctx.strokeStyle = recognition.number ? '#10b981' : '#38bdf8';
                  for (const [a, b] of HAND_CONNECTIONS) {
                    ctx.beginPath();
                    ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
                    ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
                    ctx.stroke();
                  }

                  for (let i = 0; i < lm.length; i++) {
                    const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
                    ctx.beginPath();
                    ctx.arc(
                      lm[i].x * canvas.width,
                      lm[i].y * canvas.height,
                      isTip ? 5.5 : 3.5,
                      0,
                      Math.PI * 2
                    );
                    ctx.fillStyle = isTip ? '#fbbf24' : '#ffffff';
                    ctx.fill();
                  }

                  const activeTurnId = turnIdRef.current;
                  if (canLockRef.current && lockedTurnRef.current !== activeTurnId) {
                    const stability = trackerRef.current.update(recognition.number, now);
                    setStabilityProgress(stability.progress);
                    if (stability.stableNumber !== null) {
                      lockedTurnRef.current = activeTurnId;
                      trackerRef.current.reset();
                      setStabilityProgress(1);
                      onConfirmRef.current(stability.stableNumber);
                    }
                  } else {
                    setStabilityProgress(0);
                  }
                } else {
                  setDetectedNum(null);
                  setFingerState(null);
                  setHint('Place your hand inside the frame');
                  const stability = trackerRef.current.update(null, now);
                  setStabilityProgress(stability.progress);
                }
              }
            }
          }

          rafRef.current = requestAnimationFrame(renderLoop);
        };

        rafRef.current = requestAnimationFrame(renderLoop);
      } catch (err) {
        if (!cancelled) {
          setCameraStatus('error');
          const errName = err instanceof Error ? err.name : '';
          setErrorMessage(
            errName === 'NotAllowedError'
              ? 'Camera permission denied. Allow webcam access or switch to the Gesture Pad.'
              : 'Webcam unavailable or blocked in this browser. You can play using the Gesture Pad.'
          );
        }
      }
    }

    setupVisionAndCamera();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [webcamEnabled]);

  if (!webcamEnabled) {
    return (
      <div className="rounded-xl border border-slate-700/70 bg-[#0d1930]/90 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold tracking-wide text-white">Gesture Pad</h3>
          <span className="text-xs font-medium text-amber-400">Webcam Off</span>
        </div>
        <p className="mb-3 text-xs text-slate-300">
          Tap a gesture (1–9) to lock your selection simultaneously against Cricko-Bot:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={!canLock}
              onClick={() => onConfirmNumber(num)}
              className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-white transition hover:border-emerald-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <HandIcon number={num} size={40} />
              <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">{num}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#0d1930]/90 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold tracking-wide text-white">Webcam Hand Tracker</h3>
        <span
          className={`text-xs font-semibold ${
            cameraStatus === 'ready'
              ? 'text-emerald-400'
              : cameraStatus === 'loading'
              ? 'text-amber-400'
              : cameraStatus === 'error'
              ? 'text-red-400'
              : 'text-slate-400'
          }`}
        >
          {cameraStatus === 'ready'
            ? 'Camera Ready'
            : cameraStatus === 'loading'
            ? 'Loading Hand AI...'
            : cameraStatus === 'error'
            ? 'Camera Unavailable'
            : 'Camera Off'}
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />

        {cameraStatus === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/85 p-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
            <p className="text-sm text-slate-200">Loading MediaPipe Hands &amp; camera...</p>
          </div>
        )}

        {cameraStatus === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-5 text-center">
            <p className="text-sm leading-relaxed text-red-200">{errorMessage}</p>
            <button
              type="button"
              onClick={onEnableFallback}
              className="min-h-[44px] whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Switch to Gesture Pad
            </button>
          </div>
        )}

        {cameraStatus === 'ready' && (
          <>
            <div
              className={`absolute right-3 top-3 z-10 rounded-lg border px-3 py-1.5 text-center backdrop-blur-sm ${
                detectedNum
                  ? 'border-emerald-400/70 bg-slate-950/85'
                  : 'border-slate-700 bg-slate-950/80'
              }`}
            >
              <span className="block text-[10px] font-bold tracking-wider text-slate-400">
                DETECTED
              </span>
              <strong className="font-mono text-2xl font-bold text-white tabular-nums">
                {detectedNum ?? '—'}
              </strong>
            </div>

            {canLock && (
              <div className="absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-slate-950/85 px-3 py-2 backdrop-blur-sm">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>
                    {stabilityProgress > 0.06 ? 'Hold steady to lock' : 'Show gesture 1–9'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {Math.round(stabilityProgress * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-emerald-400 transition-[width] duration-75"
                    style={{ width: `${Math.round(stabilityProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span>{hint}</span>
        {fingerState && (
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {(
              [
                ['T', fingerState.thumb === 'raised'],
                ['I', fingerState.index === 'extended'],
                ['M', fingerState.middle === 'extended'],
                ['R', fingerState.ring === 'extended'],
                ['P', fingerState.pinky === 'extended'],
              ] as Array<[string, boolean]>
            ).map(([label, up]) => (
              <span
                key={label}
                className={`inline-flex h-5 w-5 items-center justify-center rounded font-bold ${
                  up ? 'bg-emerald-500/25 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
