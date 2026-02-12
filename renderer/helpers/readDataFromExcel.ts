import { DataSetType } from "../components/settings/CreateDBModal";
import * as Excel from "exceljs";

interface ProcessedData {
  columnNames: string[];
  data: Record<string, any>[];
}

export default async function readDataFromExcel(dataSet: DataSetType): Promise<ProcessedData> {
  try {
    const buffer = await readFile(dataSet.file);
    const workbook = new Excel.Workbook();

    const file = await workbook.xlsx.load(buffer);

    const worksheet = file.getWorksheet(dataSet.sheetNumber);
    if (!worksheet) {
      throw new Error(`Worksheet ${dataSet.sheetNumber} not found`);
    }

    const rows = worksheet.getRows(
      dataSet.rowFrom,
      dataSet.rowTo - dataSet.rowFrom + 1
    );

    if (!rows) {
      return { columnNames: [], data: [] };
    }

    const columnNames = ["isRemember"];
    const data: Record<string, any>[] = [];

    for (let i = dataSet.columnFrom; i <= dataSet.columnTo; i++) {
      columnNames.push(`column${i}`);
    }

    rows.forEach((row) => {
      try {
        const rowData: Record<string, any> = {};
        rowData["isRemember"] = 0;

        for (let i = dataSet.columnFrom; i <= dataSet.columnTo; i++) {
          const cell = row.getCell(i);
          let cellData = cell.value ? convertCellToHTML(cell) : "";
          rowData[`column${i}`] = cellData;
        }
        data.push(rowData);
      } catch (error) {
        console.error("Error processing row:", error);
      }
    });

    return { columnNames, data };
  } catch (error) {
    console.error("readDataFromExcel error:", error);
    throw error;
  }
}

const readFile = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as ArrayBuffer);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    }
  });
};

const convertCellToHTML = (cell: Excel.Cell) => {
  let html = "";
  const cellValue = cell.value;

  if (isCellRichTextValue(cellValue)) {
    const richText = cellValue.richText;

    richText.forEach((_text) => {
      let _html = "<span";
      if (_text.font) {
        const cssString = fontStylesToCSS(_text.font);
        if (cssString) {
          _html += ` style="${cssString.trim()}"`;
        }
      }
      _html += ">";
      // Safe access to text
      const textContent = _text.text || "";
      _html += textContent.replace(/\n/g, "<br/>");
      _html += "</span>";

      html += _html;
    });
  } else {
    let _html = "<span";
    if (cell.font) {
      const cssString = fontStylesToCSS(cell.font);
      if (cssString) {
        _html += ` style="${cssString.trim()}"`;
      }
    }
    _html += ">";

    const textContent = cell.text || "";
    _html += textContent.replace(/\n/g, "<br/>");
    _html += "</span>";

    html += _html;
  }

  return html;
};

const fontStylesToCSS = (fontStyle: Partial<Excel.Font>) => {
  let cssString = "";

  if (fontStyle.bold) cssString += "font-weight: bold; ";
  if (fontStyle.italic) cssString += "font-style: italic; ";
  if (fontStyle.size) cssString += `font-size: ${fontStyle.size}pt; `;
  if (fontStyle.color && fontStyle.color.argb)
    cssString += `color: #${fontStyle.color.argb.slice(2)}; `;

  return cssString;
};

// Define type guard
const isCellRichTextValue = (
  value: Excel.CellValue
): value is Excel.CellRichTextValue => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'richText' in value
  );
};
