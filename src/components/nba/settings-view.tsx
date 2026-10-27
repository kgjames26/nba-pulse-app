import { useState } from "react";
import { LANGS, t, type Lang } from "@/lib/nba/i18n";
import { TeamEditor } from "./onboarding";

export function SettingsView({
  open,
  lang,
  spoilers,
  favoriteIds,
  onClose,
  onLang,
  onSpoilers,
  onFavorites,
  onReset,
}: {
  open: boolean;
  lang: Lang;
  spoilers: boolean;
  favoriteIds: string[];
  onClose: () => void;
  onLang: (lang: Lang) => void;
  onSpoilers: (value: boolean) => void;
  onFavorites: (ids: string[]) => void;
  onReset: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const [panel, setPanel] = useState<"about" | "privacy" | null>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-4xl">{t(lang, "settings")}</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-line px-4 text-sm">
            {t(lang, "done")}
          </button>
        </div>
        <section className="mt-6">
          <h3 className="font-display text-2xl">{t(lang, "spoilers")}</h3>
          <div className="mt-3 grid gap-2">
            <button type="button" aria-pressed={spoilers} onClick={() => onSpoilers(true)} className={`rounded-card border p-4 text-start ${spoilers ? "border-accent bg-raised" : "border-line"}`}>
              <span className="block font-medium">{t(lang, "spoilOn")}</span>
              <span className="mt-1 block text-sm text-muted">{t(lang, "spoilOnBody")}</span>
            </button>
            <button type="button" aria-pressed={!spoilers} onClick={() => onSpoilers(false)} className={`rounded-card border p-4 text-start ${!spoilers ? "border-accent bg-raised" : "border-line"}`}>
              <span className="block font-medium">{t(lang, "spoilOff")}</span>
              <span className="mt-1 block text-sm text-muted">{t(lang, "spoilOffBody")}</span>
            </button>
          </div>
        </section>
        <section className="mt-8">
          <h3 className="font-display text-2xl">{t(lang, "language")}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                onClick={() => onLang(item.id)}
                className={`min-h-12 rounded-card border px-3 text-start ${lang === item.id ? "border-accent bg-raised" : "border-line"}`}
              >
                {item.native}
              </button>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <h3 className="font-display text-2xl">{t(lang, "teamsEdit")}</h3>
          <div className="mt-3">
            <TeamEditor lang={lang} initial={favoriteIds} onSave={onFavorites} />
          </div>
        </section>
        <section className="mt-8 flex flex-col gap-2">
          <button type="button" onClick={() => setPanel(panel === "about" ? null : "about")} className="min-h-11 rounded-card border border-line px-4 text-start">
            {t(lang, "about")}
          </button>
          {panel === "about" && (
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
              <p>{t(lang, "aboutData")}</p>
              <p>{t(lang, "aboutRights")}</p>
              <p>{t(lang, "aboutInstall")}</p>
            </div>
          )}
          <button type="button" onClick={() => setPanel(panel === "privacy" ? null : "privacy")} className="min-h-11 rounded-card border border-line px-4 text-start">
            {t(lang, "privacy")}
          </button>
          {panel === "privacy" && <p className="text-sm leading-relaxed text-muted">{t(lang, "privacyBody")}</p>}
          <button
            type="button"
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              onReset();
            }}
            className="min-h-11 rounded-card border border-line px-4 text-start text-muted"
          >
            {armed ? t(lang, "resetConfirm") : t(lang, "reset")}
          </button>
        </section>
      </div>
    </div>
  );
}
