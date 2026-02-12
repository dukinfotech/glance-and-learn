import { IpcHandler } from "../main/preload";

declare global {
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
}
