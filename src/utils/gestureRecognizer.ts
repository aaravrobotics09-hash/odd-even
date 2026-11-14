export type FingerExtensionState = 'extended' | 'folded' | 'ambiguous';
export type ThumbState = 'raised' | 'folded' | 'ambiguous';
export type ThumbDirection = 'up' | 'down' | 'side';

export interface FingerTelemetry {
  thumb: ThumbState;
  thumbDir: ThumbDirection;
  index: FingerExtensionState;
  middle: FingerExtensionState;
  ring: FingerExtensionState;
  pinky: FingerExtensionState;
}

export interface GestureRecognitionResult {
  number: number | null;
  hint: string;
  fingers: FingerTelemetry | null;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

// Exact custom hand cricket mapping (1–9):
// 1: Any 1 of the 4 fingers raised, thumb folded
// 2: Any 2 of the 4 fingers raised, thumb folded
// 3: Any 3 of the 4 fingers raised, thumb folded
// 4: All 4 fingers raised, thumb folded
// 5: All 5 fingers raised, including thumb
// 6: Only thumb raised and pointing upward
// 7: Only thumb raised and pointing downward
// 8: Thumb and index finger raised
// 9: Thumb, index and middle fingers raised, with index and middle fingers touching
export const GESTURE_DESCRIPTIONS: Record<number, string> = {
  1: 'Any 1 of 4 fingers raised, thumb folded',
  2: 'Any 2 of 4 fingers raised, thumb folded',
  3: 'Any 3 of 4 fingers raised, thumb folded',
  4: 'All 4 fingers raised, thumb folded',
  5: 'All 5 fingers raised, including thumb',
  6: 'Only thumb raised, pointing upward',
  7: 'Only thumb raised, pointing downward',
  8: 'Thumb and index finger raised',
  9: 'Thumb, index & middle up (index & middle touching)',
};

interface Point2D {
  x: number;
  y: number;
}

function pt(lm: NormalizedLandmark[], idx: number, aspectRatio: number): Point2D {
  return {
    x: lm[idx].x * aspectRatio,
    y: lm[idx].y,
  };
}

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sub(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function normalize(v: Point2D): Point2D {
  const len = Math.hypot(v.x, v.y) || 1e-6;
  return { x: v.x / len, y: v.y / len };
}

function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

function classifyFinger(
  lm: NormalizedLandmark[],
  mcpIdx: number,
  pipIdx: number,
  tipIdx: number,
  palmSize: number,
  aspectRatio: number
): FingerExtensionState {
  const wrist = pt(lm, 0, aspectRatio);
  const mcp = pt(lm, mcpIdx, aspectRatio);
  const pip = pt(lm, pipIdx, aspectRatio);
  const tip = pt(lm, tipIdx, aspectRatio);

  const dWristTip = dist(wrist, tip);
  const dWristPip = dist(wrist, pip);
  const dWristMcp = dist(wrist, mcp);
  const dMcpTip = dist(mcp, tip);

  const v1 = normalize(sub(pip, mcp));
  const v2 = normalize(sub(tip, pip));
  const straightDot = dot(v1, v2);

  const isExtended =
    dWristTip > dWristPip * 1.11 &&
    dWristTip > dWristMcp * 1.24 &&
    straightDot > 0.4 &&
    dMcpTip > palmSize * 0.42;

  const isFolded =
    dWristTip < dWristPip * 1.05 ||
    straightDot < 0.16 ||
    dMcpTip < palmSize * 0.42;

  if (isExtended && !isFolded) return 'extended';
  if (isFolded && !isExtended) return 'folded';
  return 'ambiguous';
}

function classifyThumb(
  lm: NormalizedLandmark[],
  palmSize: number,
  aspectRatio: number
): { state: ThumbState; direction: ThumbDirection } {
  const mcp = pt(lm, 2, aspectRatio);
  const ip = pt(lm, 3, aspectRatio);
  const tip = pt(lm, 4, aspectRatio);
  const indexMcp = pt(lm, 5, aspectRatio);
  const middleMcp = pt(lm, 9, aspectRatio);
  const pinkyMcp = pt(lm, 17, aspectRatio);

  const v1 = normalize(sub(ip, mcp));
  const v2 = normalize(sub(tip, ip));
  const straightDot = dot(v1, v2);

  const dTipMiddle = dist(tip, middleMcp);
  const dMcpMiddle = dist(mcp, middleMcp);
  const dTipPinky = dist(tip, pinkyMcp);
  const dMcpPinky = dist(mcp, pinkyMcp);
  const dTipIndex = dist(tip, indexMcp);
  const dMcpTip = dist(mcp, tip);

  const isRaised =
    dTipMiddle > dMcpMiddle * 1.05 &&
    dTipPinky > dMcpPinky * 1.03 &&
    dTipIndex > palmSize * 0.48 &&
    dMcpTip > palmSize * 0.45 &&
    straightDot > 0.42;

  const isFolded =
    dTipMiddle < dMcpMiddle * 1.01 ||
    dTipPinky < dMcpPinky * 0.99 ||
    dTipIndex < palmSize * 0.44 ||
    straightDot < 0.2;

  // Vertical direction in normalized image space (y increases downward)
  const dx = tip.x - mcp.x;
  const dy = tip.y - mcp.y;
  let direction: ThumbDirection = 'side';
  if (dy < 0 && Math.abs(dy) > Math.abs(dx) * 0.85 && tip.y < ip.y) {
    direction = 'up';
  } else if (dy > 0 && dy > Math.abs(dx) * 0.85 && tip.y > ip.y) {
    direction = 'down';
  }

  let state: ThumbState = 'ambiguous';
  if (isRaised && !isFolded) state = 'raised';
  else if (isFolded && !isRaised) state = 'folded';

  return { state, direction };
}

/**
 * Analyzes 21 MediaPipe hand landmarks (left or right hand, mirrored or normal).
 * Strictly applies the custom 1–9 gesture mapping and rejects ambiguous/invalid poses.
 */
export function recognizeCustomHandGesture(
  landmarks: NormalizedLandmark[] | null | undefined,
  aspectRatio = 4 / 3
): GestureRecognitionResult {
  if (!landmarks || landmarks.length < 21) {
    return { number: null, hint: 'Show your hand clearly inside the frame', fingers: null };
  }

  const wrist = pt(landmarks, 0, aspectRatio);
  const middleMcp = pt(landmarks, 9, aspectRatio);
  const palmSize = dist(wrist, middleMcp);

  if (palmSize < 0.04) {
    return { number: null, hint: 'Move your hand closer to the camera', fingers: null };
  }

  const thumb = classifyThumb(landmarks, palmSize, aspectRatio);
  const index = classifyFinger(landmarks, 5, 6, 8, palmSize, aspectRatio);
  const middle = classifyFinger(landmarks, 9, 10, 12, palmSize, aspectRatio);
  const ring = classifyFinger(landmarks, 13, 14, 16, palmSize, aspectRatio);
  const pinky = classifyFinger(landmarks, 17, 18, 20, palmSize, aspectRatio);

  const fingers: FingerTelemetry = {
    thumb: thumb.state,
    thumbDir: thumb.direction,
    index,
    middle,
    ring,
    pinky,
  };

  if (
    thumb.state === 'ambiguous' ||
    index === 'ambiguous' ||
    middle === 'ambiguous' ||
    ring === 'ambiguous' ||
    pinky === 'ambiguous'
  ) {
    return { number: null, hint: 'Hold fingers clearly open or folded', fingers };
  }

  const fourFingers = [index, middle, ring, pinky];
  const raisedCount = fourFingers.filter((s) => s === 'extended').length;

  // Case A: Thumb FOLDED -> Numbers 1, 2, 3, or 4 (any N of the 4 fingers raised)
  if (thumb.state === 'folded') {
    if (raisedCount >= 1 && raisedCount <= 4) {
      return {
        number: raisedCount,
        hint: `Detected gesture ${raisedCount}`,
        fingers,
      };
    }
    return { number: null, hint: 'Closed fist ignored — show 1 to 9', fingers };
  }

  // Case B: Thumb RAISED -> Numbers 5, 6, 7, 8, or 9
  if (thumb.state === 'raised') {
    // 5: All 5 fingers raised
    if (raisedCount === 4) {
      return { number: 5, hint: 'Detected gesture 5 (all 5 fingers)', fingers };
    }

    // 6 or 7: Only thumb raised (pointing upward or downward)
    if (raisedCount === 0) {
      if (thumb.direction === 'up') {
        return { number: 6, hint: 'Detected gesture 6 (thumb up)', fingers };
      }
      if (thumb.direction === 'down') {
        return { number: 7, hint: 'Detected gesture 7 (thumb down)', fingers };
      }
      return {
        number: null,
        hint: 'Point thumb clearly UP (6) or DOWN (7)',
        fingers,
      };
    }

    // 8: Thumb and index finger raised
    if (raisedCount === 1 && index === 'extended') {
      return { number: 8, hint: 'Detected gesture 8 (thumb + index)', fingers };
    }

    // 9: Thumb, index and middle raised WITH index & middle fingers touching
    if (raisedCount === 2 && index === 'extended' && middle === 'extended') {
      const idxTip = pt(landmarks, 8, aspectRatio);
      const midTip = pt(landmarks, 12, aspectRatio);
      const idxDip = pt(landmarks, 7, aspectRatio);
      const midDip = pt(landmarks, 11, aspectRatio);
      const idxMcp = pt(landmarks, 5, aspectRatio);
      const midMcp = pt(landmarks, 9, aspectRatio);

      const knuckleSpan = Math.max(dist(idxMcp, midMcp), palmSize * 0.18);
      const tipGapRatio = dist(idxTip, midTip) / knuckleSpan;
      const dipGapRatio = dist(idxDip, midDip) / knuckleSpan;

      const areTouching =
        tipGapRatio < 1.38 &&
        dipGapRatio < 1.38 &&
        dist(idxTip, midTip) < palmSize * 0.4;

      if (areTouching) {
        return { number: 9, hint: 'Detected gesture 9 (index & middle touching)', fingers };
      }
      return {
        number: null,
        hint: 'Touch index and middle fingers together for 9',
        fingers,
      };
    }

    return {
      number: null,
      hint: 'Unrecognized finger combo — check gesture guide',
      fingers,
    };
  }

  return { number: null, hint: 'Adjust hand pose', fingers };
}

/**
 * Requires a gesture to remain stable for `requiredMs` before confirming,
 * tolerating brief 1-2 frame jitter without losing progress.
 */
export class GestureStabilityTracker {
  private requiredMs: number;
  private candidate: number | null = null;
  private startTime = 0;
  private missCount = 0;

  constructor(requiredMs = 750) {
    this.requiredMs = requiredMs;
  }

  reset(): void {
    this.candidate = null;
    this.startTime = 0;
    this.missCount = 0;
  }

  update(
    detectedNumber: number | null,
    now: number = performance.now()
  ): { stableNumber: number | null; candidate: number | null; progress: number } {
    if (detectedNumber === null) {
      this.missCount += 1;
      if (this.missCount > 4) {
        this.reset();
      }
      return {
        stableNumber: null,
        candidate: this.candidate,
        progress: this.candidate
          ? Math.min(0.95, (now - this.startTime) / this.requiredMs)
          : 0,
      };
    }

    this.missCount = 0;

    if (detectedNumber !== this.candidate) {
      this.candidate = detectedNumber;
      this.startTime = now;
      return { stableNumber: null, candidate: this.candidate, progress: 0.06 };
    }

    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.requiredMs);

    if (elapsed >= this.requiredMs) {
      return { stableNumber: this.candidate, candidate: this.candidate, progress: 1 };
    }

    return { stableNumber: null, candidate: this.candidate, progress };
  }
}
