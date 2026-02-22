import fs from "fs";
import path from "path";
import { getDBFolder } from "./database";

/**
 * Logs an error to the log.txt file in the databases folder.
 * @param error The error to log, can be an Error object or a string.
 */
export const logError = (error: any) => {
    try {
        const dbFolder = getDBFolder();
        const logFilePath = path.join(dbFolder, "log.txt");
        const timestamp = new Date().toLocaleString();

        let errorMessage = "";
        if (error instanceof Error) {
            errorMessage = error.stack || error.message;
        } else if (typeof error === "object") {
            errorMessage = JSON.stringify(error, null, 2);
        } else {
            errorMessage = String(error);
        }

        const logEntry = `[${timestamp}] ERROR: ${errorMessage}\n${"-".repeat(50)}\n`;

        fs.appendFileSync(logFilePath, logEntry, "utf8");
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
};
