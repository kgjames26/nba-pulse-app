import { useEffect } from "react";

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }

    const timer = window.setTimeout(onComplete, 3400);
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
      <div className="intro-court" />
      <div className="intro-arena-lights" />
      <div className="intro-kicker"><span>THE GAME</span><i /> <span>STARTS HERE</span></div>

      <div className="intro-art">
        <img
          className="intro-art__player"
          src="/nba-pulse-intro.png"
          alt=""
          fetchPriority="high"
        />
        <span className="intro-art__ring intro-art__ring--one" />
        <span className="intro-art__ring intro-art__ring--two" />
        <span className="intro-art__flash" />
      </div>

      <div className="intro-lockup">
        <div className="intro-lockup__eyebrow"><span /> LIVE THE MOMENT <span /></div>
        <div className="intro-lockup__title">NBA <b>PULSE</b></div>
        <div className="intro-lockup__rule"><i /><span>COURTSIDE, EVERY GAME</span><i /></div>
      </div>

      <div className="intro-corner intro-corner--left">EST. ON THE COURT<br /><b>01 / 82</b></div>
      <div className="intro-corner intro-corner--right">TIP-OFF<br /><b>2026—27</b></div>
      <div className="intro-bottom"><span>BUILT FOR THE LOVE OF BASKETBALL</span><i /></div>
    </div>
  );
}
