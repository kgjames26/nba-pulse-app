import { useState } from "react";
import { Check } from "lucide-react";
import { LANGS, t, type Lang } from "@/lib/nba/i18n";
import { colorLogo, darkLogo, TEAMS, type Conference } from "@/lib/nba/teams";
import { PrimaryButton, TeamMark, Wordmark } from "./ui";

export function Onboarding({ onDone }: { onDone: (input: { favoriteIds: string[]; spoilers: boolean; lang: Lang }) => void }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang>("fr");
  const [ids, setIds] = useState<string[]>([]);
  const [spoilers, setSpoilers] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<Conference | "all">("all");
  const [note, setNote] = useState("");

  const teams = TEAMS.filter((team) => filter === "all" || team.conference === filter).slice().sort((a, b) => a.city.localeCompare(b.city));

  function toggle(id: string) {
    setNote("");
    setIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 5) {
        setNote(t(lang, "maxTeams"));
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-8 pt-8">
      <Wordmark />
      <p className="mt-8 text-xs uppercase tracking-widest text-accent">{t(lang, "stepOf", { n: step + 1 })}</p>
      {step === 0 && (
        <>
          <h1 className="mt-3 font-display text-5xl leading-none text-fg">{t(lang, "welcomeTitle")}</h1>
          <p className="mt-4 max-w-xl text-base text-muted">{t(lang, "welcomeBody")}</p>
          <div className="mt-6 flex gap-2">
            {(["all", "east", "west"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`min-h-11 rounded-full px-4 text-sm ${filter === key ? "bg-accent text-accent-ink" : "border border-line text-fg"}`}
              >
                {key === "all" ? t(lang, "allConf") : key === "east" ? t(lang, "east") : t(lang, "west")}
              </button>
            ))}
          </div>
          <h2 className="mt-8 font-display text-2xl">{t(lang, "teamsTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t(lang, "teamsHint")}</p>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {teams.map((team) => {
              const on = ids.includes(team.id);
              return (
                <li key={team.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(team.id)}
                    className={`flex min-h-28 w-full flex-col items-center gap-2 rounded-card border px-2 py-3 text-center ${on ? "border-accent bg-raised" : "border-line bg-surface"}`}
                  >
                    <TeamMark abbr={team.abbr} color={team.color} sources={[darkLogo(team.slug), colorLogo(team.slug)]} />
                    <span className="text-xs leading-tight text-fg">{team.name}</span>
                    {on && <Check className="size-4 text-accent" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {step === 1 && (
        <>
          <h1 className="mt-3 font-display text-5xl leading-none">{t(lang, "spoilersTitle")}</h1>
          <div className="mt-6 grid gap-3">
            <Choice on={spoilers === true} title={t(lang, "spoilOn")} body={t(lang, "spoilOnBody")} onClick={() => setSpoilers(true)} />
            <Choice on={spoilers === false} title={t(lang, "spoilOff")} body={t(lang, "spoilOffBody")} onClick={() => setSpoilers(false)} />
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h1 className="mt-3 font-display text-5xl leading-none">{t(lang, "langTitle")}</h1>
          <p className="mt-4 text-muted">{t(lang, "langHint")}</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                onClick={() => setLang(item.id)}
                className={`min-h-14 rounded-card border px-4 text-start text-lg ${lang === item.id ? "border-accent bg-raised" : "border-line bg-surface"}`}
              >
                {item.native}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="sticky bottom-0 mt-auto bg-bg pt-4">
        {note && <p className="mb-2 text-sm text-accent">{note}</p>}
        {step === 0 && ids.length === 0 && <p className="mb-2 text-sm text-muted">{t(lang, "needOne")}</p>}
        <div className="flex items-center gap-3">
          <p className="font-display text-2xl tabular-nums text-muted">{t(lang, "selectedCount", { n: ids.length })}</p>
          <div className="ms-auto flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((value) => value - 1)} className="min-h-11 rounded-full border border-line px-5 text-sm">
                {t(lang, "back")}
              </button>
            )}
            <div className="w-44">
              <PrimaryButton
                disabled={(step === 0 && (ids.length < 1 || ids.length > 5)) || (step === 1 && spoilers == null)}
                onClick={() => {
                  if (step < 2) setStep((value) => value + 1);
                  else if (spoilers != null) onDone({ favoriteIds: ids, spoilers, lang });
                }}
              >
                {step === 2 ? t(lang, "start") : t(lang, "continue")}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Choice({ on, title, body, onClick }: { on: boolean; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-card border p-5 text-start ${on ? "border-accent bg-raised" : "border-line bg-surface"}`}>
      <span className="block font-display text-3xl">{title}</span>
      <span className="mt-2 block text-sm text-muted">{body}</span>
    </button>
  );
}

export function TeamEditor({
  lang,
  initial,
  onSave,
}: {
  lang: Lang;
  initial: string[];
  onSave: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState(initial);
  const [note, setNote] = useState("");
  return (
    <div>
      <p className="text-sm text-muted">{t(lang, "teamsHint")}</p>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {TEAMS.slice().sort((a, b) => a.city.localeCompare(b.city)).map((team) => {
          const on = ids.includes(team.id);
          return (
            <li key={team.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setNote("");
                  setIds((current) => {
                    if (current.includes(team.id)) return current.filter((item) => item !== team.id);
                    if (current.length >= 5) {
                      setNote(t(lang, "maxTeams"));
                      return current;
                    }
                    return [...current, team.id];
                  });
                }}
                className={`flex min-h-24 w-full flex-col items-center gap-2 rounded-card border px-2 py-3 ${on ? "border-accent bg-raised" : "border-line bg-surface"}`}
              >
                <TeamMark abbr={team.abbr} color={team.color} sources={[darkLogo(team.slug), colorLogo(team.slug)]} />
                <span className="text-center text-xs leading-tight">{team.city}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {note && <p className="mt-3 text-sm text-accent">{note}</p>}
      {ids.length < 1 && <p className="mt-3 text-sm text-muted">{t(lang, "needOne")}</p>}
      <div className="mt-4">
        <PrimaryButton disabled={ids.length < 1} onClick={() => onSave(ids)}>
          {t(lang, "save")}
        </PrimaryButton>
      </div>
    </div>
  );
}
