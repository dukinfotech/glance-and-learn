import {
  Button,
  Checkbox,
  Input,
  Spacer,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Select,
  SelectItem,
} from "@nextui-org/react";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { useSettingStore } from "../stores/setting-store";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SHOWN_COLUMNS, SPEECH_COLUMNS, SPEECH_VOICES } from "../const";
import { useGlobalStore } from "../stores/global-store";
import useDataBase from "../hooks/useDatabase";
import { BsSearch } from "react-icons/bs";

type ColumnNameType = {
  key: string;
  name: string | null;
  sortable?: boolean;
};

import { MESSAGES } from "../messages";
import { PiTextTLight, PiTextTSlash, PiSpeakerHighLight, PiSpeakerSlashLight, PiEyeLight, PiEyeSlashLight } from "react-icons/pi";


const DEFAULT_COLUMN_NAMES = {
  ID: MESSAGES.COL_ID,
  REMEMBERED: MESSAGES.COL_REMEMBERED,
  CREATED_AT: MESSAGES.COL_CREATED_AT,
  PREFIX: MESSAGES.COL_PREFIX
}

const FuriganaCell = ({ text, kuroshiro, isFurigana }: { text: string, kuroshiro: Kuroshiro | null, isFurigana: boolean }) => {
  const [convertedText, setConvertedText] = useState(text);
  const { stickyWindow } = useSettingStore();

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // tìm tất cả phần tử có style
    (doc.querySelectorAll("[style]") as unknown as HTMLElement[]).forEach(el => {
      el.style.removeProperty("font-size");
    });

    const result = doc.body.innerHTML;

    if (isFurigana && kuroshiro && text) {
      kuroshiro.convert(result, { mode: "furigana", to: "hiragana" })
        .then(res => setConvertedText(res))
        .catch(err => {
          console.error("Furigana conversion failed", err);
          setConvertedText(result);
        });
    } else {
      setConvertedText(result);
    }
  }, [text, kuroshiro, isFurigana]);

  return <span
    style={{ fontSize: `${stickyWindow.fontSize}px` }}
    dangerouslySetInnerHTML={{ __html: convertedText }}
  ></span>;
};

