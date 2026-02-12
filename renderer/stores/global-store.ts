import { create } from "zustand";

interface GlobalType {
  isShowSticky: boolean;
  toggleShowSticky: () => void;
  hideSticky: () => void;
}

export const useGlobalStore = create<GlobalType>((set) => ({
  isShowSticky: false,
  toggleShowSticky: () =>
    set((state) => {
      window.ipc.send("stickyWindow.isShow", !state.isShowSticky);
      return { isShowSticky: !state.isShowSticky };
    }),
  hideSticky: () =>
    set((state) => {
      window.ipc.send("stickyWindow.isShow", false);
      return { isShowSticky: false };
    }),
}));
