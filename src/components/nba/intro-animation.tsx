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

const outline = { stroke: "#10131a", strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(onComplete, 3200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="nba-intro" aria-hidden="true">
      <svg className="nba-intro__scene" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="intro-spot">
            <stop offset="0" stopColor="#293243" stopOpacity=".8" />
            <stop offset="1" stopColor="#07080a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="intro-floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1c2430" stopOpacity=".18" />
            <stop offset=".5" stopColor="#141a22" stopOpacity=".5" />
            <stop offset="1" stopColor="#07080a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="jersey" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#25d5cf" />
            <stop offset=".55" stopColor="#078a91" />
            <stop offset="1" stopColor="#07515e" />
          </linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#e2aa80" />
            <stop offset=".5" stopColor="#b96e4d" />
            <stop offset="1" stopColor="#744331" />
          </linearGradient>
          <filter id="intro-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect width="390" height="844" fill="#07080a" />
        <ellipse cx="235" cy="382" rx="260" ry="300" fill="url(#intro-spot)" />
        <path d="M0 690 Q195 630 390 690 V844 H0Z" fill="url(#intro-floor)" />
        <path d="M0 703 Q195 644 390 703 M66 844 Q195 700 324 844 M195 662V844" fill="none" stroke="#748092" strokeOpacity=".15" strokeWidth="2" />

        <g className="intro-hoop">
          <path d="M326 220V322" stroke="#aab8c8" strokeWidth="6" />
          <path d="M314 220H340" stroke="#eef4fa" strokeWidth="5" />
          <path d="M289 326H319" stroke="#ff7043" strokeWidth="8" strokeLinecap="round" />
          <path d="M292 330L297 361L304 367L311 361L316 330M297 341H312M299 352H313" fill="none" stroke="#e8edf5" strokeOpacity=".78" strokeWidth="2" />
        </g>

        <g transform="translate(58 566)">
          <g className="intro-attacker">
            <ellipse cx="0" cy="108" rx="34" ry="8" fill="#000" opacity=".55" />
            <path d="M-15 27L-26 75L-48 101M12 25L25 71L48 89" fill="none" stroke="#10131a" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-15 27L-26 72L-45 94M12 25L24 68L44 83" fill="none" stroke="url(#skin)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-52 99L-29 94L-18 101L-20 108H-56Z M37 84L48 80L59 86L58 93L40 94Z" fill="#e6edf4" {...outline} />
            <path d="M-20-31Q0-43 20-31L27 20L17 39H-18L-28 18Z" fill="url(#jersey)" {...outline} />
            <path d="M-18-29L0-12L18-29L11-36H-11Z" fill="#e7f1ec" stroke="#10131a" strokeWidth="4" />
            <path d="M-9-8H9V22H-9Z" fill="#f1f5ef" opacity=".92" />
            <path d="M-23-26L-39-3L-58-22" fill="none" stroke="#10131a" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-23-26L-38-4L-55-22" fill="none" stroke="url(#skin)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18-29L35-51L52-79" fill="none" stroke="#10131a" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
            <path className="intro-shooting-arm" d="M18-29L35-51L52-79" fill="none" stroke="url(#skin)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="57" cy="-84" r="8" fill="url(#skin)" stroke="#10131a" strokeWidth="3" />
            <path d="M-24 10H25L20 42L-20 42Z" fill="#ed704b" {...outline} />
            <path d="M-20 13H-1V36H-17ZM5 13H21L17 36H5Z" fill="#f7a079" opacity=".55" />
            <path d="M-10-59Q-3-69 8-65Q19-61 16-49L12-38Q3-30-9-39Q-18-45-10-59Z" fill="url(#skin)" {...outline} />
            <path d="M-12-55Q-7-70 8-66L17-59L13-54L-1-56L-11-48Z" fill="#17151a" stroke="#10131a" strokeWidth="4" />
            <path d="M-9-42L-2-39" stroke="#f1c4a0" strokeWidth="2" />
          </g>
        </g>

        <g transform="translate(192 570)">
          <g className="intro-wemby">
            <ellipse cx="0" cy="114" rx="35" ry="9" fill="#000" opacity=".6" />
            <path d="M-15 28L-22 73L-38 104M13 28L21 74L40 102" fill="none" stroke="#10131a" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-15 28L-21 71L-36 98M13 28L20 72L37 96" fill="none" stroke="url(#skin)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-45 105L-29 97L-19 102L-19 111H-47ZM32 102L41 95L56 100L56 107L37 111Z" fill="#e9eef2" {...outline} />
            <path d="M-19-44Q0-52 19-44L24 17L14 36H-15L-24 17Z" fill="url(#jersey)" {...outline} />
            <path d="M-13-40L0-25L13-40L8-46H-8Z" fill="#e7f1ec" stroke="#10131a" strokeWidth="4" />
            <path d="M-12-28H12V26H-12Z" fill="#f1f5ef" opacity=".86" />
            <path d="M-19-39L-39-16L-54-25" fill="none" stroke="#10131a" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-19-39L-38-17L-52-25" fill="none" stroke="url(#skin)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18-40L37-71L49-132" fill="none" stroke="#10131a" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <path className="intro-block-arm" d="M18-40L37-71L49-132" fill="none" stroke="url(#skin)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M44-136L50-154L56-136L66-129L53-128L49-119L46-128L35-129Z" fill="url(#skin)" stroke="#10131a" strokeWidth="3" />
            <path d="M-22 14H24L18 44H-18Z" fill="#ed704b" {...outline} />
            <path d="M-18 18H-1V39H-16ZM6 18H20L16 39H6Z" fill="#f7a079" opacity=".56" />
            <path d="M-10-79Q-4-89 8-85Q18-81 15-67L11-50Q1-41-10-52Q-18-61-10-79Z" fill="url(#skin)" {...outline} />
            <path d="M-13-74Q-12-91 4-92Q15-91 19-80L14-73L5-80L-5-74Z" fill="#17151a" stroke="#10131a" strokeWidth="4" />
            <path d="M-7-57L1-54" stroke="#f1c4a0" strokeWidth="2" />
          </g>
        </g>

        <g className="intro-ball" transform="translate(286 314)">
          <circle r="19" fill="#f18a32" stroke="#17110e" strokeWidth="3" />
          <path d="M-18 0H18M0-18V18M-13-13Q0 0 13 13M13-13Q0 0-13 13" fill="none" stroke="#412b1d" strokeWidth="2.5" />
        </g>

        <circle className="intro-impact" cx="289" cy="284" r="50" fill="#eaf5ff" filter="url(#intro-glow)" />
        <path className="intro-impact-rays" d="M289 284L248 255M289 284L294 232M289 284L337 263M289 284L326 314M289 284L258 333" stroke="#fff" strokeWidth="5" strokeLinecap="round" />

        <g className="intro-glass">
          <path className="intro-crack" d="M289 284L232 208L199 171L205 105M289 284L340 224L390 194M289 284L335 347L390 374M289 284L236 382L208 466L232 548M289 284L179 293L111 277L0 302M289 284L165 354L97 428L0 454M289 284L184 216L105 164L0 133M289 284L184 402L132 520L111 646M289 284L333 416L354 540L390 635" fill="none" stroke="#eaf5ff" strokeOpacity=".9" strokeWidth="2" />
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
