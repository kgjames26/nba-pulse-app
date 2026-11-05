import { useEffect, type CSSProperties } from "react";

const SHARDS = [
  ["0,0 122,0 0,132", -110, -140], ["122,0 245,0 182,120", 10, -150],
  ["245,0 390,0 390,105", 130, -150], ["0,132 122,0 182,120", -140, -10],
  ["0,132 0,295 105,236", -170, 0], ["390,105 390,286 285,214", 170, -10],
  ["0,295 105,236 128,408 0,480", -180, 120], ["390,286 285,214 260,410 390,476", 180, 100],
  ["0,480 128,408 180,570 0,650", -160, 160], ["390,476 260,410 220,570 390,650", 160, 160],
  ["0,650 180,570 168,844 0,844", -120, 180], ["390,650 220,570 245,844 390,844", 120, 180],
  ["128,408 195,350 260,410 220,570 180,570", -40, 80], ["105,236 182,120 285,214 195,350 128,408", 25, -50],
] as const;

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(onComplete, 3300);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="nba-intro" aria-hidden="true">
      <svg className="nba-intro__scene" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="intro-spot">
            <stop offset="0" stopColor="#202631" stopOpacity=".84" />
            <stop offset="1" stopColor="#07080a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="intro-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1c2430" stopOpacity=".18" />
            <stop offset=".5" stopColor="#141a22" stopOpacity=".5" />
            <stop offset="1" stopColor="#07080a" stopOpacity="0" />
          </linearGradient>
          <filter id="intro-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect width="390" height="844" fill="#07080a" />
        <ellipse cx="240" cy="390" rx="260" ry="300" fill="url(#intro-spot)" />
        <path d="M0 690 Q195 630 390 690 V844 H0Z" fill="url(#intro-floor)" />
        <path d="M0 703 Q195 644 390 703 M66 844 Q195 700 324 844 M195 662V844" fill="none" stroke="#748092" strokeOpacity=".15" strokeWidth="2" />

        <g className="intro-hoop">
          <path d="M326 220V322" stroke="#b9c5d4" strokeWidth="5" />
          <path d="M316 220H338" stroke="#b9c5d4" strokeWidth="4" />
          <path d="M322 325H286" stroke="#ff6b35" strokeWidth="7" strokeLinecap="round" />
          <path d="M289 328L294 359L302 366L310 359L315 328" fill="none" stroke="#e8edf5" strokeOpacity=".65" strokeWidth="2" />
          <path d="M294 340H311M296 351H312" stroke="#e8edf5" strokeOpacity=".5" strokeWidth="1.5" />
        </g>

        <g transform="translate(55 554)">
          <g className="intro-attacker">
            <ellipse cx="2" cy="82" rx="27" ry="7" fill="#000" opacity=".55" />
            <circle cx="0" cy="-52" r="14" fill="#b87b58" />
            <path d="M-15-37Q0-44 15-37L21 16L12 29H-14L-21 16Z" fill="#16a6a1" />
            <path d="M-8-25H8V2H-8Z" fill="#e8f4f2" opacity=".94" />
            <path d="M-15-30L-37-2L-55-28" fill="none" stroke="#b87b58" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path className="intro-shooting-arm" d="M15-31L38-55L60-69" fill="none" stroke="#b87b58" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-13 26L-21 58L-38 76M13 26L24 54L40 68" fill="none" stroke="#b87b58" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-22 14H21L15 32H-18Z" fill="#f1f3f5" />
            <path d="M-42 78L-31 75M37 69L48 71" stroke="#e9ecef" strokeWidth="8" strokeLinecap="round" />
          </g>
        </g>

        <g transform="translate(118 562)">
          <g className="intro-wemby">
            <ellipse cx="0" cy="96" rx="30" ry="8" fill="#000" opacity=".55" />
            <circle cx="0" cy="-67" r="15" fill="#805b49" />
            <path d="M-16-51Q0-59 16-51L22 14L12 30H-13L-22 14Z" fill="#d8dde3" />
            <path d="M-8-40H8V3H-8Z" fill="#1d2735" />
            <path d="M-15-44L-35-16L-51-29" fill="none" stroke="#805b49" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path className="intro-block-arm" d="M15-45L31-87L44-142" fill="none" stroke="#805b49" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-14 27L-20 65L-32 87M13 27L24 61L40 77" fill="none" stroke="#805b49" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-23 14H22L16 35H-17Z" fill="#111820" />
            <path d="M-37 89L-25 87M37 78L49 81" stroke="#f3f4f6" strokeWidth="9" strokeLinecap="round" />
          </g>
        </g>

        <g className="intro-ball" transform="translate(278 354)">
          <circle r="19" fill="#f18a32" />
          <path d="M-18 0H18M0-18V18M-13-13Q0 0 13 13M13-13Q0 0-13 13" fill="none" stroke="#412b1d" strokeWidth="2" />
        </g>

        <circle className="intro-impact" cx="274" cy="282" r="50" fill="#eaf5ff" filter="url(#intro-glow)" />
        <path className="intro-impact-rays" d="M274 282L238 258M274 282L285 235M274 282L320 263M274 282L307 309M274 282L248 326" stroke="#fff" strokeWidth="4" strokeLinecap="round" />

        <g className="intro-glass">
          <path className="intro-crack" d="M274 282L232 208L199 171L205 105M274 282L340 224L390 194M274 282L335 347L390 374M274 282L236 382L208 466L232 548M274 282L179 293L111 277L0 302M274 282L165 354L97 428L0 454M274 282L184 216L105 164L0 133M274 282L184 402L132 520L111 646M274 282L333 416L354 540L390 635" fill="none" stroke="#eaf5ff" strokeOpacity=".9" strokeWidth="2" />
          {SHARDS.map(([points, dx, dy], index) => (
            <polygon
              key={index}
              className="intro-shard"
              points={points}
              style={{ "--shard-x": `${dx}px`, "--shard-y": `${dy}px` } as CSSProperties}
              fill={index % 2 ? "#11151b" : "#080a0d"}
              fillOpacity=".86"
              stroke="#dce8f4"
              strokeOpacity=".2"
              strokeWidth="1"
            />
          ))}
        </g>

        <g className="intro-wordmark">
          <text x="195" y="115" textAnchor="middle" fill="#f2f4f8" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22" letterSpacing="4">NBA PULSE</text>
          <path d="M145 132H245" stroke="#ff6b35" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
