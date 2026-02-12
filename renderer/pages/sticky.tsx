import { RiDraggable } from "react-icons/ri";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSettingStore } from "../stores/setting-store";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { SHOWN_COLUMNS, STICKY_WINDOW_DEFAULT_FONTSIZE } from "../const";
import useDataBase from "../hooks/useDatabase";

// Define interface for data rows
interface DataRow {
  id: number;
  [key: string]: any;
}

export default function NextPage() {
  const [shownColumns, setShownColumns] = useState<number[]>([]);
  const { selectedDB, stickyWindow, loadSettings } = useSettingStore();
  const [data, setData] = useState<DataRow[]>([]);
  const { selectData } = useDataBase();

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
    let _shownColumns: number[] = [];
    try {
      const stored = localStorage.getItem(SHOWN_COLUMNS);
      if (stored) {
        _shownColumns = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse SHOWN_COLUMNS", e);
    } finally {
      setShownColumns(_shownColumns);
    }
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

    // Extract values, skipping specific keys if needed or based on index
    // The original logic relied on Object.values and index.
    // We should probably rely on key filtering if possible, but sticking to original logic for now
    // to avoid breaking behavior, just cleaning implementation.
    let arrayValues = Object.values(row);
    const id = arrayValues[0] as number; // Assuming first value is ID as per original code

    if (shownColumns && shownColumns.length > 0) {
      // The data source for sticky window (selectData) returns [id, col1, col2, ..., createdAt]
      // It EXCLUDES 'isRemember'.
      // index 0 is id, index 1 is col1 (what users see as "Cột 1"), etc.
      // localStorage (SHOWN_COLUMNS) stores indices relative to the main table where:
      // index 0 is id, index 1 is isRemember, index 2 is col1.
      // In DataTable.tsx, handleToggleShowInSticky(i - 1) is called where i starts from 2 for col1.
      // So col1 is stored as index 1.
      // In sticky.tsx, when we iterate over selectData results:
      // i=0 is id, i=1 is col1.
      // Thus, for col1, shownColumns.includes(1) should match.
      arrayValues = arrayValues.filter((_, i) => {
        return shownColumns.includes(i);
      });
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
        newLines.push(_text);
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

  }, [counter, data, shownColumns, stickyWindow]);

  // Update text when counter or data changes
  useEffect(() => {
    processText();
  }, [processText]);

  // Auto-resize window when content changes
  useEffect(() => {
    if (stickyWindow.autoResize && stickyWindowRef.current) {
      // We need to wait for render? React updates are fast.
      // Let's use a small timeout to ensure DOM is updated
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


  // Load settings
  useEffect(() => {
    window.ipc.invoke("stickyWindow.ready", true).then(() => {
      window.ipc.on("setting.load", (settings) => {
        loadSettings(settings);
      });
    });
  }, []);

  const randomCounter = (max: number) => {
    return Math.floor(Math.random() * max);
  };

  const startInterval = () => {
    // console.log("startInterval"); // Removed console log
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
    // console.log("pauseInterval"); // Removed console log
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
  }, [data.length, stickyWindow.interval, stickyWindow.isRandom]); // Added dependencies


  // Trigger for CSS only this page
  useEffect(() => {
    if (stickyWindow.fontSize > 0) {
      // Trigger for detect settings loaded
      const bodyTag = document.getElementsByTagName("body").item(0);
      if (bodyTag) {
        bodyTag.style.backgroundColor = stickyWindow.bgColor;
        bodyTag.classList.add("h-screen", "w-screen", "overflow-hidden"); // Added overflow-hidden to prevent scrollbars
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
        padding: "4px", // Added some padding
      }}
      onMouseEnter={pauseInterval}
      onMouseLeave={startInterval}
    >
      <RiDraggable className="draggable mr-2 flex-shrink-0" /> {/* Prevent icon shrinking */}
      <div id="sticky-content">
        {displayLines.map((line, index) => (
          <React.Fragment key={index}>
            <div dangerouslySetInnerHTML={{ __html: line }} />
            {index < displayLines.length - 1 && <hr className="border-gray-500 my-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
