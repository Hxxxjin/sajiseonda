"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { questions, results } from "./data";
import styles from "./alba.module.css"; // CSS 파일명 주의!

// A, B, C, D 중 가장 많이 고른 타입을 계산
const calculateResult = (answers: (number | null)[]) => {
  const counts = [0, 0, 0, 0]; // A, B, C, D 카운트
  
  answers.forEach((choiceIdx) => {
    if (choiceIdx !== null) {
      counts[choiceIdx] += 1;
    }
  });

  const maxCount = Math.max(...counts);
  const maxIndex = counts.indexOf(maxCount);
  
  const resultTypes = ["A", "B", "C", "D"];
  return resultTypes[maxIndex];
};

const initAnswers = () => Array<number | null>(questions.length).fill(null);

export default function AlbaTest() { // 컴포넌트 이름 변경
  const router = useRouter();
  const [screen, setScreen] = useState<"start" | "test" | "result">("start");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(initAnswers());
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [resultType, setResultType] = useState("");
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = (choice: number, currentAnswers: (number | null)[], qIndex: number) => {
    const newAnswers = [...currentAnswers];
    newAnswers[qIndex] = choice;
    setAnswers(newAnswers);

    if (qIndex + 1 >= questions.length) {
      setResultType(calculateResult(newAnswers));
      setScreen("result");
    } else {
      setCurrentQ(qIndex + 1);
      setSelectedChoice(newAnswers[qIndex + 1] ?? null);
    }
  };

  const handleSelect = (choiceIndex: number, currentAnswers: (number | null)[], qIndex: number) => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setSelectedChoice(choiceIndex);
    advance(choiceIndex, currentAnswers, qIndex);
  };

  const handleNext = () => {
    if (selectedChoice === null) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    advance(selectedChoice, answers, currentQ);
  };

  const handlePrev = () => {
    if (currentQ === 0) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    const newAnswers = [...answers];
    newAnswers[currentQ] = selectedChoice;
    setAnswers(newAnswers);
    setCurrentQ(currentQ - 1);
    setSelectedChoice(newAnswers[currentQ - 1] ?? null);
  };

  const restart = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setScreen("start");
    setCurrentQ(0);
    setAnswers(initAnswers());
    setSelectedChoice(null);
    setResultType("");
  };

  const progress = (currentQ / questions.length) * 100;
  const result = results[resultType];

  return (
    <div className={styles.container}>
      {/* ── 시작 화면 ── */}
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>💸</div>
          <h1 className={styles.startTitle}>K-알바생 멘탈 테스트</h1>
          <p className={styles.startDesc}>당신에게 닥칠 억까 상황 속에서 살아남으세요</p>
          <button className={styles.startBtn} onClick={() => setScreen("test")}>
            테스트 시작하기
          </button>
        </div>
      )}

      {/* ── 질문 화면 ── */}
      {screen === "test" && (
        <div className={styles.testScreen}>
          <button className={styles.backToMainLink} onClick={() => router.push("/main")}>
            ← 메인메뉴로
          </button>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressText}>
            {currentQ + 1} / {questions.length}
          </p>
          <div className={styles.questionCard}>
            <p className={styles.questionText}>{questions[currentQ].text}</p>
            <div className={styles.choiceList}>
              {questions[currentQ].choices.map((choice, i) => (
                <button
                  key={i}
                  className={`${styles.choiceBtn} ${selectedChoice === i ? styles.choiceBtnSelected : ""}`}
                  onClick={() => handleSelect(i, answers, currentQ)}
                >
                  <span className={styles.choiceLabel}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                </button>
              ))}
            </div>
            <div className={styles.navRow}>
              <button
                className={styles.prevBtn}
                onClick={handlePrev}
                disabled={currentQ === 0}
              >
                ← 이전
              </button>
              <button
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={selectedChoice === null}
              >
                다음 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 결과 화면 ── */}
      {screen === "result" && result && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>{result.emoji}</div>
          <div className={styles.resultType}>{result.type} Type</div>
          <h2 className={styles.resultTitle}>{result.title}</h2>
          <p className={styles.resultDesc}>{result.description}</p>
          <div className={styles.resultGrid}>
            <div className={styles.resultBox}>
              <h3>강점</h3>
              <ul>
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className={styles.resultBox}>
              <h3>약점</h3>
              <ul>
                {result.weaknesses.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
          <button className={styles.restartBtn} onClick={restart}>
            다시 테스트하기
          </button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>
            메인으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}