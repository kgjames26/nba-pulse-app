import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDaysYmd, etYmd, referenceSlate } from "./dates.ts";
import { dictionaries, type Key } from "./i18n.ts";
import { americanToImplied, fairProbs, percentPair } from "./odds.ts";
import { recapProse, type RecapFacts } from "./prose.ts";
import { collectResearch, parseTactic } from "./tactic.ts";
import { presentGame, showResultsFor } from "./present.ts";
import { broadcastIsNational, rankGames } from "./rank.ts";
import type { GameCard } from "./types.ts";

describe("slate date", () => {
  it("uses the previous Eastern day as the home slate", () => {
    const eveningBelgium = new Date("2026-10-26T21:15:00Z");
    assert.equal(etYmd(eveningBelgium), "20261026");
    assert.equal(referenceSlate(eveningBelgium), "20261025");
  });

  it("rolls the slate after midnight Eastern", () => {
    const afterMidnightEt = new Date("2026-10-27T05:30:00Z");
    assert.equal(etYmd(afterMidnightEt), "20261027");
    assert.equal(referenceSlate(afterMidnightEt), "20261026");
  });

  it("crosses month boundaries", () => {
    assert.equal(addDaysYmd("20261031", 1), "20261101");
    assert.equal(addDaysYmd("20260301", -1), "20260228");
  });
});

describe("odds", () => {
  it("converts American prices and removes the margin", () => {
    const fav = americanToImplied(-142);
    const dog = americanToImplied(120);
    assert.ok(fav && dog);
    assert.ok(Math.abs(fav - 142 / 242) < 1e-9);
    assert.ok(Math.abs(dog - 100 / 220) < 1e-9);
    const fair = fairProbs(-142, 120);
    assert.ok(fair);
    assert.ok(Math.abs(fair.home + fair.away - 1) < 1e-9);
    assert.ok(fair.home > fair.away);
    const pair = percentPair(fair.home, fair.away);
    assert.equal(pair.home + pair.away, 100);
  });

  it("does not invent a price from zero", () => {
    assert.equal(americanToImplied(0), null);
    assert.equal(fairProbs(0, -110), null);
  });
});

describe("order", () => {
  const row = (id: string, fav: boolean, national: boolean, titles: number, tip: string) => ({
    id,
    homeId: fav ? "2" : id,
    awayId: "99",
    nationalTv: national,
    tipoff: tip,
    titleWeight: titles,
  });

  it("puts favorites, then national TV, then title weight", () => {
    const games = [
      row("a", false, false, 20, "2026-10-25T00:00:00Z"),
      row("b", true, false, 0, "2026-10-25T03:00:00Z"),
      row("c", false, true, 1, "2026-10-25T02:00:00Z"),
    ];
    assert.deepEqual(
      rankGames(games, ["2"]).map((game) => game.id),
      ["b", "c", "a"],
    );
  });

  it("does not treat a local RSN as national", () => {
    assert.equal(broadcastIsNational("home", "NBC Sports Boston"), false);
    assert.equal(broadcastIsNational("home", "NBA League Pass"), false);
    assert.equal(broadcastIsNational("national", "ESPN"), true);
    assert.equal(broadcastIsNational("home", "ESPN"), true);
    assert.equal(broadcastIsNational("home", "ABC"), true);
  });
});

describe("spoilers", () => {
  const game = {
    id: "1",
    status: "post",
    clock: "0:00",
    home: { score: 120, winner: true, lines: [30, 30, 30, 30] },
    away: { score: 110, winner: false, lines: [20, 30, 30, 30] },
  } as GameCard;

  it("hides finals until a voluntary reveal", () => {
    assert.equal(showResultsFor(false, [], "1"), false);
    assert.equal(showResultsFor(false, ["1"], "1"), true);
    const hidden = presentGame(game, false);
    assert.equal(hidden.home.score, null);
    assert.equal(hidden.away.winner, false);
    assert.equal(hidden.home.lines.length, 0);
    assert.equal(presentGame(game, true).home.score, 120);
  });
});

