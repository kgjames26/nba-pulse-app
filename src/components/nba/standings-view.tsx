import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatTip } from "@/lib/nba/dates";
import { getStandings } from "@/lib/nba/api";
import { localeFor, phaseLabel, t, type Lang } from "@/lib/nba/i18n";
import type { StandingRow } from "@/lib/nba/types";
import { UNKNOWN_COLOR } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark } from "./ui";

export function StandingsView({
  lang,
  open,
  favoriteIds,
  canSee,
  onUnlock,
  onClose,
}: {
  lang: Lang;
  open: boolean;
  favoriteIds: string[];
  canSee: boolean;
  onUnlock: () => void;
  onClose: () => void;
}) {
  const [side, setSide] = useState<"east" | "west">("east");
  const query = useQuery({
    queryKey: ["standings"],
    enabled: open && canSee,
    queryFn: () => getStandings({ data: { confirm: true } }),
  });
  if (!open) return null;
  const locale = localeFor(lang);
  const table = query.data?.ok ? query.data.standings : null;
  const rows = side === "east" ? table?.east ?? [] : table?.west ?? [];

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-xl px-4 pb-12 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-4xl">{t(lang, "standings")}</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-line px-4 text-sm">
            {t(lang, "close")}
          </button>
        </div>
        {!canSee && (
          <div className="mt-8 rounded-card border border-line bg-surface p-5">
            <p className="font-display text-3xl">{t(lang, "standLockTitle")}</p>
            <p className="mt-3 text-sm text-muted">{t(lang, "standLockBody")}</p>
            <div className="mt-5">
              <PrimaryButton onClick={onUnlock}>{t(lang, "standReveal")}</PrimaryButton>
            </div>
          </div>
        )}
        {canSee && (
          <>
            <div className="mt-5 flex gap-2">
              {(["east", "west"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSide(key)}
                  className={`min-h-11 flex-1 rounded-full text-sm ${side === key ? "bg-accent text-accent-ink" : "border border-line"}`}
                >
                  {t(lang, key)}
                </button>
              ))}
            </div>
            {table && (
              <p className="mt-3 text-xs text-faint">
                {table.season}
                {table.phase ? ` · ${phaseLabel(String(table.phase), lang)}` : ""} · {t(lang, "updated", { time: formatTip(table.fetchedAt, locale) })}
              </p>
            )}
            {query.isLoading && <div className="mt-4 h-40 animate-pulse rounded-card bg-surface" />}
            {query.data && !query.data.ok && (
              <div className="mt-4">
                <p>{t(lang, "loadError")}</p>
                <button type="button" onClick={() => void query.refetch()} className="mt-3 min-h-11 rounded-full bg-accent px-5 text-sm text-accent-ink">
                  {t(lang, "retry")}
                </button>
              </div>
            )}
            <ol className="mt-4 flex flex-col gap-2">
              {rows.map((row, index) => (
                <Row key={row.id} row={row} index={index} lang={lang} favorite={favoriteIds.includes(row.id)} />
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ row, index, lang, favorite }: { row: StandingRow; index: number; lang: Lang; favorite: boolean }) {
  const streak = localStreak(row.streak, lang);
  return (
    <li className={`flex items-center gap-3 rounded-card border px-3 py-3 ${favorite ? "border-accent bg-raised" : "border-line bg-surface"}`}>
      <span className="w-6 font-display text-xl text-faint">{index + 1}</span>
      <TeamMark abbr={row.abbr} color={UNKNOWN_COLOR} sources={[row.logo]} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{row.name}</span>
        <span className="block text-xs text-faint">
          {row.wins}
          {t(lang, "wins")}–{row.losses}
          {t(lang, "losses")} · {row.pct} · {t(lang, "gb")} {row.gb || "—"} · {streak}
        </span>
      </span>
    </li>
  );
}

function localStreak(raw: string, lang: Lang): string {
  const match = raw.match(/^([WL])(\d+)$/i);
  if (!match) return raw;
  const word = match[1]?.toUpperCase() === "W" ? t(lang, "streakW") : t(lang, "streakL");
  return `${word}${match[2]}`;
}
