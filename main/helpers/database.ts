import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { filesize } from "filesize";

const DATA_TABLE = "data";

const getDBFolder = () => {
  const databaseFolder = path.join(app.getPath("userData"), "databases");
  if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder);
  }

  return databaseFolder;
};

const getDBFilePath = (name: string) => {
  const dbFolder = getDBFolder();
  return path.join(dbFolder, `${name}.db`);
};

const createTable = (name: string, columnNames: Array<string>) => {
  const db = new Database(getDBFilePath(name), { verbose: console.info });

  let createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${DATA_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  `;

  columnNames.forEach((columnName, i) => {
    createTableSQL += `${columnName} ${
      columnName === "isRemember" ? "INTEGER,\n" : "TEXT,\n"
    }`;
  });

  createTableSQL += "createdAt DATE DEFAULT CURRENT_DATE);";

  console.debug(createTableSQL);

  db.exec(createTableSQL);

  db.close();
};

const insertDB = (
  name: string,
  columnNames: Array<string>,
  rows: Array<any>
) => {
  createTable(name, columnNames);

  const db = new Database(getDBFilePath(name), { verbose: console.info });

  const makeInsertBulkSQL = () => {
    let insertBulkSQL = `INSERT INTO ${DATA_TABLE} (`;

    columnNames.forEach((columnName, i) => {
      if (i < columnNames.length - 1) {
        insertBulkSQL += `${columnName}, `;
      } else {
        insertBulkSQL += `${columnName})`;
      }
    });

    insertBulkSQL += " VALUES (";

    columnNames.forEach((columnName, i) => {
      if (i < columnNames.length - 1) {
        insertBulkSQL += `@${columnName}, `;
      } else {
        insertBulkSQL += `@${columnName})`;
      }
    });

    console.debug(insertBulkSQL);    

    return insertBulkSQL;
  };

  const stmt = db.prepare(makeInsertBulkSQL());

  const insertMany = db.transaction((_rows) => {
    for (const _row of _rows) stmt.run(_row);
  });

  insertMany(rows);

  db.close();
};

const listDB = (isWithFileSize: boolean) => {
  const files = fs.readdirSync(getDBFolder());
  const dbFiles = files.filter((file) => file.endsWith(".db"));

  const databaseNames = dbFiles.map((dbFile) => {
    const dbName = dbFile.split(".db")[0];
    let dbSize = "";

    if (isWithFileSize) {
      const size = fs.statfsSync(getDBFilePath(dbName)).bsize;
      dbSize = filesize(size, { standard: "jedec" });
    }

    return {
      name: dbName,
      size: dbSize,
    };
  });

  return databaseNames;
};

const deleteDB = (name: string) => {
  fs.unlinkSync(getDBFilePath(name));
};

const listData = (name: string, keyword: string) => {
  const db = new Database(getDBFilePath(name), { verbose: console.info });
  console.debug(getDBFilePath(name));

  // Query to get all column names
  const columns = db.prepare(`PRAGMA table_info(${DATA_TABLE});`).all();

  // Extract column names
  const columnNames = columns
    .filter((col, i) => i > 1 && i !== columns.length - 1)
    .map((col: any, i) => col.name);

  // Construct dynamic SQL query
  const conditions = columnNames.map((col) => `${col} LIKE ?`).join(" OR ");
  const querySQL = conditions ? `SELECT * FROM ${DATA_TABLE} WHERE ${conditions}` : `SELECT * FROM ${DATA_TABLE}`;

  console.debug(querySQL);

  // Create parameter array
  const params = columnNames.map(() => `%${keyword}%`);

  // Execute the query
  const rows = db.prepare(querySQL).all(...params);

  db.close();

  return rows;
};

const updateData = (name: string, id: number, field: object) => {
  const db = new Database(getDBFilePath(name), { verbose: console.info });

  // Build the SET part of the query dynamically
  const setClause = Object.keys(field)
    .map((key) => `${key} = ?`)
    .join(", ");

  // Create the SQL UPDATE statement
  const updateSQL = `UPDATE ${DATA_TABLE} SET ${setClause} WHERE id = ?`;

  console.debug(updateSQL);

  // Prepare an update statement
  const update = db.prepare(updateSQL);

  // Execute the statement with values from the object `field` and the `id`
  const params = [...Object.values(field), id];

  update.run(...params);

  db.close();
};

const selectData = (name: string) => {
  const db = new Database(getDBFilePath(name), { verbose: console.info });

  // Query to get all column names
  const columns = db.prepare(`PRAGMA table_info(${DATA_TABLE});`).all();

  // Extract column names
  const columnNames = columns
    .filter((col, i) => i !== 1 && i !== columns.length - 1)
    .map((col: any, i) => col.name);

  // Create the SQL UPDATE statement
  const selectSQL = `SELECT ${columnNames.join(
    ","
  )} FROM ${DATA_TABLE} WHERE isRemember = 0`;

  // Prepare the query
  const stmt = db.prepare(selectSQL);

  // Execute the query and fetch all rows
  const rows = stmt.all();

  db.close();

  return rows;
};

export { listDB, insertDB, deleteDB, listData, updateData, selectData };
