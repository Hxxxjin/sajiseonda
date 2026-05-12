"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./reaction.module.css";

type GameState = "start" | "waiting" | "ready" | "early" | "result" | "finish";

export default function ReactionTest() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("start");
  const [results, setResults] = useState<number[]>([]);
  const [message, setMessage] = useState("반응속도 테스트");
  const [subMessage, setSubMessage] = useState("화면이 초록색으로 변하면 최대한 빨리 클릭하세요.");

  const startTime = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const startRound = useCallback(() => {
    setGameState("waiting");
    setMessage("기다리세요...");
    setSubMessage("초록색이 되면 클릭!");

    // 2초에서 5초 사이의 랜덤한 딜레이
    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    timeoutId.current = setTimeout(() => {
      setGameState("ready");
      setMessage("클릭하세요!");
      setSubMessage("");
      startTime.current = Date.now();
    }, randomDelay);
  }, []);

  const handleClick = () => {
    if (gameState === "start" || gameState === "result") {
      startRound();
    } else if (gameState === "waiting") {
      // 초록색이 되기 전에 클릭한 경우 (부정출발)
      if (timeoutId.current) clearTimeout(timeoutId.current);
      setGameState("early");
      setMessage("너무 빠릅니다!");
      setSubMessage("초록색이 된 후에 클릭해주세요. 화면을 눌러 다시 시도하세요.");
    } else if (gameState === "ready") {
      // 정상적으로 클릭하여 반응속도 측정
      const endTime = Date.now();
      const reactionTime = endTime - startTime.current;
      const newResults = [...results, reactionTime];
      setResults(newResults);

      if (newResults.length >= 5) {
        setGameState("finish");
      } else {
        setGameState("result");
        setMessage(`${reactionTime} ms`);
        setSubMessage("화면을 클릭해서 다음 라운드를 진행하세요.");
      }
    } else if (gameState === "early") {
      // 부정출발 후 다시 시작
      startRound();
    }
  };

  const resetGame = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모의 handleClick이 실행되지 않도록 막음
    setResults([]);
    setGameState("start");
    setMessage("반응속도 테스트");
    setSubMessage("화면이 초록색으로 변하면 최대한 빨리 클릭하세요.");
  };

  const getAverage = () => {
    if (results.length === 0) return 0;
    const sum = results.reduce((a, b) => a + b, 0);
    return Math.round(sum / results.length);
  };

  const getRank = (ms: number) => {
    if (ms < 200) return "전투기 조종사 급 (상위 1%)";
    if (ms < 250) return "프로게이머 급 (상위 10%)";
    if (ms < 300) return "일반인 평균";
    return "나무늘보 (반응이 느립니다)";
  };

  return (
    <div 
      className={`${styles.container} ${styles[gameState]}`} 
      onClick={gameState !== "finish" ? handleClick : undefined}
    >
      {/* ── 게임 진행 화면 ── */}
      {gameState !== "finish" && (
        <div className={styles.gameContent}>
          <button 
            className={styles.backToMainLink} 
            onClick={(e) => { e.stopPropagation(); router.push("/main"); }}
          >
            ← 메인메뉴로
          </button>
          
          <h1 className={styles.mainText}>{message}</h1>
          <p className={styles.subText}>{subMessage}</p>
          
          {gameState !== "start" && (
            <div className={styles.progress}>
              {results.length} / 5 라운드
            </div>
          )}
        </div>
      )}

      {/* ── 결과 화면 ── */}
      {gameState === "finish" && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>⚡</div>
          <h2 className={styles.resultTitle}>테스트 완료!</h2>
          
          <div className={styles.scoreBoard}>
            <div className={styles.averageBox}>
              <h3>평균 반응속도</h3>
              <div className={styles.averageScore}>{getAverage()} ms</div>
              <p className={styles.rankText}>{getRank(getAverage())}</p>
            </div>
            
            <ul className={styles.historyList}>
              {results.map((time, idx) => (
                <li key={idx}>
                  <span>{idx + 1}회차</span>
                  <span>{time} ms</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.btnGroup}>
            <button className={styles.restartBtn} onClick={resetGame}>
              다시 도전하기
            </button>
            <button className={styles.mainBtn} onClick={() => router.push("/main")}>
              메인으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}