import Store from "electron-store";
import {
  STICKY_WINDOW_DEFAULT_FONTSIZE,
  STICKY_WINDOW_DEFAULT_HEIGHT,
  STICKY_WINDOW_DEFAULT_INTERVAL,
  STICKY_WINDOW_DEFAULT_WIDTH,
  STICKY_WINDOW_DEFAULT_PITCH,
  STICKY_WINDOW_DEFAULT_RATE,
  WINDOW_DEFAULT_HEIGHT,
  WINDOW_DEFAULT_WIDTH,
} from "../../renderer/const";

let isProd = process.env.NODE_ENV === "production";

const settings = new Store<SettingType>({
  name: "settings",
  defaults: {
    selectedDB: "",
    stickyWindow: {
      width: isProd ? STICKY_WINDOW_DEFAULT_WIDTH : WINDOW_DEFAULT_WIDTH,
      height: isProd ? STICKY_WINDOW_DEFAULT_HEIGHT : WINDOW_DEFAULT_HEIGHT,
      autoResize: true,
      fontSize: STICKY_WINDOW_DEFAULT_FONTSIZE,
      interval: STICKY_WINDOW_DEFAULT_INTERVAL,
      isRandom: false,
      isBreakLine: false,
      splitedBy: "🍠",
      bgColor: "#FFFFFF",
      isFurigana: false,
      pitch: STICKY_WINDOW_DEFAULT_PITCH,
      rate: STICKY_WINDOW_DEFAULT_RATE,
    },
    runOnStartup: true,
  },
  watch: true,
});

export { settings };
