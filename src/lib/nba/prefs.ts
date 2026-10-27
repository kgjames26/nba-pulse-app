import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n.ts";

type Prefs = {
  onboarded: boolean;
  favoriteIds: string[];
  spoilers: boolean;
  lang: Lang;
  revealedIds: string[];
  standingsUnlockedOn: string | null;
  complete: (input: { favoriteIds: string[]; spoilers: boolean; lang: Lang }) => void;
  setLang: (lang: Lang) => void;
  setSpoilers: (spoilers: boolean) => void;
  setFavorites: (ids: string[]) => void;
  reveal: (gameId: string) => void;
  unlockStandings: (etDay: string) => void;
  reset: () => void;
};

const empty = {
  onboarded: false,
  favoriteIds: [] as string[],
  spoilers: false,
  lang: "fr" as Lang,
  revealedIds: [] as string[],
  standingsUnlockedOn: null as string | null,
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      ...empty,
      complete: (input) =>
        set({
          onboarded: true,
          favoriteIds: input.favoriteIds.slice(0, 5),
          spoilers: input.spoilers,
          lang: input.lang,
        }),
      setLang: (lang) => set({ lang }),
      setSpoilers: (spoilers) => set({ spoilers }),
      setFavorites: (ids) => set({ favoriteIds: ids.slice(0, 5) }),
      reveal: (gameId) =>
        set((state) =>
          state.revealedIds.includes(gameId)
            ? state
            : { revealedIds: [...state.revealedIds, gameId].slice(-200) },
        ),
      unlockStandings: (etDay) => set({ standingsUnlockedOn: etDay }),
      reset: () => set({ ...empty }),
    }),
    { name: "nba-pulse-prefs", version: 1, skipHydration: true },
  ),
);
