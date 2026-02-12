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
} from "@nextui-org/react";
import { useSettingStore } from "../stores/setting-store";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SHOWN_COLUMNS } from "../const";
import { useGlobalStore } from "../stores/global-store";
import useDataBase from "../hooks/useDatabase";
import { BsSearch } from "react-icons/bs";

type ColumnNameType = {
  key: string;
  name: string | null;
  sortable?: boolean;
};

import { MESSAGES } from "../messages";
import { PiTextTLight, PiTextTSlash } from "react-icons/pi";

const DEFAULT_COLUMN_NAMES = {
  ID: MESSAGES.COL_ID,
  REMEMBERED: MESSAGES.COL_REMEMBERED,
  CREATED_AT: MESSAGES.COL_CREATED_AT,
  PREFIX: MESSAGES.COL_PREFIX
}

export default function DataTable() {
  const { selectedDB } = useSettingStore();
  const { isShowSticky, toggleShowSticky } = useGlobalStore();
  const [data, setData] = useState<Array<any>>([]);
  const { listData, updateData } = useDataBase();
  const [keyword, setKeyword] = useState<string>("");
  const keywordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const columnNames = useMemo(() => {
    if (data.length > 0) {
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
          setData(_data);
        } catch (e) {
          console.error("Failed to list data", e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [keyword, selectedDB, listData]); // Added listData dependency

  // Shown columns
  useEffect(() => {
    let shownColumns: number[] = [];
    if (data.length > 0) {
      const firstDataObject = data[0];
      Object.keys(firstDataObject).forEach((key, i) => {
        // Skip id, isRemember, createdAt
        if (i > 1 && i !== Object.keys(firstDataObject).length - 1) {
          shownColumns.push(i - 1);
        }
      });
    }
    localStorage.setItem(SHOWN_COLUMNS, JSON.stringify(shownColumns));
  }, [data]);

  const toggleRemember = useCallback((id: number, isSelected: boolean) => {
    const isRemember = isSelected ? 1 : 0;
    updateData(selectedDB, id, { isRemember });

    // Optimistic update
    setData(prevData => prevData.map(item =>
      item.id === id ? { ...item, isRemember } : item
    ));

  }, [selectedDB, updateData]);

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
        classNames={{
          base: "max-h-[50vh] overflow-auto",
        }}
      >
        <TableHeader>
          {columnNames.map((columnName, i) => (
            <TableColumn key={columnName.key}>
              <>
                {columnName.name}
                {i > 1 && i < columnNames.length - 1 && (
                  <Checkbox
                    key={i}
                    className="ml-1"
                    title={MESSAGES.STICKY_CHECKBOX_TITLE}
                    defaultSelected
                    onChange={(e) =>
                      handleToggleShowInSticky(i - 1, e.target.checked)
                    }
                  />
                )}
              </>
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
              {columnNames.map((columnName) => (
                <TableCell key={columnName.key}>
                  {columnName.key !== "isRemember" ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: dataObject[columnName.key],
                      }}
                    ></span>
                  ) : (
                    <Checkbox
                      defaultSelected={dataObject[columnName.key] === 1}
                      onChange={(e) => toggleRemember(dataObject["id"], e.target.checked)}
                    />
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
