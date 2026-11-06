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

      <div className="intro-impact" aria-hidden="true"><i /><i /><i /></div>
      <div className="intro-sparks" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="intro-brand" aria-hidden="true"><span className="intro-brand__nba">NBA</span><span className="intro-brand__pulse">PULSE</span><span className="intro-brand__rule" /></div>
    </div>
  );
}
