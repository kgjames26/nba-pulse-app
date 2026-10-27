import type { Lang } from "./i18n.ts";

export type TopLine = {
  name: string;
  team: string;
  pts: string;
  reb: string;
  ast: string;
  fg: string;
};

export type RecapFacts = {
  awayName: string;
  homeName: string;
  awayScore: number;
  homeScore: number;
  winner: string;
  loser: string;
  margin: number;
  ot: number;
  halfLeader: string | null;
  tops: TopLine[];
  venue: string | null;
  attendance: number | null;
};

export type DuelFact = {
  stat: "pts" | "reb" | "ast";
  a: string;
  aTeam: string;
  aVal: string;
  b: string;
  bTeam: string;
  bVal: string;
};

export type Absence = { name: string; team: string; status: string; detail: string };

const L = "\u200E";

export function scoreLine(f: RecapFacts): string {
  return `${L}${f.awayName} ${L}${f.awayScore} — ${L}${f.homeName} ${L}${f.homeScore}`;
}

export function halfLeaderName(
  awayLines: number[],
  homeLines: number[],
  awayName: string,
  homeName: string,
): string | null {
  if (awayLines.length < 2 || homeLines.length < 2) return null;
  const away = awayLines[0] + awayLines[1];
  const home = homeLines[0] + homeLines[1];
  if (away === home) return null;
  return away > home ? awayName : homeName;
}

export function otPeriods(awayLines: number[], homeLines: number[]): number {
  return Math.max(0, Math.max(awayLines.length, homeLines.length) - 4);
}

function topsSentence(lang: Lang, tops: TopLine[]): string {
  if (!tops.length) return "";
  const bit = (p: TopLine) => {
    if (lang === "fr") return `${p.name} (${p.team}) : ${p.pts} pts, ${p.reb} reb, ${p.ast} pas, tirs ${p.fg}`;
    if (lang === "es") return `${p.name} (${p.team}): ${p.pts} pts, ${p.reb} reb, ${p.ast} ast, tiros ${p.fg}`;
    if (lang === "tr") return `${p.name} (${p.team}): ${p.pts} sayı, ${p.reb} rib, ${p.ast} ast, isabet ${p.fg}`;
    if (lang === "ar") return `${p.name} (${p.team}): ${p.pts} نقطة، ${p.reb} متابعة، ${p.ast} تمريرة، تصويب ${p.fg}`;
    if (lang === "zh") return `${p.name}（${p.team}）：${p.pts} 分，${p.reb} 篮板，${p.ast} 助攻，投篮 ${p.fg}`;
    return `${p.name} (${p.team}): ${p.pts} pts, ${p.reb} reb, ${p.ast} ast, FG ${p.fg}`;
  };
  const joined = tops.map(bit).join(". ");
  if (lang === "fr") return `Meilleurs marqueurs — ${joined}.`;
  if (lang === "es") return `Máximos anotadores — ${joined}.`;
  if (lang === "tr") return `Sayı liderleri — ${joined}.`;
  if (lang === "ar") return `أبرز المسجلين — ${joined}.`;
  if (lang === "zh") return `得分最高 — ${joined}。`;
  return `Top scorers — ${joined}.`;
}

export function recapProse(lang: Lang, f: RecapFacts): string {
  const parts: string[] = [];
  if (f.winner && f.loser) {
    if (lang === "fr") parts.push(`${f.winner} s'impose face à ${f.loser}, écart de ${f.margin} points.`);
    else if (lang === "es") parts.push(`${f.winner} vence a ${f.loser} por ${f.margin} puntos.`);
    else if (lang === "tr") parts.push(`${f.winner}, ${f.loser} karşısında ${f.margin} sayı farkla kazandı.`);
    else if (lang === "ar") parts.push(`فاز ${f.winner} على ${f.loser} بفارق ${f.margin} نقطة.`);
    else if (lang === "zh") parts.push(`${f.winner} 以 ${f.margin} 分优势击败 ${f.loser}。`);
    else parts.push(`${f.winner} beat ${f.loser} by ${f.margin}.`);
  }
  if (f.ot > 0) {
    if (lang === "fr") parts.push(f.ot === 1 ? "Décision après une prolongation." : `Décision après ${f.ot} prolongations.`);
    else if (lang === "es") parts.push(f.ot === 1 ? "Se decidió en una prórroga." : `Se decidió tras ${f.ot} prórrogas.`);
    else if (lang === "tr") parts.push(f.ot === 1 ? "Maç bir uzatmada bitti." : `Maç ${f.ot} uzatmada bitti.`);
    else if (lang === "ar") parts.push(f.ot === 1 ? "حُسمت بعد وقت إضافي." : `حُسمت بعد ${f.ot} أوقات إضافية.`);
    else if (lang === "zh") parts.push(f.ot === 1 ? "比赛在一次加时后结束。" : `比赛在 ${f.ot} 次加时后结束。`);
    else parts.push(f.ot === 1 ? "Decided in overtime." : `Decided after ${f.ot} overtimes.`);
  }
  if (f.halfLeader && f.halfLeader !== f.winner) {
    if (lang === "fr") parts.push(`À la mi-temps, ${f.halfLeader} menait.`);
    else if (lang === "es") parts.push(`Al descanso mandaba ${f.halfLeader}.`);
    else if (lang === "tr") parts.push(`Devre arasında önde olan ${f.halfLeader} idi.`);
    else if (lang === "ar") parts.push(`عند الاستراحة كان التقدم لـ ${f.halfLeader}.`);
    else if (lang === "zh") parts.push(`半场领先的是 ${f.halfLeader}。`);
    else parts.push(`At halftime, ${f.halfLeader} led.`);
  }
  const tops = topsSentence(lang, f.tops);
  if (tops) parts.push(tops);
  if (f.venue) {
    if (lang === "fr") parts.push(`Salle indiquée : ${f.venue}.`);
    else if (lang === "es") parts.push(`Pabellón indicado: ${f.venue}.`);
    else if (lang === "tr") parts.push(`Salon: ${f.venue}.`);
    else if (lang === "ar") parts.push(`القاعة: ${f.venue}.`);
    else if (lang === "zh") parts.push(`场馆：${f.venue}。`);
    else parts.push(`Venue listed: ${f.venue}.`);
  }
  if (f.attendance != null) {
    if (lang === "fr") parts.push(`Spectateurs annoncés : ${f.attendance}.`);
    else if (lang === "es") parts.push(`Afluencia anunciada: ${f.attendance}.`);
    else if (lang === "tr") parts.push(`Açıklanan seyirci: ${f.attendance}.`);
    else if (lang === "ar") parts.push(`الحضور المعلن: ${f.attendance}.`);
    else if (lang === "zh") parts.push(`公布观众人数：${f.attendance}。`);
    else parts.push(`Listed attendance: ${f.attendance}.`);
  }
  return parts.join(" ");
}

