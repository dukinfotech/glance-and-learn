import { create } from "zustand";

// This type have to be same with "main"
interface SettingType {
  selectedDB: string;
  stickyWindow: {
    width: number;
    height: number;
    autoResize: boolean;
    fontSize: number;
    interval: number;
    isRandom: boolean;
    isBreakLine: boolean;
    splitedBy: string;
    bgColor: string;
    isFurigana: boolean;
  };
}

interface SettingStoreType extends SettingType {
  changeSelectedDB: (db: string) => void;
  loadSettings: (settings: unknown) => void;
  resetSettings: () => void;
  changeAutoResize: (autoResize: boolean) => void;
  changeFontSize: (size: number) => void;
  changeInterval: (seconds: number) => void;
  changeIsRandom: (isRandom: boolean) => void;
  changeIsBreakLine: (isBreakLine: boolean) => void;
  changeIsFurigana: (isFurigana: boolean) => void;
  changeSplitedBy: (str: string) => void;
  changeBgColor: (color: string) => void;
}

export const useSettingStore = create<SettingStoreType>((set) => ({
  selectedDB: "",
  stickyWindow: {
    width: null,
    height: null,
    autoResize: true,
    fontSize: 0,
    interval: 0,
    isRandom: false,
    isBreakLine: false,
    splitedBy: "🍠",
    bgColor: "#FFFFFF",
    isFurigana: false,
  },
  loadSettings: (settings: SettingType) => set(() => ({ ...settings })),
  resetSettings: async () => {
    localStorage.clear();
    const settings = await window.ipc.invoke("settings.reset");
    return set(() => ({ ...settings }));
  },
  changeSelectedDB: (dbName: string) =>
    set((state) => {
      window.ipc.send("settings.changed", { selectedDB: dbName });
      return { selectedDB: dbName };
    }),
  changeAutoResize: (autoResize: boolean) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: { ...state.stickyWindow, autoResize: autoResize },
      });
      return {
        stickyWindow: { ...state.stickyWindow, autoResize: autoResize },
      };
    }),
  changeFontSize: (size: number) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: {
          ...state.stickyWindow,
          fontSize: size,
        },
      });
      return {
        stickyWindow: {
          ...state.stickyWindow,
          fontSize: size,
        },
      };
    }),
  changeInterval: (seconds: number) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: {
          ...state.stickyWindow,
          interval: seconds * 1000,
        },
      });
      return {
        stickyWindow: {
          ...state.stickyWindow,
          interval: seconds * 1000,
        },
      };
    }),
  changeIsRandom: (isRandom: boolean) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: { ...state.stickyWindow, isRandom: isRandom },
      });
      return {
        stickyWindow: { ...state.stickyWindow, isRandom: isRandom },
      };
    }),
  changeIsBreakLine: (isBreakLine: boolean) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: { ...state.stickyWindow, isBreakLine: isBreakLine },
      });
      return {
        stickyWindow: { ...state.stickyWindow, isBreakLine: isBreakLine },
      };
    }),
  changeIsFurigana: (isFurigana: boolean) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: { ...state.stickyWindow, isFurigana: isFurigana },
      });
      return {
        stickyWindow: { ...state.stickyWindow, isFurigana: isFurigana },
      };
    }),
  changeSplitedBy: (str: string) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: { ...state.stickyWindow, splitedBy: str },
      });
      return {
        stickyWindow: { ...state.stickyWindow, splitedBy: str },
      };
    }),
  changeBgColor: (color: string) =>
    set((state) => {
      window.ipc.send("settings.changed", {
        stickyWindow: { ...state.stickyWindow, bgColor: color },
      });
      return {
        stickyWindow: { ...state.stickyWindow, bgColor: color },
      };
    }),
}));
