'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./main.module.css";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

type Category = "전체" | "성격" | "연애" | "능력" | "기타";

const CATEGORIES: Category[] = ["전체", "성격", "연애", "능력", "기타"];

const CARDS = [
  {
    categories: ["전체", "성격"] as Category[],
    href: "/mbti",
    img: "/img/mbti.svg",
    alt: "MBTI 테스트",
    title: "MBTI 테스트",
    desc: "나의 진짜 성격은 무엇일까?",
    tag: "성격",
  },
  {
    categories: ["전체", "연애"] as Category[],
    href: "/love",
    img: "/img/love.svg",
    alt: "이상형 테스트",
    title: "이상형 테스트",
    desc: "나의 이상형은 어떤 사람일까?",
    tag: "연애",
  },
  {
    categories: ["전체", "능력"] as Category[],
    href: "/memory",
    img: "/img/memory.svg",
    alt: "기억력 테스트",
    title: "기억력 테스트",
    desc: "나의 기억력 한계는 어디까지일까?",
    tag: "능력",
  },

  {
    categories: ["전체", "기타"] as Category[], // '전체', '기타', '성격' 탭에서 모두 보이게 설정
    href: "/alba",
    img: "/img/mbti.svg", // 💡 알바 전용 이미지가 아직 없어서 임시로 mbti 이미지를 넣었어요! 나중에 alba.svg 등으로 바꿔주세요.
    alt: "알바생 멘탈 테스트",
    title: "K-알바생 멘탈 테스트",
    desc: "당신에게 닥칠 억까 상황 속에서 살아남으세요",
    tag: "기타",
  },

];

type LikesState = Record<string, { count: number; liked: boolean }>;

export default function MainPage() {
  const [active, setActive] = useState<Category>("전체");
  const [likes, setLikes] = useState<LikesState>({});
  const { user, isAdmin, avatarUrl, nickname, loading } = useAuth();
  const router = useRouter();

  const visibleCards = CARDS.filter((c) => c.categories.includes(active));

  const fetchLikes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("test_likes").select("test_id, user_id");
    if (!data) return;

    const next: LikesState = {};
    CARDS.forEach((card) => {
      const id = card.href.slice(1);
      const cardLikes = data.filter((l) => l.test_id === id);
      next[id] = {
        count: cardLikes.length,
        liked: user ? cardLikes.some((l) => l.user_id === user.id) : false,
      };
    });
    setLikes(next);
  }, [user]);

  useEffect(() => {
    if (!loading) fetchLikes();
  }, [loading, fetchLikes]);

  async function handleLike(testId: string) {
    if (!user) {
      router.push("/login");
      return;
    }

    const isLiked = likes[testId]?.liked;

    // optimistic update
    setLikes((prev) => ({
      ...prev,
      [testId]: {
        count: (prev[testId]?.count ?? 0) + (isLiked ? -1 : 1),
        liked: !isLiked,
      },
    }));

    const supabase = createClient();
    if (isLiked) {
      await supabase.from("test_likes").delete().eq("user_id", user.id).eq("test_id", testId);
    } else {
      await supabase.from("test_likes").insert({ user_id: user.id, test_id: testId });
    }
  }

  async function handleLogout() {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>
            <Image src="/img/logo-icon.svg" alt="사지선다 로고" width={32} height={32} />
            사지선다
          </div>
          <ul className={styles.navMenu}>
            {CATEGORIES.map((cat) => (
              <li key={cat} className={styles.navItem}>
                <button
                  className={`${styles.navLink} ${active === cat ? styles.navLinkActive : ""}`}
                  onClick={() => setActive(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.navActions}>
            {!loading && (
              user ? (
                <>
                  {isAdmin && (
                    <>
                      <span className={styles.adminBadge}>관리자</span>
                      <Link href="/admin" className={styles.logoutBtn}>패널</Link>
                    </>
                  )}
                  <Link href="/profile" className={styles.avatarBtn}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="프로필" fill className={styles.avatarBtnImg} />
                    ) : (
                      <span className={styles.avatarBtnFallback}>
                        {(nickname?.[0] ?? user.email?.[0])?.toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <Link href="/login" className={styles.loginBtn}>로그인</Link>
              )
            )}
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.contentContainer}>
          <div className={styles.sectionHeader}>
            <h1 className={styles.categoryTitle}>{active}</h1>
            <p className={styles.sectionCount}>{visibleCards.length}개의 테스트</p>
          </div>
          <div className={styles.projectGrid}>
            {visibleCards.map((card) => {
              const testId = card.href.slice(1);
              const likeData = likes[testId];
              return (
                <div key={card.href} className={styles.cardWrapper}>
                  <Link href={card.href} className={styles.projectCard}>
                    <Image
                      src={card.img}
                      alt={card.alt}
                      width={420}
                      height={560}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardOverlay}>
                      <span className={styles.cardTag}>{card.tag}</span>
                      <div className={styles.cardBottom}>
                        <p className={styles.cardDesc}>{card.desc}</p>
                        <h2 className={styles.cardTitle}>{card.title}</h2>
                        <span className={styles.cardCta}>시작하기 →</span>
                      </div>
                    </div>
                  </Link>
                  <div className={styles.cardFooter}>
                    <button
                      className={`${styles.likeBtn} ${likeData?.liked ? styles.likeBtnActive : ""}`}
                      onClick={() => handleLike(testId)}
                    >
                      <svg className={styles.likeHeart} viewBox="0 0 24 24" width="20" height="20">
                        {likeData?.liked ? (
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill="#f43f5e"
                          />
                        ) : (
                          <path
                            d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"
                            fill="#6e6e73"
                          />
                        )}
                      </svg>
                      <span className={styles.likeCount}>{likeData?.count ?? 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
