import ExcelJS from "exceljs";

export type ExportColumn<T> = {
  key: keyof T;
  header: string;
};

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text: string;

  if (value instanceof Date) {
    text = value.toISOString();
  } else {
    text = String(value);
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function generateCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: readonly ExportColumn<T>[],
): string {
  const headerRow = columns
    .map((column) => escapeCsvValue(column.header))
    .join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((column) => escapeCsvValue(row[column.key]))
      .join(","),
  );

  return `\uFEFF${[headerRow, ...dataRows].join("\r\n")}`;
}

export async function generateExcel<T extends Record<string, unknown>>(
  rows: T[],
  columns: readonly ExportColumn<T>[],
  sheetName = "Export",
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: String(column.key),
    width: Math.max(column.header.length + 2, 15),
  }));

  for (const row of rows) {
    worksheet.addRow(
      columns.reduce<Record<string, unknown>>((result, column) => {
        result[String(column.key)] = row[column.key];
        return result;
      }, {}),
    );
  }

  worksheet.getRow(1).font = { bold: true };

  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}