describe("recap", () => {
  const facts: RecapFacts = {
    awayName: "Los Angeles Lakers",
    homeName: "Utah Jazz",
    awayScore: 132,
    homeScore: 123,
    winner: "Los Angeles Lakers",
    loser: "Utah Jazz",
    margin: 9,
    ot: 0,
    halfLeader: "Utah Jazz",
    tops: [{ name: "Luka Doncic", team: "Los Angeles Lakers", pts: "52", reb: "8", ast: "10", fg: "16-28" }],
    venue: "Delta Center",
    attendance: 18000,
  };

  it("stays inside the supplied figures in every language", () => {
    for (const lang of ["fr", "en", "es", "tr", "ar", "zh"] as const) {
      const text = recapProse(lang, facts);
      assert.match(text, /Luka Doncic/);
      assert.match(text, /132|9/);
      assert.match(text, /Los Angeles Lakers/);
      assert.doesNotMatch(text, /quote|according to a source/i);
    }
  });
});

describe("tactic", () => {
  const worked = "Les Lakers ont gagné le duel de pick-and-roll en forçant le drop du Jazz, puis en punissant la couverture courte par des tirs derrière la ligne. Le rythme en transition a empêché Utah de poser sa défense, et le verre offensif a offert une deuxième possession à chaque séquence ratée.".repeat(1);
  const failed = "Utah n'a pas ajusté après la mi-temps : la couverture sur Luka est restée trop basse, les aides arrivaient tard, et les pertes de balle en live-ball ont nourri le jeu de course adverse. Le profil de tir s'est écrasé sur des longues mi-distances contestées sans second chance.".repeat(1);

  const payload = JSON.stringify({
    lead: "Les Lakers ont dicté le rythme dès le deuxième quart, et le Jazz n'a jamais retrouvé son plan.",
    worked,
    failed,
    sources: [
      { title: "Lakers pull away", url: "https://www.espn.com/nba/recap/_/gameId/401705001" },
      { title: "1", url: "https://www.nba.com/game/lal-vs-uta-0022500001" },
      { title: "Social", url: "https://x.com/nba/status/1" },
      { title: "Ghost", url: "https://example.com/nba/recap/not-cited" },
    ],
  });

  it("keeps only cited articles and drops social or invented links", () => {
    const tactic = parseTactic(payload, [
      "https://www.espn.com/nba/recap/_/gameId/401705001",
      "https://www.nba.com/game/lal-vs-uta-0022500001?utm=1",
      "https://x.com/nba/status/1",
    ], { winner: "Los Angeles Lakers", loser: "Utah Jazz" });
    assert.ok(tactic);
    assert.equal(tactic?.sources.length, 1);
    assert.equal(tactic?.sources[0]?.title, "Lakers pull away");
    assert.equal(tactic?.winner, "Los Angeles Lakers");
    assert.equal(tactic?.loser, "Utah Jazz");
  });

  it("swaps blocks when the model assigns them to the wrong side", () => {
    const swapped = JSON.stringify({
      lead: "Le plan du match s'est inversé après la pause, au profit du cinq de Los Angeles.",
      worked: `${failed} Utah Jazz.`,
      failed: `${worked} Los Angeles Lakers.`,
      sources: [{ title: "Recap du soir", url: "https://www.lequipe.fr/Basket/Article/lakers-jazz/123456" }],
    });
    const tactic = parseTactic(swapped, ["https://www.lequipe.fr/Basket/Article/lakers-jazz/123456"], {
      winner: "Los Angeles Lakers",
      loser: "Utah Jazz",
    });
    assert.match(tactic?.worked ?? "", /Los Angeles Lakers/);
    assert.match(tactic?.failed ?? "", /Utah Jazz/);
  });

  it("refuses a reading with no cited article", () => {
    assert.equal(parseTactic(payload, [], { winner: "Los Angeles Lakers", loser: "Utah Jazz" }), null);
  });

  it("reads citations from the responses payload", () => {
    const found = collectResearch({
      citations: ["https://www.espn.com/nba/recap/_/gameId/1"],
      output: [
        {
          content: [
            {
              type: "output_text",
              text: payload,
              annotations: [{ type: "url_citation", url: "https://www.cbssports.com/nba/news/lakers-jazz-recap/" }],
            },
          ],
        },
      ],
    });
    assert.match(found.text, /worked/);
    assert.equal(found.citations.length, 2);
  });
});

describe("translations", () => {
  it("covers the same keys in six languages", () => {
    const keys = Object.keys(dictionaries.en) as Key[];
    for (const lang of ["fr", "en", "es", "tr", "ar", "zh"] as const) {
      for (const key of keys) assert.equal(typeof dictionaries[lang][key], "string");
      assert.equal(Object.keys(dictionaries[lang]).length, keys.length);
    }
  });
});
