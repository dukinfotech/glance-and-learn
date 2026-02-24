import { RiDraggable } from "react-icons/ri";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSettingStore } from "../stores/setting-store";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { COLUMN_SETTINGS, STICKY_WINDOW_DEFAULT_FONTSIZE } from "../const";
import useDataBase from "../hooks/useDatabase";
import Say, { Composer } from "react-say";


interface DataRow {
  id: number;
  [key: string]: any;
}

type ColumnSettingsType = {
  index: number;
  isShown: boolean;
  isSpeech: boolean;
  voiceName: string;
}

const stripHtml = (html: string) => {
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function NextPage() {
  const { selectedDB, stickyWindow, loadSettings } = useSettingStore();
  const [data, setData] = useState<DataRow[]>([]);
  const { selectData } = useDataBase();

  const [speechText, setSpeechText] = useState<string>("");
  const [columnSettings, setColumnSettings] = useState<ColumnSettingsType[]>([]);
  const [showSpeech, setShowSpeech] = useState<boolean>(true);

  interface SpeechTask {
    text: string;
    voiceURI: string | undefined;
  }
  const [speechTasks, setSpeechTasks] = useState<SpeechTask[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  // State for the current text to display
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const stickyWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDB) {
      (async () => {
        const _data = await selectData(selectedDB);
        setData(_data);
      })();
    }
  }, [selectedDB]);

  // Kuroshiro instance
  const kuroshiroRef = useRef<Kuroshiro | null>(null);

  const [counter, setCounter] = useState<number>(0);
  const interval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLUMN_SETTINGS);
      if (stored) {
        setColumnSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse column settings", e);
    }

    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Initialize Kuroshiro once
  useEffect(() => {
    const initKuroshiro = async () => {
      if (!kuroshiroRef.current) {
        try {
          const kuroshiro = new Kuroshiro();
          await kuroshiro.init(new KuromojiAnalyzer({ dictPath: "/sticky/kuromoji/dict" }));
          kuroshiroRef.current = kuroshiro;
        } catch (err) {
          console.error("Failed to initialize Kuroshiro", err);
        }
      }
    };
    initKuroshiro();
  }, [])


  const processText = useCallback(async () => {
    if (data.length === 0) return;

    const row = data[counter];
    if (!row) return;

    // Extract values
    let arrayValues = Object.values(row);
    const id = arrayValues[0] as number;

    const shownSettings = columnSettings.filter(s => s.isShown);
    if (shownSettings.length > 0) {
      const allValues = Object.values(row);
      arrayValues = shownSettings.map(s => allValues[s.index]);
    }

    let newLines: string[] = [];

    if (stickyWindow.isBreakLine) {
      for (const value of arrayValues) {
        let _text = String(value);
        if (stickyWindow.isFurigana && kuroshiroRef.current) {
          try {
            _text = await kuroshiroRef.current.convert(_text, {
              mode: "furigana",
              to: "hiragana",
            });
          } catch (e) {
            console.error("Furigana conversion failed", e);
          }
        }
        if (_text.trim() !== "") {
          newLines.push(_text);
        }
      }
    } else {
      let _text = `${id}. ` + arrayValues.join(stickyWindow.splitedBy);
      if (stickyWindow.isFurigana && kuroshiroRef.current) {
        try {
          _text = await kuroshiroRef.current.convert(_text, {
            mode: "furigana",
            to: "hiragana",
          });
        } catch (e) {
          console.error("Furigana conversion failed", e);
        }
      }
      newLines = [_text];
    }

    setDisplayLines(newLines);

    // Prepare speech tasks
    const speechEnabledSettings = columnSettings.filter(s => s.isShown && s.isSpeech);
    if (speechEnabledSettings.length > 0) {
      const allValues = Object.values(row);
      const tasks: SpeechTask[] = speechEnabledSettings
        .filter(s => allValues[s.index] && String(allValues[s.index]).trim() !== "")
        .map(s => ({
          text: stripHtml(String(allValues[s.index])),
          voiceURI: s.voiceName
        }));

      console.log("Generated speechTasks:", tasks);

      // Briefly hide speech to force remount
      setShowSpeech(false);
      setSpeechTasks(tasks);
      // For legacy text-based cancel effect
      setSpeechText(tasks.map(t => t.text).join(". "));

      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      setTimeout(() => setShowSpeech(true), 50);
    } else {
      console.log("No speech columns enabled");
      setSpeechTasks([]);
      setSpeechText("");
    }
  }, [counter, data, columnSettings, stickyWindow]);

  // Update text when counter or data changes
  useEffect(() => {
    processText();
  }, [processText]);

  // Auto-resize window when content changes
  useEffect(() => {
    if (stickyWindow.autoResize && stickyWindowRef.current) {
      const timer = setTimeout(async () => {
        if (stickyWindowRef.current) {
          const width = stickyWindowRef.current.clientWidth + STICKY_WINDOW_DEFAULT_FONTSIZE;
          const height = stickyWindowRef.current.clientHeight;
          try {
            await window.ipc.invoke("stickyWindow.resize", { width, height });
          } catch (e) {
            console.error("Failed to resize sticky window", e);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayLines, stickyWindow.autoResize]);

  const ponyfill = useMemo(() => {
    if (typeof window === "undefined") return null;
    return {
      speechSynthesis: window.speechSynthesis,
      SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
    };
  }, []);

  useEffect(() => {
    if (speechText) {
      console.log("speechText changed to:", speechText);
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    }
  }, [speechText]);


  // Load settings
  useEffect(() => {
    window.ipc.invoke("stickyWindow.ready", true).then(() => {
      window.ipc.on("setting.load", (settings) => {
        loadSettings(settings);
      });
    });
    setHasMounted(true);
  }, []);

  const randomCounter = (max: number) => {
    return Math.floor(Math.random() * max);
  };

  const startInterval = () => {
    if (interval.current) clearInterval(interval.current);

    interval.current = setInterval(() => {
      if (stickyWindow.isRandom) {
        const _randomCounter = randomCounter(data.length);
        setCounter(_randomCounter);
      } else {
        setCounter((prevCounter) =>
          prevCounter >= data.length - 1 ? 0 : prevCounter + 1
        );
      }
    }, stickyWindow.interval);
  };

  const pauseInterval = () => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  };

  // Run interval
  useEffect(() => {
    if (data.length > 0) {
      startInterval();
      return () => pauseInterval();
    }
  }, [data.length, stickyWindow.interval, stickyWindow.isRandom]);


  // Trigger for CSS only this page
  useEffect(() => {
    if (stickyWindow.fontSize > 0) {
      const bodyTag = document.getElementsByTagName("body").item(0);
      if (bodyTag) {
        bodyTag.style.backgroundColor = stickyWindow.bgColor;
        bodyTag.classList.add("h-screen", "w-screen", "overflow-hidden");
      }

      const nextRoot = document.getElementById("__next");
      if (nextRoot) {
        nextRoot.classList.add("h-full", "flex", "items-center");
      }
    }
  }, [stickyWindow]);

  return (
    <div
      id="sticky-window"
      ref={stickyWindowRef}
      className="flex items-center"
      style={{
        whiteSpace: "nowrap",
        fontSize: `${stickyWindow.fontSize}px`,
        padding: "4px",
      }}
      onMouseEnter={pauseInterval}
      onMouseLeave={startInterval}
    >
      <RiDraggable className="draggable mr-2 flex-shrink-0" />
      <div id="sticky-content">
        {displayLines.map((line, index) => (
          <React.Fragment key={index}>
            <div dangerouslySetInnerHTML={{ __html: line }} />
            {index < displayLines.length - 1 && <hr className="border-gray-300 my-1" />}
          </React.Fragment>
        ))}
      </div>
      {hasMounted && (
        <Composer ponyfill={ponyfill}>
          {showSpeech && speechTasks.length > 0 && speechTasks.map((task, idx) => {
            const voice = task.voiceURI ? voices.find(v => v.voiceURI === task.voiceURI) : voices[0];
            return (
              <Say
                ponyfill={ponyfill}
                key={`${counter}-${idx}-${task.text}`}
                text={task.text}
                voice={voice}
                pitch={stickyWindow.pitch ?? 1}
                rate={stickyWindow.rate ?? 1}
              />
            );
          })}
        </Composer>
      )}
    </div>
  );
}
