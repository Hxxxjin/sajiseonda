"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./shooting.module.css";

type Screen = "start" | "game" | "result";
type Difficulty = "easy" | "normal" | "hard" | "challenge";

interface Target {
  id: number;
  x: number;
  sway: number;
  duration: number;
  size: number;
}

// 난이도는 오직 '크기'만 결정합니다.
const SETTINGS = {
  easy: { size: 100 },
  normal: { size: 80 },
  hard: { size: 60 },
  challenge: { size: 40 },
};

export default function ShootingTest() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targets, setTargets] = useState<Target[]>([]);

  const targetIdCounter = useRef(0);
  const spawnTimerRef = useRef<number | null>(null);
  const isGameOver = useRef(false);
  
  // 실시간 난이도 증가를 위해 점수를 ref로도 추적 (상태 업데이트 지연 방지)
  const scoreRef = useRef(0); 

  // 표적 스폰 (점수가 높을수록 점점 빠르게!)
  const scheduleNextSpawn = useCallback(() => {
    if (isGameOver.current) return;

    // 현재 점수를 기반으로 속도 계산
    const currentScore = scoreRef.current;
    
    // 기본 생성 주기 1200ms -> 1점당 15ms씩 단축 (최소 400ms 방어)
    const currentSpawnRate = Math.max(400, 1200 - currentScore * 15);
    
    // 기본 낙하 시간 4000ms -> 1점당 40ms씩 단축 (최소 1500ms 방어)
    const currentDuration = Math.max(1500, 4000 - currentScore * 40);

    const newTarget: Target = {
      id: targetIdCounter.current++,
      x: Math.floor(Math.random() * 80) + 10,
      sway: Math.floor(Math.random() * 30) - 15,
      duration: currentDuration,
      size: SETTINGS[difficulty].size,
    };

    setTargets((prev) => [...prev, newTarget]);

    // 다음 스폰 예약 (재귀적 setTimeout 사용)
    spawnTimerRef.current = window.setTimeout(scheduleNextSpawn, currentSpawnRate);
  }, [difficulty]);

  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    setTargets([]);
    setScreen("game");
    isGameOver.current = false;
    targetIdCounter.current = 0;
  };

  useEffect(() => {
    if (screen === "game" && !isGameOver.current) {
      scheduleNextSpawn(); // 최초 스폰 시작
      return () => {
        if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
      };
    }
  }, [screen, scheduleNextSpawn]);

  const handleGameOver = useCallback(() => {
    isGameOver.current = true;
    if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
    setScreen("result");
    setTargets([]);
  }, []);

  const handleHit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGameOver.current) return;

    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((prev) => {
      const newScore = prev + 1;
      scoreRef.current = newScore; // ref 동기화
      return newScore;
    });
  };

  const handleMiss = (id: number) => {
    if (isGameOver.current) return;

    setTargets((prev) => prev.filter((t) => t.id !== id));
    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        handleGameOver();
      }
      return nextLives;
    });
  };

  const resetGame = () => {
    setScreen("start");
    setTargets([]);
  };

  // 결과값을 유연하게 도출 (난이도 가중치 부여)
  const getRank = (finalScore: number, diff: Difficulty) => {
    // 챌린지로 30점 깬 사람이 쉬움으로 30점 깬 사람보다 랭크가 높아야 함
    const multiplier = diff === "challenge" ? 2 : diff === "hard" ? 1.5 : diff === "normal" ? 1 : 0.8;
    const adjustedScore = finalScore * multiplier;

    if (adjustedScore >= 100) return "신급 에임 마스터 (상위 0.1%)";
    if (adjustedScore >= 60) return "특수부대 정예 스나이퍼 (상위 5%)";
    if (adjustedScore >= 30) return "사격장 고인물 (상위 20%)";
    if (adjustedScore >= 15) return "입문용 사수 (일반인 평균)";
    return "총기 난사범 (침착하게 쏘세요!)";
  };

  return (
    <div className={styles.container}>
      {/* ── 시작 화면 ── */}
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>🔫</div>
          <h1 className={styles.startTitle}>무빙 에임 사격 테스트</h1>
          <p className={styles.startDesc}>
            떨어지는 표적을 쏴서 맞추세요!<br />
            진행될수록 떨어지는 속도가 점점 빨라집니다.
          </p>
          <h2 className={styles.diffTitle}>난이도를 선택하세요 (표적 크기)</h2>
          <div className={styles.difficultyContainer}>
            <button className={styles.btn} onClick={() => startGame("easy")}>쉬움</button>
            <button className={styles.btn} onClick={() => startGame("normal")}>보통</button>
            <button className={styles.btn} onClick={() => startGame("hard")}>어려움</button>
            <button className={`${styles.btn} ${styles.challengeBtn}`} onClick={() => startGame("challenge")}>
              챌린지
            </button>
          </div>
        </div>
      )}

      {/* ── 게임 화면 ── */}
      {screen === "game" && (
        <div className={styles.gameScreen}>
          <div className={styles.hud}>
            <button className={styles.backBtn} onClick={() => { isGameOver.current = true; resetGame(); }}>
              ← 포기
            </button>
            <div className={styles.scoreBox}>점수: {score}</div>
            <div className={styles.livesBox}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? styles.heartAlive : styles.heartDead}>
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className={styles.playArea}>
            {targets.map((target) => (
              <div
                key={target.id}
                className={styles.targetObj}
                style={
                  {
                    left: `${target.x}%`,
                    width: `${target.size}px`,
                    height: `${target.size}px`,
                    animationDuration: `${target.duration}ms`,
                    "--sway": `${target.sway}vw`,
                  } as React.CSSProperties
                }
                onAnimationEnd={() => handleMiss(target.id)}
                onMouseDown={(e) => handleHit(target.id, e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 결과 화면 ── */}
      {screen === "result" && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>💥</div>
          <h2 className={styles.resultTitle}>GAME OVER</h2>
          
          <div className={styles.scoreBoard}>
            <h3>최종 명중 횟수</h3>
            <div className={styles.finalScore}>{score} 타겟</div>
            <div className={styles.rankBadge}>{getRank(score, difficulty)}</div>
            <p style={{ marginTop: "12px", color: "#86868b", fontSize: "14px" }}>
              플레이 난이도: {difficulty.toUpperCase()}
            </p>
          </div>

          <button className={styles.restartBtn} onClick={resetGame}>다시 도전하기</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>메인으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}