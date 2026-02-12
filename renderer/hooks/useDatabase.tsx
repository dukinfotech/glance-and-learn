import { toast } from "react-toastify";
import { useCallback } from "react";
import { MESSAGES } from "../messages";

const useDataBase = () => {
  const insertDB = useCallback(async (
    name: string,
    columnNames: Array<string>,
    data: Array<any>
  ) => {
    try {
      await window.ipc.invoke("database.insert-data", {
        name,
        columnNames,
        data,
      });
      toast.success(MESSAGES.CREATE_DB_SUCCESS);
    } catch (error) {
      toast.error(MESSAGES.CREATE_DB_FAIL);
      console.error(error);
    }
  }, []);

  const listDB = useCallback(async (isWithFileSize: boolean) => {
    try {
      const databaseNames = await window.ipc.invoke("database.list", {
        isWithFileSize: isWithFileSize,
      });
      return databaseNames;
    } catch (error) {
      toast.error(MESSAGES.LIST_DB_FAIL);
      console.error(error);
    }
  }, []);

  const deleteDB = useCallback(async (dbName: string) => {
    try {
      await window.ipc.invoke("database.delete", { name: dbName });
      toast.success(MESSAGES.DELETE_DB_SUCCESS);
    } catch (error) {
      toast.error(MESSAGES.DELETE_DB_FAIL);
      console.error(error);
    }
  }, []);

  const listData = useCallback(async (dbName: string, keyword: string) => {
    try {
      const data = await window.ipc.invoke("database.list-data", {
        name: dbName,
        keyword,
      });
      // toast.success(MESSAGES.LOAD_DATA_SUCCESS); // Removed to prevent spam
      return data;
    } catch (error) {
      toast.error(MESSAGES.LOAD_DATA_FAIL);
      console.error(error);
    }
  }, []);

  const updateData = useCallback(async (dbName: string, id: number, field: object) => {
    try {
      await window.ipc.invoke("database.update-data", {
        name: dbName,
        id,
        field,
      });
      toast.success(MESSAGES.UPDATE_DATA_SUCCESS);
    } catch (error) {
      toast.error(MESSAGES.UPDATE_DATA_FAIL);
      console.error(error);
    }
  }, []);

  const selectData = useCallback(async (dbName: string) => {
    try {
      const data = await window.ipc.invoke("database.select-data", {
        name: dbName,
      });
      return data;
    } catch (error) {
      toast.error(MESSAGES.UPDATE_DATA_FAIL);
      console.error(error);
    }
  }, []);

  return { listDB, insertDB, deleteDB, listData, updateData, selectData };
};

export default useDataBase;
