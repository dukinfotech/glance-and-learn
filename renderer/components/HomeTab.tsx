import { Button, Code, Spacer } from "@nextui-org/react";
import { useSettingStore } from "../stores/setting-store";
import DataTable from "./DataTable";
import { MESSAGES } from "../messages";

export default function HomeTab() {
  const selectedDB = useSettingStore((state) => state.selectedDB);

  return (
    <>
      <Code color="secondary">
        {selectedDB ? (
          `${MESSAGES.SELECTED_DB}${selectedDB}`
        ) : (
          <>
            {MESSAGES.NO_SELECTED_DB}
          </>
        )}
      </Code>

      <Spacer y={5} />

      {selectedDB && <DataTable />}
    </>
  );
}
