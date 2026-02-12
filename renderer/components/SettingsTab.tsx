import {
  Button,
  Input,
  Select,
  SelectItem,
  Spacer,
  Switch,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { MdSettingsSuggest } from "react-icons/md";
import CreateDBButton from "./settings/CreateDBButton";
import { useConfirmPrompt } from "../providers/ConfirmPromptProvider";
import { useSettingStore } from "../stores/setting-store";
import { useGlobalStore } from "../stores/global-store";
import { PiClockCountdown, PiSplitHorizontal } from "react-icons/pi";
import { BsDatabase, BsTrash3, BsFolder2Open } from "react-icons/bs";
import { toast } from "react-toastify";
import useDatabase from "../hooks/useDatabase";
import {
  STICKY_WINDOW_DEFAULT_FONTSIZE,
  STICKY_WINDOW_DEFAULT_INTERVAL,
} from "../const";
import { RiFontSize2 } from "react-icons/ri";
import BgColorPicker from "./settings/BgColorPicker";
import { MESSAGES } from "../messages";

export type DBType = {
  name: string;
  size: string;
};

export default function SettingsTab() {
  const [databases, setDatabases] = useState<DBType[]>([]);
  const {
    selectedDB,
    stickyWindow,
    changeIsBreakLine,
    changeAutoResize,
    changeIsRandom,
    changeFontSize,
    changeInterval,
    changeSelectedDB,
    changeSplitedBy,
    changeIsFurigana,
    changeBgColor,
    changePitch,
    changeRate,
    runOnStartup,
    changeRunOnStartup,
    resetSettings,
  } = useSettingStore();
  const [selectedDBKey, setSelectedDBKey] = useState(new Set([selectedDB]));
  const { listDB, deleteDB } = useDatabase();

  const { isShowSticky, toggleShowSticky } = useGlobalStore();
  const { show } = useConfirmPrompt();

  const fetchListDB = async () => {
    const _databases = await listDB(true);
    setDatabases(_databases);
  };

  useEffect(() => {
    fetchListDB();
  }, []);

  useEffect(() => {
    console.log(selectedDBKey);
    const value = selectedDBKey.values();
    const dbName = value.next().value as string;

    // Prevent update state on first render
    if (dbName !== selectedDB) {
      changeSelectedDB(dbName || null);
      reloadSticky();
    }
  }, [selectedDBKey]);

  const handleChangeFontSize = (size) => {
    changeFontSize(
      size < STICKY_WINDOW_DEFAULT_FONTSIZE
        ? STICKY_WINDOW_DEFAULT_FONTSIZE
        : size
    );
    reloadSticky();
  };

  const handleChangeInterval = (interval) => {
    changeInterval(
      interval < Math.floor(STICKY_WINDOW_DEFAULT_INTERVAL / 1000)
        ? Math.floor(STICKY_WINDOW_DEFAULT_INTERVAL / 1000)
        : interval
    );
    reloadSticky();
  };

  const handleChangeAutoResize = (autoResize: boolean) => {
    changeAutoResize(autoResize);
    reloadSticky();
  };

  const handleChangeIsRandom = (isSelected: boolean) => {
    changeIsRandom(isSelected);
    reloadSticky();
  };

  const handleChangeIsBreakLine = (isBreakLine: boolean) => {
    changeIsBreakLine(isBreakLine);
    reloadSticky();
  };

  const handleChangeIsFurigana = (isFurigana: boolean) => {
    changeIsFurigana(isFurigana);
    reloadSticky();
  };

  const reloadSticky = () => {
    if (isShowSticky) {
      toggleShowSticky();
      toggleShowSticky();
    }
  };

  const handleRestoreFactory = async () => {
    const isConfirmed = await show(MESSAGES.CONFIRM_RESTORE);
    if (isConfirmed) {
      resetSettings();
      setSelectedDBKey(new Set([]));
      reloadSticky();
      toast.success(MESSAGES.RESTORE_SUCCESS);
    }
  };

  const handleChangeSplitedBy = (str: string) => {
    changeSplitedBy(str);
    reloadSticky();
  };

  const handleDeleteDB = async (dbName: string) => {
    const isConfirmed = await show(MESSAGES.CONFIRM_DELETE_DB);
    if (isConfirmed) {
      await deleteDB(dbName);
      setSelectedDBKey(new Set([]));
      reloadSticky();
      fetchListDB();
    }
  };

  const handleChangeBgColor = (color: string) => {
    changeBgColor(color);
    reloadSticky();
  };

  const handleChangeRunOnStartup = (runOnStartup: boolean) => {
    changeRunOnStartup(runOnStartup);
  };

  const handleChangePitch = (pitch: string) => {
    changePitch(parseFloat(pitch));
    reloadSticky();
  };

  const handleChangeRate = (rate: string) => {
    changeRate(parseFloat(rate));
    reloadSticky();
  };

  const handleOpenDBFolder = () => {
    window.ipc.invoke("database.open-folder");
  };

  return (
    <>
      <div className="flex justify-end">
        <Button
          size="sm"
          color="danger"
          isIconOnly
          title={MESSAGES.RESTORE_FACTORY}
          onClick={handleRestoreFactory}
        >
          <MdSettingsSuggest />
        </Button>
      </div>

      <Spacer y={2} />

      <div className="flex flex-col mx-auto max-w-[50%]">
        <div className="flex justify-center">
          <Select
            startContent={<BsDatabase />}
            size="sm"
            color="primary"
            label={MESSAGES.DB_LABEL}
            selectedKeys={selectedDBKey}
            onSelectionChange={(e: any) => setSelectedDBKey(e)}
          >
            {databases.map((database) => (
              <SelectItem
                key={database.name}
                textValue={`${database.name} (${database.size})`}
                endContent={
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    onPress={() => handleDeleteDB(database.name)}
                  >
                    <BsTrash3 />
                  </Button>
                }
              >
                <div className="flex justify-between">
                  <div>{database.name}</div>
                  <div>{database.size}</div>
                </div>
              </SelectItem>
            ))}
          </Select>
          <Spacer x={1} />
          <CreateDBButton onClose={fetchListDB} />
          <Spacer x={1} />
          <Button
            size="lg"
            color="warning"
            isIconOnly
            title={MESSAGES.OPEN_DB_FOLDER}
            onClick={handleOpenDBFolder}
          >
            <BsFolder2Open />
          </Button>
        </div>

        <Spacer y={2} />

        <Input
          isRequired
          color="primary"
          startContent={<RiFontSize2 />}
          label={MESSAGES.FONT_SIZE}
          type="number"
          min={STICKY_WINDOW_DEFAULT_FONTSIZE}
          value={stickyWindow.fontSize.toString()}
          onValueChange={handleChangeFontSize}
          variant="flat"
        />

        <Spacer y={2} />

        <Input
          isRequired
          color="primary"
          startContent={<PiClockCountdown />}
          label={MESSAGES.INTERVAL}
          type="number"
          min={Math.floor(STICKY_WINDOW_DEFAULT_INTERVAL / 1000)}
          value={Math.floor(stickyWindow.interval / 1000).toString()}
          onValueChange={handleChangeInterval}
          variant="flat"
        />

        <Spacer y={2} />

        <Switch
          color="primary"
          size="md"
          isSelected={stickyWindow.autoResize}
          onValueChange={handleChangeAutoResize}
        >
          <div className="flex flex-col gap-1">
            <p className="text-medium">{MESSAGES.AUTO_RESIZE}</p>
          </div>
        </Switch>

        <Spacer y={2} />

        <Switch
          color="primary"
          size="md"
          isSelected={stickyWindow.isRandom}
          onValueChange={handleChangeIsRandom}
        >
          <div className="flex flex-col gap-1">
            <p className="text-medium">{MESSAGES.RANDOM}</p>
          </div>
        </Switch>

        <Spacer y={2} />

        <Switch
          color="primary"
          size="md"
          isSelected={stickyWindow.isFurigana}
          onValueChange={handleChangeIsFurigana}
        >
          <div className="flex flex-col gap-1">
            <p className="text-medium">{MESSAGES.FURIGANA}</p>
          </div>
        </Switch>

        <Spacer y={2} />

        <Switch
          color="primary"
          size="md"
          isSelected={stickyWindow.isBreakLine}
          onValueChange={handleChangeIsBreakLine}
        >
          <div className="flex flex-col gap-1">
            <p className="text-medium">{MESSAGES.BREAK_LINE}</p>
          </div>
        </Switch>

        <Spacer y={2} />

        <div className="flex gap-2">
          <Input
            color="primary"
            label={MESSAGES.SPEECH_PITCH}
            type="number"
            step={0.1}
            min={0}
            max={2}
            value={(stickyWindow.pitch ?? 1).toString()}
            onValueChange={handleChangePitch}
            variant="flat"
          />
          <Input
            color="primary"
            label={MESSAGES.SPEECH_RATE}
            type="number"
            step={0.1}
            min={0.1}
            max={10}
            value={(stickyWindow.rate ?? 1).toString()}
            onValueChange={handleChangeRate}
            variant="flat"
          />
        </div>

        <Spacer y={2} />

        {!stickyWindow.isBreakLine && (
          <Input
            color="primary"
            startContent={<PiSplitHorizontal />}
            label={MESSAGES.SPLIT_BY}
            value={stickyWindow.splitedBy}
            onValueChange={handleChangeSplitedBy}
            variant="flat"
          />
        )}

        <Spacer y={2} />

        <BgColorPicker
          bgColor={stickyWindow.bgColor}
          onChange={handleChangeBgColor}
        />

        <Spacer y={2} />

        <Switch
          color="primary"
          size="md"
          isSelected={runOnStartup}
          onValueChange={handleChangeRunOnStartup}
        >
          <div className="flex flex-col gap-1">
            <p className="text-medium">{MESSAGES.RUN_ON_STARTUP}</p>
          </div>
        </Switch>
      </div>
    </>
  );
}