const STAT_TITLE: Record<Lang, Record<DuelFact["stat"], string>> = {
  fr: { pts: "Marqueurs", reb: "Rebond", ast: "Meneurs" },
  en: { pts: "Scoring", reb: "Rebounding", ast: "Playmaking" },
  es: { pts: "Anotación", reb: "Rebote", ast: "Dirección" },
  tr: { pts: "Sayı", reb: "Ribaund", ast: "Oyun kurma" },
  ar: { pts: "التسجيل", reb: "المتابعة", ast: "صناعة اللعب" },
  zh: { pts: "得分", reb: "篮板", ast: "组织" },
};

export function duelProse(lang: Lang, d: DuelFact): { title: string; body: string } {
  const title = STAT_TITLE[lang][d.stat];
  const unit = d.stat === "pts" ? "pts" : d.stat === "reb" ? "reb" : "ast";
  if (lang === "fr") {
    return {
      title,
      body: `${d.a} (${d.aTeam}) est à ${d.aVal} ${unit} de moyenne cette saison. En face, ${d.b} (${d.bTeam}) est à ${d.bVal}. Comparaison des leaders du flux, pas une garantie de duel direct.`,
    };
  }
  if (lang === "es") {
    return {
      title,
      body: `${d.a} (${d.aTeam}) promedia ${d.aVal} ${unit} esta temporada. Frente a él, ${d.b} (${d.bTeam}) promedia ${d.bVal}. Es el líder que publica el flujo, no un enfrentamiento asegurado.`,
    };
  }
  if (lang === "tr") {
    return {
      title,
      body: `${d.a} (${d.aTeam}) bu sezon maç başına ${d.aVal} ${unit}. Karşısında ${d.b} (${d.bTeam}) ${d.bVal} ortalamada. Bu, akıştaki liderlerin kıyasıdır; birebir eşleşme garantisi değildir.`,
    };
  }
  if (lang === "ar") {
    return {
      title,
      body: `${d.a} (${d.aTeam}) بمعدل ${d.aVal} ${unit} هذا الموسم. في المقابل ${d.b} (${d.bTeam}) بمعدل ${d.bVal}. هذه مقارنة لمتصدري التغذية وليست وعدًا بمواجهة مباشرة.`,
    };
  }
  if (lang === "zh") {
    return {
      title,
      body: `${d.a}（${d.aTeam}）本赛季场均 ${d.aVal} ${unit}。对面 ${d.b}（${d.bTeam}）场均 ${d.bVal}。这是数据源中的队内领先者对比，并不保证一对一对位。`,
    };
  }
  return {
    title,
    body: `${d.a} (${d.aTeam}) is at ${d.aVal} ${unit} per game this season. Across from him, ${d.b} (${d.bTeam}) is at ${d.bVal}. This pairs the leaders in the feed — not a guaranteed one-on-one.`,
  };
}

export function absenceProse(lang: Lang, items: Absence[]): string {
  if (!items.length) return "";
  const bit = (item: Absence) => {
    const detail = item.detail ? `, ${item.detail}` : "";
    return `${item.name} (${item.team}, ${item.status}${detail})`;
  };
  const list = items.map(bit).join(" · ");
  if (lang === "fr") return `Statuts publiés par le flux : ${list}. Un joueur « Out » n'est pas présenté comme titulaire certain.`;
  if (lang === "es") return `Estados publicados por la fuente: ${list}. Un jugador « Out » no se presenta como titular seguro.`;
  if (lang === "tr") return `Akışın yayımladığı durumlar: ${list}. « Out » bir oyuncu kesin oynayacak gibi sunulmaz.`;
  if (lang === "ar") return `الحالات المنشورة في التغذية: ${list}. لا يُعرض صاحب حالة Out كمشارك مؤكد.`;
  if (lang === "zh") return `数据源公布的状态：${list}。状态为 Out 的球员不会被写成必定出场。`;
  return `Statuses published by the feed: ${list}. A player listed Out is not treated as a certain starter.`;
}
