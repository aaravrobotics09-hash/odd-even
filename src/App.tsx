import React, { useEffect, useRef, useState } from 'react';
import {
  BotExpression,
  GameScreen,
  GameSettings,
  MatchState,
  MatchWinner,
  Participant,
  RevealedPair,
  TossParity,
} from './types/game';
import StadiumBackground from './components/StadiumBackground';
import HandIcon from './components/HandIcon';
import { BotAvatar, PlayerAvatar } from './components/Avatars';
import Scoreboard from './components/Scoreboard';
import WebcamPanel from './components/WebcamPanel';
import { HowToPlayModal, SettingsModal } from './components/Modals';
import { GESTURE_DESCRIPTIONS } from './utils/gestureRecognizer';
import {
  BotRole,
  getBotReaction,
  pickBotBatOrBowl,
  pickBotTossCall,
  selectBotNumber,
} from './utils/botAI';
import { soundEngine } from './utils/soundEngine';

const INITIAL_MATCH: MatchState = {
  playerTossChoice: null,
  botTossChoice: null,
  tossPlayerNum: null,
  tossBotNum: null,
  tossWinner: null,
  firstBatter: null,
  innings: 1,
  battingSide: null,
  playerScore: 0,
  playerWickets: 0,
  playerBalls: 0,
  botScore: 0,
  botWickets: 0,
  botBalls: 0,
  target: null,
  lastBall: null,
  lastResult: '',
  ballHistory: [],
  playerPastNumbers: [],
  winner: null,
  summary: '',
};

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('HOME');
  const [match, setMatch] = useState<MatchState>(INITIAL_MATCH);
  const [settings, setSettings] = useState<GameSettings>({
    sfxEnabled: true,
    voiceEnabled: true,
    webcamEnabled: true,
    difficulty: 'medium',
  });

  const [showHowTo, setShowHowTo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [turnPhase, setTurnPhase] = useState<'WAITING' | 'REVEALING'>('WAITING');
  const [turnId, setTurnId] = useState<number>(1);
  const [revealedPair, setRevealedPair] = useState<RevealedPair | null>(null);
  const [scorePulseKey, setScorePulseKey] = useState<number>(0);

  const [botExpression, setBotExpression] = useState<BotExpression>('neutral');
  const [botQuip, setBotQuip] = useState<string>('Ready when you are. Let us play!');
  const [botDecisionText, setBotDecisionText] = useState<string>('');

  // Bot picks its secret number independently BEFORE the player confirms any gesture
  const botSecretRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    soundEngine.setSettings({
      sfxEnabled: settings.sfxEnabled,
      voiceEnabled: settings.voiceEnabled,
    });
  }, [settings.sfxEnabled, settings.voiceEnabled]);

  useEffect(() => {
    return () => clearPendingTimer();
  }, []);

  const updateSettings = (patch: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const prepareNextTurn = (
    role: BotRole,
    pastNums: number[] = [],
    runsNeeded: number | null = null
  ) => {
    botSecretRef.current = selectBotNumber({
      difficulty: settings.difficulty,
      role,
      playerPastNumbers: pastNums,
      runsNeeded,
    });
    setTurnPhase('WAITING');
    setRevealedPair(null);
    setTurnId((id) => id + 1);
  };

  const startNewMatch = () => {
    clearPendingTimer();
    soundEngine.playClick();
    setMatch(INITIAL_MATCH);
    setBotExpression('neutral');
    setBotQuip('Call Odd or Even for the pre-match toss!');
    setBotDecisionText('');
    setRevealedPair(null);
    setScreen('TOSS_CHOICE');
  };

  const returnToMainMenu = () => {
    clearPendingTimer();
    soundEngine.playClick();
    setMatch(INITIAL_MATCH);
    setRevealedPair(null);
    setScreen('HOME');
  };

  const handleChooseToss = (choice: TossParity) => {
    soundEngine.playClick();
    const botCall = pickBotTossCall();
    setMatch((prev) => ({
      ...prev,
      playerTossChoice: choice,
      botTossChoice: botCall,
    }));
    setBotExpression('thinking');
    setBotQuip('I locked my hidden toss number. Show yours!');
    prepareNextTurn('TOSS');
    setScreen('TOSS_PLAY');
    soundEngine.speak(`You chose ${choice}. Show your number!`);
  };

  const handleTossGesture = (playerNum: number) => {
    if (turnPhase !== 'WAITING') return;
    const botNum = botSecretRef.current ?? selectBotNumber({ role: 'TOSS' });
    const sum = playerNum + botNum;
    const parity: TossParity = sum % 2 === 0 ? 'EVEN' : 'ODD';
    const playerWon = parity === match.playerTossChoice;
    const tossWinner: Participant = playerWon ? 'PLAYER' : 'BOT';

    setTurnPhase('REVEALING');
    soundEngine.playTossFlip();

    setRevealedPair({
      player: playerNum,
      bot: botNum,
      label: `Total: ${playerNum} + ${botNum} = ${sum} (${parity})`,
      type: playerWon ? 'win' : 'lose',
    });

    setBotExpression(playerWon ? 'surprised' : 'happy');
    setBotQuip(getBotReaction(playerWon ? 'botLostToss' : 'botWonToss'));

    setMatch((prev) => ({
      ...prev,
      tossPlayerNum: playerNum,
      tossBotNum: botNum,
      tossWinner,
    }));

    clearPendingTimer();
    timerRef.current = setTimeout(() => {
      setScreen('TOSS_RESULT');
      soundEngine.speak(
        playerWon
          ? `Total is ${sum}, ${parity}. You won the toss!`
          : `Total is ${sum}, ${parity}. Bot won the toss!`
      );
    }, 2100);
  };

  const beginInnings1 = (firstBatter: Participant) => {
    soundEngine.playClick();
    setMatch((prev) => ({
      ...prev,
      firstBatter,
      innings: 1,
      battingSide: firstBatter,
      lastBall: null,
      lastResult: '',
      ballHistory: [],
    }));
    setBotExpression('neutral');
    setBotQuip(
      firstBatter === 'PLAYER' ? 'Try hitting past my bowling!' : 'Time to put runs on the board!'
    );
    prepareNextTurn(firstBatter === 'PLAYER' ? 'BOWLING' : 'BATTING', [], null);
    setScreen('INNINGS_1');
    soundEngine.speak(
      firstBatter === 'PLAYER'
        ? 'First innings begins. You are batting!'
        : 'First innings begins. Bot is batting!'
    );
  };

  const handleProceedToDecision = () => {
    soundEngine.playClick();
    setScreen('BAT_BOWL_DECISION');

    if (match.tossWinner === 'BOT') {
      const botChoice = pickBotBatOrBowl(settings.difficulty);
      const firstBatter: Participant = botChoice === 'BAT' ? 'BOT' : 'PLAYER';
      setBotExpression('confident');
      setBotDecisionText(
        botChoice === 'BAT' ? 'BOT CHOSE TO BAT FIRST!' : 'BOT CHOSE TO BOWL FIRST!'
      );
      setBotQuip(
        botChoice === 'BAT'
          ? 'I am going to set a strong target!'
          : 'Pad up — I am bowling first!'
      );
      soundEngine.speak(
        botChoice === 'BAT' ? 'Bot chose to bat first!' : 'Bot chose to bowl first!'
      );

      clearPendingTimer();
      timerRef.current = setTimeout(() => {
        beginInnings1(firstBatter);
      }, 2100);
    }
  };

  const beginInnings2 = () => {
    soundEngine.playClick();
    const secondBatter: Participant = match.firstBatter === 'PLAYER' ? 'BOT' : 'PLAYER';
    const firstScore = match.firstBatter === 'PLAYER' ? match.playerScore : match.botScore;
    const target = firstScore + 1;

    setMatch((prev) => ({
      ...prev,
      innings: 2,
      battingSide: secondBatter,
      target,
      lastBall: null,
      lastResult: '',
      ballHistory: [],
    }));

    setBotExpression('confident');
    setBotQuip(
      secondBatter === 'BOT'
        ? `Target is ${target}. Let the chase begin!`
        : `Defending ${firstScore}! Good luck chasing ${target}!`
    );

    prepareNextTurn(
      secondBatter === 'PLAYER' ? 'BOWLING' : 'BATTING',
      match.playerPastNumbers,
      secondBatter === 'BOT' ? target : null
    );
    setScreen('INNINGS_2');
    soundEngine.speak(`Second innings! Target is ${target} runs.`);
  };

  const finishMatch = (
    winner: MatchWinner,
    pScore: number,
    bScore: number,
    chasingSide: Participant
  ) => {
    let summary = '';
    if (winner === 'TIE') {
      summary = `An unforgettable deadlock! Both sides finished tied on ${pScore} runs.`;
      soundEngine.playTossFlip();
      soundEngine.speak('Incredible! The match is tied!');
    } else if (winner === 'PLAYER') {
      const margin = pScore - bScore;
      summary =
        chasingSide === 'PLAYER'
          ? `You chased down the target cleanly, finishing on ${pScore} runs!`
          : `You defended your total and defeated Cricko-Bot by ${margin} run${
              margin === 1 ? '' : 's'
            }!`;
      soundEngine.playVictory();
      soundEngine.speak('Congratulations! You won the match!');
    } else {
      const margin = bScore - pScore;
      summary =
        chasingSide === 'BOT'
          ? `Cricko-Bot successfully chased the target, finishing on ${bScore} runs.`
          : `Cricko-Bot defended its total and won by ${margin} run${
              margin === 1 ? '' : 's'
            }.`;
      soundEngine.playDefeat();
      soundEngine.speak('Cricko-Bot wins the match!');
    }

    setBotExpression(
      winner === 'BOT' ? 'happy' : winner === 'PLAYER' ? 'disappointed' : 'surprised'
    );
    setMatch((prev) => ({
      ...prev,
      winner,
      summary,
    }));
    setScreen('MATCH_RESULT');
  };

  const handleCricketBall = (playerNum: number) => {
    if (turnPhase !== 'WAITING' || !match.battingSide) return;

    const currentBattingSide = match.battingSide;
    const isPlayerBatting = currentBattingSide === 'PLAYER';
    const botRole: BotRole = isPlayerBatting ? 'BOWLING' : 'BATTING';
    const runsNeeded =
      match.innings === 2 && !isPlayerBatting && match.target !== null
        ? match.target - match.botScore
        : null;

    const botNum =
      botSecretRef.current ??
      selectBotNumber({
        difficulty: settings.difficulty,
        role: botRole,
        playerPastNumbers: match.playerPastNumbers,
        runsNeeded,
      });

    setTurnPhase('REVEALING');
    const isOut = playerNum === botNum;
    const runs = isOut ? 0 : isPlayerBatting ? playerNum : botNum;
    const resultText = isOut ? 'OUT!' : `+${runs} RUN${runs === 1 ? '' : 'S'}`;

    if (isOut) {
      soundEngine.playWicket();
    } else {
      soundEngine.playBatHit(runs);
    }

    setScorePulseKey((k) => k + 1);
    setRevealedPair({
      player: playerNum,
      bot: botNum,
      label: resultText,
      type: isOut ? 'out' : runs >= 6 ? 'big' : 'runs',
    });

    if (isOut) {
      if (isPlayerBatting) {
        setBotExpression('happy');
        setBotQuip(getBotReaction('botTookWicket'));
        soundEngine.speak(`Out! Both showed ${playerNum}!`);
      } else {
        setBotExpression('disappointed');
        setBotQuip(getBotReaction('botOut'));
        soundEngine.speak(`Bot is out on ${botNum}!`);
      }
    } else if (!isPlayerBatting) {
      if (runs >= 6) {
        setBotExpression('confident');
        setBotQuip(getBotReaction('botScoredBig'));
      } else {
        setBotExpression('happy');
        setBotQuip(getBotReaction('botScoredSmall'));
      }
      if (runs >= 7) soundEngine.speak(`Huge ${runs} runs by the Bot!`);
    } else {
      setBotExpression(runs >= 7 ? 'surprised' : 'neutral');
      setBotQuip(getBotReaction('botMissedWicket'));
      if (runs >= 7) soundEngine.speak(`Massive ${runs} runs!`);
    }

    const updatedPastNums = [...match.playerPastNumbers, playerNum];
    const newPlayerScore = isPlayerBatting ? match.playerScore + runs : match.playerScore;
    const newPlayerWickets = isPlayerBatting && isOut ? 1 : match.playerWickets;
    const newPlayerBalls = isPlayerBatting ? match.playerBalls + 1 : match.playerBalls;

    const newBotScore = !isPlayerBatting ? match.botScore + runs : match.botScore;
    const newBotWickets = !isPlayerBatting && isOut ? 1 : match.botWickets;
    const newBotBalls = !isPlayerBatting ? match.botBalls + 1 : match.botBalls;

    const updatedHistory = [
      ...match.ballHistory,
      {
        player: playerNum,
        bot: botNum,
        runs,
        isOut,
        battingSide: currentBattingSide,
      },
    ];

    setMatch((prev) => ({
      ...prev,
      playerScore: newPlayerScore,
      playerWickets: newPlayerWickets,
      playerBalls: newPlayerBalls,
      botScore: newBotScore,
      botWickets: newBotWickets,
      botBalls: newBotBalls,
      lastBall: { player: playerNum, bot: botNum },
      lastResult: resultText,
      ballHistory: updatedHistory,
      playerPastNumbers: updatedPastNums,
    }));

    clearPendingTimer();
    timerRef.current = setTimeout(() => {
      if (match.innings === 1) {
        if (isOut) {
          setScreen('INNINGS_BREAK');
          const firstScore = isPlayerBatting ? newPlayerScore : newBotScore;
          soundEngine.speak(`Innings break! Target is ${firstScore + 1} runs.`);
        } else {
          prepareNextTurn(botRole, updatedPastNums, null);
        }
      } else if (match.target !== null) {
        const chasingScore = isPlayerBatting ? newPlayerScore : newBotScore;
        const target = match.target;
        const firstScore = target - 1;

        if (chasingScore >= target) {
          const winner: MatchWinner = isPlayerBatting ? 'PLAYER' : 'BOT';
          finishMatch(winner, newPlayerScore, newBotScore, currentBattingSide);
        } else if (isOut) {
          if (chasingScore === firstScore) {
            finishMatch('TIE', newPlayerScore, newBotScore, currentBattingSide);
          } else {
            const winner: MatchWinner = isPlayerBatting ? 'BOT' : 'PLAYER';
            finishMatch(winner, newPlayerScore, newBotScore, currentBattingSide);
          }
        } else {
          const nextNeeded = target - chasingScore;
          prepareNextTurn(botRole, updatedPastNums, !isPlayerBatting ? nextNeeded : null);
        }
      }
    }, 2000);
  };

  const handleTurnGesture = (num: number) => {
    soundEngine.playLock();
    if (screen === 'TOSS_PLAY') {
      handleTossGesture(num);
    } else if (screen === 'INNINGS_1' || screen === 'INNINGS_2') {
      handleCricketBall(num);
    }
  };

  const isInMatch = screen !== 'HOME' && screen !== 'MATCH_RESULT';
  const currentInningsBalls =
    match.battingSide === 'PLAYER' ? match.playerBalls : match.botBalls;

  const stadiumHighlight: 'neutral' | 'wicket' | 'gold' =
    revealedPair?.type === 'out'
      ? 'wicket'
      : revealedPair?.type === 'big' || screen === 'MATCH_RESULT'
      ? 'gold'
      : 'neutral';

  return (
    <div className="relative flex min-h-screen flex-col font-sans text-slate-50">
      <StadiumBackground highlight={stadiumHighlight} />

      {/* Top Navigation Bar (3-Zone Contract) */}
      <header className="relative z-20 flex items-center justify-between gap-8 border-b border-slate-800/80 bg-[#060d1f]/85 px-6 py-3.5 backdrop-blur-md">
        <button
          type="button"
          onClick={returnToMainMenu}
          className="shrink-0 whitespace-nowrap font-display text-2xl font-bold tracking-wider text-white transition hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          ODD EVEN HAND CRICKET
        </button>

        <nav className="flex items-center gap-6 text-sm font-semibold text-slate-300">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowHowTo(true);
            }}
            className="shrink-0 whitespace-nowrap transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            How to Play
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowSettings(true);
            }}
            className="shrink-0 whitespace-nowrap transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Settings
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={startNewMatch}
            className="min-h-[40px] shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            {isInMatch ? 'Restart Match' : 'Start Game'}
          </button>
        </div>
      </header>

      {/* Live Cricket Broadcast Scoreboard */}
      {(screen === 'INNINGS_1' || screen === 'INNINGS_2') && (
        <Scoreboard
          playerScore={match.playerScore}
          playerWickets={match.playerWickets}
          botScore={match.botScore}
          botWickets={match.botWickets}
          innings={match.innings}
          target={match.target}
          ballsPlayed={currentInningsBalls}
          lastBall={match.lastBall}
          lastResult={match.lastResult}
          battingSide={match.battingSide}
          ballHistory={match.ballHistory}
          scorePulseKey={scorePulseKey}
        />
      )}

      {/* Main Arena Stage */}
      <main className="relative z-10 mx-auto flex w-[min(1200px,95vw)] flex-1 flex-col justify-center py-6">
        {/* SCREEN 1: HOME SCREEN */}
        {screen === 'HOME' && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-700/80 bg-[#0b172e]/90 px-6 py-9 text-center shadow-2xl backdrop-blur-md sm:px-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Webcam Hand-Gesture Cricket
              </p>
              <h1 className="mx-auto mt-2 max-w-3xl text-balance font-display text-5xl font-extrabold tracking-wide text-white sm:text-6xl">
                ODD EVEN HAND CRICKET
              </h1>
              <p className="mt-2 font-display text-2xl font-bold tracking-wide text-emerald-400">
                Challenge the Bot!
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Play classic Odd-Even Hand Cricket live with your webcam. Win the toss, call Bat
                or Bowl, outsmart Cricko-Bot using custom hand gestures 1–9, and chase down the
                winning target.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={startNewMatch}
                  className="min-h-[48px] whitespace-nowrap rounded-xl bg-emerald-600 px-8 py-3 text-base font-bold tracking-wide text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  START GAME
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowHowTo(true);
                  }}
                  className="min-h-[48px] whitespace-nowrap rounded-xl border border-slate-600 bg-slate-800/90 px-8 py-3 text-base font-bold tracking-wide text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  HOW TO PLAY
                </button>
              </div>
            </section>

            {/* Gesture Reference Guide 1–9 */}
            <section className="rounded-2xl border border-slate-700/80 bg-[#0b172e]/90 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                  Gesture Reference Guide (Numbers 1–9)
                </h2>
                <span className="text-xs font-medium text-slate-400">
                  Left or right hand · Hold steady to lock
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div
                    key={num}
                    className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center"
                  >
                    <span className="font-mono text-lg font-bold text-amber-400 tabular-nums">
                      {num}
                    </span>
                    <HandIcon number={num} size={52} className="my-1.5" />
                    <p className="text-[11px] leading-snug text-slate-300">
                      {GESTURE_DESCRIPTIONS[num]}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* SCREEN 2: ODD-EVEN SELECTION */}
        {screen === 'TOSS_CHOICE' && (
          <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-8 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Pre-Match Toss
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
              CHOOSE YOUR TOSS
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Pick <strong>ODD</strong> or <strong>EVEN</strong>. You and Cricko-Bot will show a
              number from 1 to 9 simultaneously—the parity of the combined sum decides who wins
              the toss.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleChooseToss('ODD')}
                className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-amber-500/40 bg-slate-900/90 p-6 transition hover:border-amber-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <span className="font-display text-4xl font-extrabold text-amber-400">ODD</span>
                <span className="text-xs text-slate-400">Sum = 3, 5, 7, 9, 11, 13, 15, 17</span>
              </button>
              <button
                type="button"
                onClick={() => handleChooseToss('EVEN')}
                className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-emerald-500/40 bg-slate-900/90 p-6 transition hover:border-emerald-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <span className="font-display text-4xl font-extrabold text-emerald-400">EVEN</span>
                <span className="text-xs text-slate-400">Sum = 2, 4, 6, 8, 10, 12, 14, 16, 18</span>
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 3: PLAY THE TOSS */}
        {screen === 'TOSS_PLAY' && (
          <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <PlayerAvatar statusText={`Toss Call: ${match.playerTossChoice}`} />
              <WebcamPanel
                webcamEnabled={settings.webcamEnabled}
                canLock={turnPhase === 'WAITING'}
                turnId={turnId}
                onConfirmNumber={handleTurnGesture}
                onEnableFallback={() => updateSettings({ webcamEnabled: false })}
              />
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-6 text-center shadow-2xl backdrop-blur-md lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                Coinless Toss
              </p>
              <h2 className="mt-1 font-display text-4xl font-bold tracking-wide text-white">
                SHOW YOUR NUMBER!
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                You called <strong className="text-white">{match.playerTossChoice}</strong> · Bot
                call:{' '}
                <strong className="text-amber-400">
                  {revealedPair ? match.botTossChoice : 'Hidden'}
                </strong>
              </p>

              <div className="my-6 flex items-center justify-center gap-4">
                <div
                  className={`flex h-28 w-24 flex-col items-center justify-center rounded-xl border-2 bg-slate-950 ${
                    revealedPair ? 'animate-card-reveal border-emerald-400' : 'border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wider text-slate-400">YOU</span>
                  <strong className="mt-1 font-mono text-4xl font-bold text-white tabular-nums">
                    {revealedPair ? revealedPair.player : '?'}
                  </strong>
                </div>

                <span className="font-display text-3xl font-bold text-amber-400">+</span>

                <div
                  className={`flex h-28 w-24 flex-col items-center justify-center rounded-xl border-2 bg-slate-950 ${
                    revealedPair ? 'animate-card-reveal border-amber-400' : 'border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wider text-slate-400">BOT</span>
                  <strong className="mt-1 font-mono text-4xl font-bold text-white tabular-nums">
                    {revealedPair ? revealedPair.bot : '?'}
                  </strong>
                </div>
              </div>

              {revealedPair ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-base font-bold ${
                    revealedPair.type === 'win'
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                      : 'border-red-500/60 bg-red-500/15 text-red-300'
                  }`}
                >
                  {revealedPair.label}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-amber-500/40 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-amber-300">
                  Bot has locked its hidden number — show 1–9 to reveal together!
                </p>
              )}
            </div>

            <div className="lg:col-span-3">
              <BotAvatar
                expression={botExpression}
                quip={botQuip}
                difficulty={settings.difficulty}
              />
            </div>
          </section>
        )}

        {/* SCREEN 4: TOSS RESULT */}
        {screen === 'TOSS_RESULT' && (
          <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-8 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Toss Outcome
            </p>
            <h2
              className={`mt-2 font-display text-5xl font-extrabold tracking-wide ${
                match.tossWinner === 'PLAYER' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {match.tossWinner === 'PLAYER' ? 'YOU WON THE TOSS!' : 'BOT WON THE TOSS!'}
            </h2>

            <div className="mt-6 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/80 px-5 text-sm">
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Your Toss Call</span>
                <strong className="font-mono text-white">{match.playerTossChoice}</strong>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Bot&apos;s Hidden Call</span>
                <strong className="font-mono text-white">{match.botTossChoice}</strong>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Revealed Sum</span>
                <strong className="font-mono text-amber-300 tabular-nums">
                  {match.tossPlayerNum} + {match.tossBotNum} ={' '}
                  {(match.tossPlayerNum ?? 0) + (match.tossBotNum ?? 0)} (
                  {((match.tossPlayerNum ?? 0) + (match.tossBotNum ?? 0)) % 2 === 0
                    ? 'EVEN'
                    : 'ODD'}
                  )
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToDecision}
              className="mt-7 min-h-[48px] whitespace-nowrap rounded-xl bg-emerald-600 px-8 py-3 text-base font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              {match.tossWinner === 'PLAYER' ? 'Choose Bat or Bowl' : 'See Bot Decision'}
            </button>
          </section>
        )}

        {/* SCREEN 5: BAT OR BOWL DECISION */}
        {screen === 'BAT_BOWL_DECISION' && (
          <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-8 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Batting Order
            </p>
            {match.tossWinner === 'PLAYER' ? (
              <>
                <h2 className="mt-2 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
                  BAT OR BOWL FIRST?
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  You won the toss. Decide whether to set the target or chase!
                </p>
                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => beginInnings1('PLAYER')}
                    className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-emerald-500/40 bg-slate-900/90 p-6 transition hover:border-emerald-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-400"
                  >
                    <strong className="font-display text-3xl font-bold text-emerald-400">
                      BAT FIRST
                    </strong>
                    <span className="text-xs text-slate-400">Post a big 1st-innings score</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => beginInnings1('BOT')}
                    className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-amber-500/40 bg-slate-900/90 p-6 transition hover:border-amber-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-amber-400"
                  >
                    <strong className="font-display text-3xl font-bold text-amber-400">
                      BOWL FIRST
                    </strong>
                    <span className="text-xs text-slate-400">Dismiss the Bot &amp; chase</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-md space-y-5 pt-2">
                <BotAvatar
                  expression="confident"
                  quip={botQuip}
                  difficulty={settings.difficulty}
                />
                <h2 className="animate-score-pop font-display text-4xl font-bold text-amber-400">
                  {botDecisionText}
                </h2>
                <p className="text-sm text-slate-300">Starting First Innings...</p>
              </div>
            )}
          </section>
        )}

        {/* SCREEN 6 & 8: INNINGS 1 & INNINGS 2 */}
        {(screen === 'INNINGS_1' || screen === 'INNINGS_2') && (
          <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <PlayerAvatar
                isBatting={match.battingSide === 'PLAYER'}
                statusText={
                  match.battingSide === 'PLAYER'
                    ? `Score: ${match.playerScore} (${match.playerBalls} balls)`
                    : `Bowling · Bot Score: ${match.botScore}`
                }
              />
              <WebcamPanel
                webcamEnabled={settings.webcamEnabled}
                canLock={turnPhase === 'WAITING'}
                turnId={turnId}
                onConfirmNumber={handleTurnGesture}
                onEnableFallback={() => updateSettings({ webcamEnabled: false })}
              />
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-6 text-center shadow-2xl backdrop-blur-md lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Innings {match.innings}
              </p>
              <h2
                className={`mt-1 font-display text-4xl font-extrabold tracking-wide ${
                  match.battingSide === 'PLAYER' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {match.battingSide === 'PLAYER' ? 'YOU ARE BATTING' : 'BOT IS BATTING'}
              </h2>

              {match.innings === 2 && match.target !== null && (
                <p className="mt-1 text-sm font-semibold text-amber-300 tabular-nums">
                  Need{' '}
                  {Math.max(
                    0,
                    match.target -
                      (match.battingSide === 'PLAYER' ? match.playerScore : match.botScore)
                  )}{' '}
                  more run(s) to win
                </p>
              )}

              <div className="my-6 flex items-center justify-center gap-4">
                <div
                  className={`flex h-28 w-24 flex-col items-center justify-center rounded-xl border-2 bg-slate-950 ${
                    revealedPair ? 'animate-card-reveal border-emerald-400' : 'border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wider text-slate-400">
                    YOUR HAND
                  </span>
                  <strong className="mt-1 font-mono text-4xl font-bold text-white tabular-nums">
                    {revealedPair ? revealedPair.player : '?'}
                  </strong>
                </div>

                <span className="font-display text-2xl font-bold text-slate-400">VS</span>

                <div
                  className={`flex h-28 w-24 flex-col items-center justify-center rounded-xl border-2 bg-slate-950 ${
                    revealedPair ? 'animate-card-reveal border-amber-400' : 'border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wider text-slate-400">
                    BOT HAND
                  </span>
                  <strong className="mt-1 font-mono text-4xl font-bold text-white tabular-nums">
                    {revealedPair ? revealedPair.bot : '?'}
                  </strong>
                </div>
              </div>

              {revealedPair ? (
                <div
                  className={`animate-score-pop rounded-xl border px-4 py-3 text-lg font-extrabold ${
                    revealedPair.type === 'out'
                      ? 'border-red-500/60 bg-red-500/20 text-red-300'
                      : revealedPair.type === 'big'
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                      : 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {revealedPair.label}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-amber-500/40 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-amber-300">
                  Bot delivery locked — show your gesture (1–9)
                </p>
              )}

              <p className="mt-4 text-xs text-slate-400">
                Same number = <strong className="text-red-300">OUT!</strong> · Different numbers ={' '}
                <strong className="text-slate-200">
                  {match.battingSide === 'PLAYER' ? 'Your' : "Bot's"} runs added
                </strong>
              </p>
            </div>

            <div className="lg:col-span-3">
              <BotAvatar
                expression={botExpression}
                isBatting={match.battingSide === 'BOT'}
                quip={botQuip}
                difficulty={settings.difficulty}
              />
            </div>
          </section>
        )}

        {/* SCREEN 7: INNINGS BREAK */}
        {screen === 'INNINGS_BREAK' && (
          <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-8 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Innings Break
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
              END OF 1ST INNINGS!
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900/85 p-5">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {match.firstBatter === 'PLAYER' ? 'Your Score' : "Bot's Score"}
                </span>
                <strong className="mt-1 block font-mono text-4xl font-bold text-white tabular-nums">
                  {match.firstBatter === 'PLAYER' ? match.playerScore : match.botScore}/1
                </strong>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {match.firstBatter === 'PLAYER' ? "Bot's Target" : 'Your Target'}
                </span>
                <strong className="mt-1 block font-mono text-4xl font-bold text-amber-400 tabular-nums">
                  {(match.firstBatter === 'PLAYER' ? match.playerScore : match.botScore) + 1}
                </strong>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-300">
              Batting and bowling roles are switching.{' '}
              {match.firstBatter === 'PLAYER'
                ? 'Bowl Cricko-Bot out before it reaches your target!'
                : 'Step up to the crease and chase down the target!'}
            </p>

            <button
              type="button"
              onClick={beginInnings2}
              className="mt-7 min-h-[48px] whitespace-nowrap rounded-xl bg-emerald-600 px-8 py-3 text-base font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Start 2nd Innings
            </button>
          </section>
        )}

        {/* SCREEN 9: MATCH RESULT */}
        {screen === 'MATCH_RESULT' && (
          <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0b172e]/95 p-8 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Full Time Summary
            </p>
            <h2
              className={`animate-score-pop mt-2 font-display text-5xl font-extrabold tracking-wide sm:text-6xl ${
                match.winner === 'PLAYER'
                  ? 'text-emerald-400'
                  : match.winner === 'BOT'
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            >
              {match.winner === 'PLAYER'
                ? 'YOU WON!'
                : match.winner === 'BOT'
                ? 'BOT WON!'
                : 'MATCH TIED!'}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
              {match.summary}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <span className="block text-xs text-slate-400">Player Final Score</span>
                <strong className="mt-0.5 block font-mono text-xl font-bold text-white tabular-nums">
                  {match.playerScore}/{match.playerWickets} ({match.playerBalls} balls)
                </strong>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <span className="block text-xs text-slate-400">Bot Final Score</span>
                <strong className="mt-0.5 block font-mono text-xl font-bold text-white tabular-nums">
                  {match.botScore}/{match.botWickets} ({match.botBalls} balls)
                </strong>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <span className="block text-xs text-slate-400">Total Runs Scored</span>
                <strong className="mt-0.5 block font-mono text-lg font-bold text-amber-300 tabular-nums">
                  {match.playerScore + match.botScore} runs
                </strong>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <span className="block text-xs text-slate-400">Total Balls Played</span>
                <strong className="mt-0.5 block font-mono text-lg font-bold text-white tabular-nums">
                  {match.playerBalls + match.botBalls} balls
                </strong>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <span className="block text-xs text-slate-400">Toss Winner</span>
                <strong className="mt-0.5 block text-base font-bold text-white">
                  {match.tossWinner === 'PLAYER' ? 'YOU' : 'BOT'} ({match.playerTossChoice})
                </strong>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <span className="block text-xs text-slate-400">Batted First</span>
                <strong className="mt-0.5 block text-base font-bold text-white">
                  {match.firstBatter === 'PLAYER' ? 'YOU' : 'BOT'}
                </strong>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={startNewMatch}
                className="min-h-[48px] whitespace-nowrap rounded-xl bg-emerald-600 px-8 py-3 text-base font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                PLAY AGAIN
              </button>
              <button
                type="button"
                onClick={returnToMainMenu}
                className="min-h-[48px] whitespace-nowrap rounded-xl border border-slate-600 bg-slate-800 px-8 py-3 text-base font-bold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                MAIN MENU
              </button>
            </div>
          </section>
        )}
      </main>

      <HowToPlayModal isOpen={showHowTo} onClose={() => setShowHowTo(false)} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onRestartMatch={startNewMatch}
        onReturnHome={returnToMainMenu}
        inMatch={isInMatch}
      />
    </div>
  );
}
