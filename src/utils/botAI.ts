import { DifficultyLevel, TossParity } from '../types/game';

export type BotRole = 'TOSS' | 'BATTING' | 'BOWLING';

export function pickBotTossCall(): TossParity {
  return Math.random() < 0.5 ? 'ODD' : 'EVEN';
}

export function pickBotBatOrBowl(difficulty: DifficultyLevel = 'medium'): 'BAT' | 'BOWL' {
  const bowlFirstProb = difficulty === 'hard' ? 0.6 : difficulty === 'medium' ? 0.52 : 0.45;
  return Math.random() < bowlFirstProb ? 'BOWL' : 'BAT';
}

/**
 * Selects a random number 1..9 independently BEFORE the player's gesture is known.
 * Difficulty only uses past completed balls and target context — never current player input.
 */
export function selectBotNumber({
  difficulty = 'medium',
  role = 'TOSS',
  playerPastNumbers = [],
  runsNeeded = null,
}: {
  difficulty?: DifficultyLevel;
  role?: BotRole;
  playerPastNumbers?: number[];
  runsNeeded?: number | null;
}): number {
  if (role === 'TOSS') {
    return Math.floor(Math.random() * 9) + 1;
  }

  const weights = Array<number>(9).fill(1);

  if (difficulty === 'easy') {
    // Slightly leans toward traditional 1-6 numbers while remaining varied
    for (let i = 0; i < 6; i++) {
      weights[i] = 1.15;
    }
  } else if (difficulty === 'medium' || difficulty === 'hard') {
    if (role === 'BATTING') {
      if (runsNeeded !== null && runsNeeded > 0) {
        if (runsNeeded <= 4) {
          for (let n = 1; n <= Math.min(6, runsNeeded + 1); n++) {
            weights[n - 1] += difficulty === 'hard' ? 1.35 : 0.65;
          }
        } else if (runsNeeded >= 12) {
          for (let n = 6; n <= 9; n++) {
            weights[n - 1] += difficulty === 'hard' ? 1.1 : 0.55;
          }
        }
      }

      if (difficulty === 'hard' && playerPastNumbers.length >= 2) {
        const recent = playerPastNumbers.slice(-4);
        for (const n of recent) {
          if (n >= 1 && n <= 9) {
            weights[n - 1] = Math.max(0.45, weights[n - 1] - 0.25);
          }
        }
      }
    } else if (role === 'BOWLING') {
      const lookback = difficulty === 'hard' ? 6 : 3;
      const boost = difficulty === 'hard' ? 0.5 : 0.22;
      const recent = playerPastNumbers.slice(-lookback);
      for (const n of recent) {
        if (n >= 1 && n <= 9) {
          weights[n - 1] += boost;
        }
      }
    }
  }

  const total = weights.reduce((acc, w) => acc + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < 9; i++) {
    r -= weights[i];
    if (r <= 0) return i + 1;
  }
  return Math.floor(Math.random() * 9) + 1;
}

export type BotReactionType =
  | 'botScoredBig'
  | 'botScoredSmall'
  | 'botOut'
  | 'botTookWicket'
  | 'botMissedWicket'
  | 'botWonToss'
  | 'botLostToss';

const QUIPS: Record<BotReactionType, string[]> = {
  botScoredBig: [
    'Cleared the floodlights! Try stopping that one.',
    'Pure timing straight over long-on!',
    'Maximum power off the middle of the bat!',
  ],
  botScoredSmall: [
    'Rotating the strike cleanly.',
    'Keeping the scoreboard ticking!',
    'Smart nudges add up fast.',
  ],
  botOut: [
    'What?! How did you read that delivery?!',
    'Right into the stumps — well bowled!',
    'Glitch in my timing! Good wicket.',
  ],
  botTookWicket: [
    'Clean bowled! Back to the pavilion!',
    'Read that shot a mile away! OUT!',
    'Timber! Stumps flying everywhere!',
  ],
  botMissedWicket: [
    'Missed the outside edge by a whisker!',
    'Nice shot. Wait for my next delivery.',
    'Close! Next ball has your name on it.',
  ],
  botWonToss: [
    'Toss champion! Probability is on my side.',
    'My call paid off! Ready to dominate.',
  ],
  botLostToss: [
    'Enjoy the toss — the match starts now!',
    'Fair toss win. Let us see your batting!',
  ],
};

export function getBotReaction(eventType: BotReactionType): string {
  const list = QUIPS[eventType];
  return list[Math.floor(Math.random() * list.length)];
}
