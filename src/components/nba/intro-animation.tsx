import { useEffect } from "react";

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }

    const timer = window.setTimeout(onComplete, 3800);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="nba-intro"
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
      onClick={onComplete}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onComplete();
        }
      }}
    >
      <div className="intro-arena" aria-hidden="true" />
      <div className="intro-court" aria-hidden="true"><span className="intro-court__key" /></div>
      <div className="intro-beams" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="intro-speedlines" aria-hidden="true" />
      <div className="intro-rim" aria-hidden="true">
        <span className="intro-rim__backboard" />
        <span className="intro-rim__hoop" />
      </div>

      <div className="intro-athlete" aria-hidden="true">
        <img
          className="intro-athlete__player"
          src="/nba-pulse-intro.png"
          alt=""
          fetchPriority="high"
        />
      </div>

      <div className="intro-ball" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="29" />
          <path d="M7 22c17 2 33 18 35 35M26 4c2 17 18 33 35 35M11 11c13 8 34 29 42 42M53 11C40 19 19 40 11 53" />
        </svg>
      </div>

      <div className="intro-impact" aria-hidden="true"><i /><i /><i /></div>
      <div className="intro-sparks" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="intro-brand" aria-hidden="true">NBA <b>PULSE</b></div>
    </div>
  );
}