export default function DataTable() {
  const { selectedDB, stickyWindow } = useSettingStore();
  const { isShowSticky, toggleShowSticky } = useGlobalStore();
  const [data, setData] = useState<Array<any>>([]);
  const { listData, updateData, logError } = useDataBase();
  const [keyword, setKeyword] = useState<string>("");
  const keywordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shownColumnsState, setShownColumnsState] = useState<number[]>([]);
  const [speechColumnsState, setSpeechColumnsState] = useState<number[]>([]);
  const [speechVoicesState, setSpeechVoicesState] = useState<{ [key: number]: string }>({});
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const kuroshiroRef = useRef<Kuroshiro | null>(null);

  // Initialize Kuroshiro once
  useEffect(() => {
    const initKuroshiro = async () => {
      if (!kuroshiroRef.current) {
        try {
          const kuroshiro = new Kuroshiro();
          await kuroshiro.init(new KuromojiAnalyzer({ dictPath: "/sticky/kuromoji/dict" }));
          kuroshiroRef.current = kuroshiro;
          // Trigger a re-render once kuroshiro is ready if furigana is enabled
          if (stickyWindow.isFurigana) {
            setData(prev => [...prev]);
          }
        } catch (err) {
          console.error("Failed to initialize Kuroshiro", err);
        }
      }
    };
    initKuroshiro();
  }, [stickyWindow.isFurigana]);

  useEffect(() => {
    try {
      const storedShown = localStorage.getItem(SHOWN_COLUMNS);
      if (storedShown) setShownColumnsState(JSON.parse(storedShown));
      const storedSpeech = localStorage.getItem(SPEECH_COLUMNS);
      if (storedSpeech) setSpeechColumnsState(JSON.parse(storedSpeech));
      const storedVoices = localStorage.getItem(SPEECH_VOICES);
      if (storedVoices) setSpeechVoicesState(JSON.parse(storedVoices));
    } catch (e) {
      console.error("Failed to load columns from localStorage", e);
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

  const columnNames = useMemo(() => {
    if (data && data.length > 0) {
      let _columnNames: ColumnNameType[] = [];
      const firstRow = data[0];

      Object.keys(firstRow).forEach((key) => {
        let columnName: ColumnNameType = {
          key,
          name: null,
        };
        _columnNames.push(columnName);
      });

      // Convert to Vietnamese names
      return _columnNames.map((_columnName, i) => {
        const newCol = { ..._columnName };
        switch (i) {
          case 0:
            newCol.name = DEFAULT_COLUMN_NAMES.ID;
            break;
          case 1:
            newCol.name = DEFAULT_COLUMN_NAMES.REMEMBERED;
            break;
          case _columnNames.length - 1:
            newCol.name = DEFAULT_COLUMN_NAMES.CREATED_AT;
            break;
          default:
            newCol.name = `${DEFAULT_COLUMN_NAMES.PREFIX} ${i - 1}`;
            break;
        }
        return newCol;
      });
    } else {
      return [{ key: "default", name: null }];
    }
  }, [data]);

  useEffect(() => {
    if (selectedDB) {
      (async () => {
        setIsLoading(true);
        // Add minimal error handling
        try {
          const _data = await listData(selectedDB, keyword);
          // console.log(_data); // Removed console log

          if (stickyWindow.isRandom) {
            _data.sort(() => Math.random() - 0.5);
          }

          setData(_data);
        } catch (e) {
          console.error("Failed to list data", e);
          logError(e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [keyword, selectedDB, listData]); // Added listData dependency

  // Shown columns
  useEffect(() => {
    let shownColumns: number[] = [];
    if (data && data.length > 0) {
      const firstDataObject = data[0];
      Object.keys(firstDataObject).forEach((key, i) => {
        // Skip id, isRemember, createdAt
        if (i > 1 && i !== Object.keys(firstDataObject).length - 1) {
          shownColumns.push(i - 1);
        }
      });
    }
    localStorage.setItem(SHOWN_COLUMNS, JSON.stringify(shownColumns));
    setShownColumnsState(shownColumns);

    // Only initialize if not exists to avoid overwriting user selection
    const storedSpeech = localStorage.getItem(SPEECH_COLUMNS);
    if (!storedSpeech) {
      let speechColumns: number[] = [];
      if (data && data.length > 0) {
        const firstDataObject = data[0];
        Object.keys(firstDataObject).forEach((key, i) => {
          // Skip id, isRemember, createdAt
          if (i > 1 && i !== Object.keys(firstDataObject).length - 1) {
            speechColumns.push(i - 1);
          }
        });
      }
      localStorage.setItem(SPEECH_COLUMNS, JSON.stringify(speechColumns));
      setSpeechColumnsState(speechColumns);
    }
  }, [data]);

  const toggleRemember = useCallback((id: number, isSelected: boolean) => {
    const isRemember = isSelected ? 1 : 0;
    updateData(selectedDB, id, { isRemember });

    // Optimistic update
    setData(prevData => prevData.map(item =>
      item.id === id ? { ...item, isRemember } : item
    ));

  }, [selectedDB, updateData]);

  const handleSpeak = useCallback((text: string, columnIndex: number) => {
    if (!text) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Strip HTML tags
    const cleanText = text.replace(/<[^>]*>?/gm, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Find assigned voice
    const requestedVoiceURI = speechVoicesState[columnIndex];
    if (requestedVoiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === requestedVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }, [speechVoicesState, voices]);

  const reloadSticky = useCallback(() => {
    // Logic for reloading sticky window seems a bit hacky (toggle twice),
    // keeping it but maybe we should find a better way if possible.
    // For now, encapsulating in try-catch if needed, but simple function calls are fine.
    if (isShowSticky) {
      toggleShowSticky();
      setTimeout(toggleShowSticky, 100); // Add small delay to ensure update
    }
  }, [isShowSticky, toggleShowSticky]);


  const handleToggleShowInSticky = useCallback((i: number, isShow: boolean) => {
    let shownColumns: number[] = [];
    try {
      const stored = localStorage.getItem(SHOWN_COLUMNS);
      if (stored) shownColumns = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse SHOWN_COLUMNS", e);
    }

    if (isShow) {
      if (!shownColumns.includes(i)) {
        shownColumns.push(i);
      }
    } else {
      shownColumns = shownColumns.filter((shownColumn) => shownColumn !== i);
    }
    localStorage.setItem(SHOWN_COLUMNS, JSON.stringify(shownColumns));
    setShownColumnsState(shownColumns);
    reloadSticky();
  }, [reloadSticky]);

  const handleToggleSpeechInSticky = useCallback((i: number, isSpeech: boolean) => {
    let speechColumns: number[] = [];
    try {
      const stored = localStorage.getItem(SPEECH_COLUMNS);
      if (stored) speechColumns = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse SPEECH_COLUMNS", e);
    }

    if (isSpeech) {
      if (!speechColumns.includes(i)) {
        speechColumns.push(i);
      }

      // Default select first voice if none set
      const storedVoices = localStorage.getItem(SPEECH_VOICES);
      let speechVoices = {};
      try {
        if (storedVoices) speechVoices = JSON.parse(storedVoices);
      } catch (e) {
        console.error("Failed to parse SPEECH_VOICES", e);
      }

      if (!speechVoices[i]) {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          speechVoices[i] = availableVoices[0].voiceURI;
          localStorage.setItem(SPEECH_VOICES, JSON.stringify(speechVoices));
          setSpeechVoicesState(speechVoices);
        }
      }
    } else {
      speechColumns = speechColumns.filter((speechColumn) => speechColumn !== i);
    }
    localStorage.setItem(SPEECH_COLUMNS, JSON.stringify(speechColumns));
    setSpeechColumnsState(speechColumns);
    reloadSticky();
  }, [reloadSticky]);

  const handleVoiceChange = useCallback((i: number, voiceURI: string) => {
    let speechVoices: { [key: number]: string } = {};
    try {
      const stored = localStorage.getItem(SPEECH_VOICES);
      if (stored) speechVoices = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse SPEECH_VOICES", e);
    }

    speechVoices[i] = voiceURI;
    localStorage.setItem(SPEECH_VOICES, JSON.stringify(speechVoices));
    setSpeechVoicesState(speechVoices);
    reloadSticky();
  }, [reloadSticky]);


  const handleChangeKeyword = () => {
    if (keywordRef.current) {
      const _keyword = keywordRef.current.value;
      setKeyword(_keyword);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleChangeKeyword();
    }
  }

  const formatVoiceName = (name: string, lang: string) => {
    let cleanName = name.replace(/^Microsoft /, "").replace(/ Online \(Natural\) - .*/, "").replace(/ - .*/, "");
    return `${cleanName} (${lang})`;
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Input
            ref={keywordRef}
            placeholder={MESSAGES.SEARCH_PLACEHOLDER}
            className="max-w-[220px]"
            isClearable
            onKeyDown={handleKeyDown}
            onClear={() => setKeyword("")}
          />
          <Spacer y={2} />
          <Button isIconOnly color="primary" onPress={handleChangeKeyword}>
            <BsSearch />
          </Button>
        </div>
        <div>
          <Button color="danger" onClick={toggleShowSticky}>
            {isShowSticky ? (
              <>
                <PiTextTSlash />
                {MESSAGES.HIDE_STICKY}
              </>
            ) : (
              <>
                <PiTextTLight />
                {MESSAGES.SHOW_STICKY}
              </>
            )}
          </Button>
        </div>
      </div>
      <Spacer y={5} />
      <Table
        hideHeader={data.length === 0}
        isHeaderSticky
        selectionMode="single"
        color="primary"
        classNames={{
          base: "max-h-[50vh] overflow-auto border-small border-divider rounded-medium",
          table: "border-collapse",
          th: "border-b border-r border-divider last:border-r-0",
          td: "border-b border-r border-divider last:border-r-0",
          tr: "hover:bg-default-100 cursor-pointer",
        }}
      >
        <TableHeader>
          {columnNames.map((columnName, i) => (
            <TableColumn
              key={columnName.key}
              style={{
                minWidth: (i > 1 && i < columnNames.length - 1) ? "250px" : "auto",
              }}
              className={columnName.key === "isRemember" ? "align-top text-center" : "align-top"}
            >
              <div className={`flex flex-col gap-2 py-2 h-full ${columnName.key === "isRemember" ? "items-center" : "justify-start"}`}>
                <div className="flex items-center gap-1 min-h-[32px]">
                  <span className="font-bold">{columnName.name}</span>
                  {i > 1 && i < columnNames.length - 1 && (
                    <div className="inline-flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="min-w-6 w-6 h-6"
                        title={MESSAGES.STICKY_CHECKBOX_TITLE}
                        onClick={() =>
                          handleToggleShowInSticky(i - 1, !shownColumnsState.includes(i - 1))
                        }
                      >
                        {shownColumnsState.includes(i - 1) ? (
                          <PiEyeLight className="text-primary text-base" />
                        ) : (
                          <PiEyeSlashLight className="text-gray-400 text-base" />
                        )}
                      </Button>

                      {shownColumnsState.includes(i - 1) && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-6 w-6 h-6"
                          title={MESSAGES.SPEECH_CHECKBOX_TITLE}
                          onClick={() =>
                            handleToggleSpeechInSticky(i - 1, !speechColumnsState.includes(i - 1))
                          }
                        >
                          {speechColumnsState.includes(i - 1) ? (
                            <PiSpeakerHighLight className="text-primary text-base" />
                          ) : (
                            <PiSpeakerSlashLight className="text-gray-400 text-base" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {i > 1 && i < columnNames.length - 1 && speechColumnsState.includes(i - 1) && voices.length > 0 && (
                  <Select
                    size="sm"
                    aria-label="Select voice"
                    placeholder="Voice"
                    className="w-full min-w-[120px]"
                    selectedKeys={speechVoicesState[i - 1] ? [speechVoicesState[i - 1]] : []}
                    onSelectionChange={(keys) => {
                      const voiceURI = Array.from(keys)[0] as string;
                      if (voiceURI) handleVoiceChange(i - 1, voiceURI);
                    }}
                  >
                    {voices.map((voice) => (
                      <SelectItem key={voice.voiceURI} textValue={formatVoiceName(voice.name, voice.lang)}>
                        {formatVoiceName(voice.name, voice.lang)}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody
          emptyContent="Không có dữ liệu"
          isLoading={isLoading}
          loadingContent={<Spinner label="Loading..." />}
        >
          {data.map((dataObject, i) => (
            <TableRow key={i}>
              {columnNames.map((columnName, j) => (
                <TableCell key={columnName.key}>
                  {columnName.key !== "isRemember" ? (
                    <div className="flex items-center gap-2">
                      {j > 1 && j < columnNames.length - 1 && speechColumnsState.includes(j - 1) && dataObject[columnName.key] && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-6 w-6 h-6"
                          onPress={() => handleSpeak(dataObject[columnName.key], j - 1)}
                        >
                          <PiSpeakerHighLight className="text-primary text-base" />
                        </Button>
                      )}
                      <FuriganaCell
                        text={dataObject[columnName.key]}
                        kuroshiro={kuroshiroRef.current}
                        isFurigana={stickyWindow.isFurigana}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center w-full">
                      <Checkbox
                        defaultSelected={dataObject[columnName.key] === 1}
                        onChange={(e) => toggleRemember(dataObject["id"], e.target.checked)}
                      />
                    </div>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
