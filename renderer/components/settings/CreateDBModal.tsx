import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  Spacer,
} from "@nextui-org/react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import readDataFromExcel from "../../helpers/readDataFromExcel";
import { toast } from "react-toastify";
import useDataBase from "../../hooks/useDatabase";
import { DBType } from "../SettingsTab";
import { MESSAGES } from "../../messages";

export type DataSetType = {
  name: string;
  file: File | null;
  rowFrom: number;
  rowTo: number;
  columnFrom: number;
  columnTo: number;
  sheetName: string;
};

const defaultDataSet: DataSetType = {
  name: "",
  file: null,
  rowFrom: 1,
  rowTo: 1,
  columnFrom: 1,
  columnTo: 1,
  sheetName: "",
};

interface CreateDBModalProps {
  onClose: () => void;
}

export default function CreateDBModal({ onClose }: CreateDBModalProps) {
  const { insertDB, listDB, logError } = useDataBase();
  const [databases, setDatabases] = useState<DBType[]>([]);
  const [dataSet, setDataSet] = useState<DataSetType>(defaultDataSet);

  const isNameExist = useMemo(() => {
    const matchedIndex = databases.findIndex(
      (database) => database.name === dataSet.name
    );
    return matchedIndex >= 0;
  }, [databases, dataSet.name]);

  const isFormValid = useMemo(() => {
    return (
      dataSet.name &&
      !isNameExist &&
      dataSet.file &&
      dataSet.columnFrom >= 1 &&
      dataSet.columnTo >= 1 &&
      dataSet.columnTo >= dataSet.columnFrom &&
      dataSet.rowFrom >= 1 &&
      dataSet.rowTo >= 1 &&
      dataSet.rowTo >= dataSet.rowFrom &&
      dataSet.sheetName
    );
  }, [dataSet]);

  const fetchListDB = async () => {
    const _databases = await listDB(false);
    setDatabases(_databases);
  };

  useEffect(() => {
    fetchListDB();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files.length > 0) {
      setDataSet({ ...dataSet, file: files[0] });
    }
  };

  const handleSubmit = async () => {
    try {
      const { columnNames, data } = await readDataFromExcel(dataSet);
      await insertDB(dataSet.name, columnNames, data);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
      logError(error);
    }
  };

  return (
    <Modal
      size="md"
      placement="center"
      isDismissable={false}
      isOpen
      onClose={onClose}
      hideCloseButton
    >
      <ModalContent>
        <ModalBody className="pt-5 pb-5">
          <Input
            label={MESSAGES.DB_NAME}
            isInvalid={isNameExist}
            errorMessage={MESSAGES.DB_NAME_EXIST}
            isRequired
            isClearable
            variant="flat"
            value={dataSet.name}
            onValueChange={(value) => setDataSet({ ...dataSet, name: value })}
          />

          <Input
            label={MESSAGES.EXCEL_FILE}
            isRequired
            type="file"
            accept=".xlsx,.xls"
            variant="flat"
            value={null}
            onChange={(e) => handleFileChange(e)}
          />

          <Input
            isRequired
            label="Sheet Name"
            type="text"
            value={dataSet.sheetName}
            onValueChange={(value) =>
              setDataSet({ ...dataSet, sheetName: value })
            }
            variant="flat"
          />

          <div className="flex">
            <Input
              isRequired
              label={MESSAGES.FROM_ROW}
              type="number"
              min={1}
              value={dataSet.rowFrom.toString()}
              onValueChange={(value) =>
                setDataSet({ ...dataSet, rowFrom: parseInt(value) })
              }
              variant="flat"
            />
            <Spacer x={2} />
            <Input
              isRequired
              label={MESSAGES.TO_ROW}
              type="number"
              min={1}
              value={dataSet.rowTo.toString()}
              onValueChange={(value) =>
                setDataSet({ ...dataSet, rowTo: parseInt(value) })
              }
              variant="flat"
            />
          </div>

          <div className="flex">
            <Input
              isRequired
              label={MESSAGES.FROM_COLUMN}
              type="number"
              min={1}
              value={dataSet.columnFrom.toString()}
              onValueChange={(value) =>
                setDataSet({ ...dataSet, columnFrom: parseInt(value) })
              }
              variant="flat"
            />
            <Spacer x={2} />
            <Input
              isRequired
              label={MESSAGES.TO_COLUMN}
              type="number"
              min={1}
              value={dataSet.columnTo.toString()}
              onValueChange={(value) =>
                setDataSet({ ...dataSet, columnTo: parseInt(value) })
              }
              variant="flat"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            color="primary"
            onPress={handleSubmit}
            isDisabled={!isFormValid}
          >
            {MESSAGES.CREATE_DB}
          </Button>
          <Button size="sm" color="danger" onPress={onClose}>
            {MESSAGES.CLOSE}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
