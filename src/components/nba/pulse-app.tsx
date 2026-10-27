import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getSlate } from "@/lib/nba/api";
import { addDaysYmd, etYmd, referenceSlate } from "@/lib/nba/dates";
import { dirFor, t } from "@/lib/nba/i18n";
import { usePrefs } from "@/lib/nba/prefs";
import { rankGames } from "@/lib/nba/rank";
import { showResultsFor } from "@/lib/nba/present";
import { GameView } from "./game-view";
import { Onboarding } from "./onboarding";
import { SettingsView } from "./settings-view";
import { SlateView } from "./slate-view";
import { StandingsView } from "./standings-view";
import { Wordmark } from "./ui";

export function PulseApp() {
  const hydrated = useSyncExternalStore(
    (onStore) => usePrefs.persist.onFinishHydration(onStore),
    () => usePrefs.persist.hasHydrated(),
    () => false,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    void usePrefs.persist.rehydrate();
    setMounted(true);
  }, []);
  if (!mounted || !hydrated) return <Splash />;
  return <Desk />;
}

function Splash() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg">
      <Wordmark />
    </main>
  );
}

function Desk() {
  const onboarded = usePrefs((state) => state.onboarded);
  const favoriteIds = usePrefs((state) => state.favoriteIds);
  const spoilers = usePrefs((state) => state.spoilers);
  const lang = usePrefs((state) => state.lang);
  const revealedIds = usePrefs((state) => state.revealedIds);
  const standingsUnlockedOn = usePrefs((state) => state.standingsUnlockedOn);
  const complete = usePrefs((state) => state.complete);
  const setLang = usePrefs((state) => state.setLang);
  const setSpoilers = usePrefs((state) => state.setSpoilers);
  const setFavorites = usePrefs((state) => state.setFavorites);
  const reveal = usePrefs((state) => state.reveal);
  const unlockStandings = usePrefs((state) => state.unlockStandings);
  const reset = usePrefs((state) => state.reset);

  const now = useMemo(() => new Date(), []);
  const anchor = referenceSlate(now);
  const [offset, setOffset] = useState(0);
  const [gameId, setGameId] = useState<string | null>(null);
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const date = addDaysYmd(anchor, offset);
  const client = useQueryClient();

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (!onboarded || standingsOpen || settingsOpen) return;
      if (event.key === "ArrowLeft") setOffset((value) => Math.max(-220, value - 1));
      if (event.key === "ArrowRight") setOffset((value) => Math.min(45, value + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onboarded, standingsOpen, settingsOpen]);

  const query = useQuery({
    queryKey: ["slate", date],
    enabled: onboarded,
    queryFn: () => getSlate({ data: { date } }),
    refetchInterval: (current) => {
      const data = current.state.data;
      if (!data?.ok) return 120_000;
      return data.slate.games.some((game) => game.status === "in") ? 30_000 : 120_000;
    },
  });

  useEffect(() => {
    if (!onboarded) return;
    for (const delta of [-1, 1]) {
      const day = addDaysYmd(date, delta);
      void client.prefetchQuery({
        queryKey: ["slate", day],
        queryFn: () => getSlate({ data: { date: day } }),
      });
    }
  }, [client, date, onboarded]);

  if (!onboarded) {
    return (
      <Onboarding
        onDone={(input) => {
          complete(input);
        }}
      />
    );
  }

  const slate = query.data?.ok ? query.data.slate : null;
  const ranked = slate
    ? {
        ...slate,
        games: rankGames(
          slate.games.map((game) => ({ ...game, homeId: game.home.id, awayId: game.away.id })),
          favoriteIds,
        ),
      }
    : null;

  const canSeeStandings = spoilers || standingsUnlockedOn === etYmd();

  return (
    <div className="mx-auto min-h-screen max-w-6xl lg:grid lg:grid-cols-3">
      <SlateView
        lang={lang}
        date={date}
        slate={ranked}
        loading={query.isLoading}
        error={Boolean(query.isError || (query.data && !query.data.ok))}
        favoriteIds={favoriteIds}
        spoilers={spoilers}
        revealedIds={revealedIds}
        onShift={(delta) => {
          setOffset((value) => Math.min(45, Math.max(-220, value + delta)));
          setGameId(null);
        }}
        onRetry={() => void query.refetch()}
        onOpen={setGameId}
        onStandings={() => setStandingsOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />
      <div className={gameId ? "fixed inset-0 z-20 col-span-2 overflow-y-auto bg-bg lg:static lg:z-auto" : "col-span-2 hidden lg:block"}>
        {gameId ? (
          <GameView
            id={gameId}
            lang={lang}
            show={showResultsFor(spoilers, revealedIds, gameId)}
            onBack={() => setGameId(null)}
            onReveal={() => reveal(gameId)}
          />
        ) : (
          <div className="hidden min-h-screen place-items-center px-8 lg:grid">
            <p className="max-w-sm text-center text-muted">{t(lang, "pickGame")}</p>
          </div>
        )}
      </div>
      <StandingsView
        lang={lang}
        open={standingsOpen}
        favoriteIds={favoriteIds}
        canSee={canSeeStandings}
        onUnlock={() => unlockStandings(etYmd())}
        onClose={() => setStandingsOpen(false)}
      />
      <SettingsView
        open={settingsOpen}
        lang={lang}
        spoilers={spoilers}
        favoriteIds={favoriteIds}
        onClose={() => setSettingsOpen(false)}
        onLang={setLang}
        onSpoilers={setSpoilers}
        onFavorites={(ids) => {
          setFavorites(ids);
          setSettingsOpen(false);
        }}
        onReset={() => {
          reset();
          setSettingsOpen(false);
          setGameId(null);
          setStandingsOpen(false);
        }}
      />
    </div>
  );
}
