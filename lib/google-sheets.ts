import "server-only";

import { google } from "googleapis";

type GoogleSheetColumn = {
  key: string;
  header: string;
};

type GoogleSheetRow = Record<string, unknown>;

const GOOGLE_SHEETS_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets";

function getGoogleSheetsConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable.",
    );
  }

  if (!privateKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable.",
    );
  }

  if (!spreadsheetId) {
    throw new Error(
      "Missing GOOGLE_SHEETS_SPREADSHEET_ID environment variable.",
    );
  }

  const normalizedPrivateKey = privateKey
  .replace(/^"/, "")
  .replace(/"$/, "")
  .replace(/\\n/g, "\n")
  .replace(/\r\n/g, "\n")
  .trim();

return {
  email,
  privateKey: normalizedPrivateKey,
  spreadsheetId,
};
}

function toGoogleSheetValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export async function writeRowsToGoogleSheet({
  sheetName,
  columns,
  rows,
}: {
  sheetName: string;
  columns: readonly GoogleSheetColumn[];
  rows: readonly GoogleSheetRow[];
}) {
  const { email, privateKey, spreadsheetId } =
    getGoogleSheetsConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: [GOOGLE_SHEETS_SCOPE],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  const existingSheet = spreadsheet.data.sheets?.find(
    (sheet) => sheet.properties?.title === sheetName,
  );

  if (!existingSheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  }

  const values = [
    columns.map((column) => column.header),
    ...rows.map((row) =>
      columns.map((column) =>
        toGoogleSheetValue(row[column.key]),
      ),
    ),
  ];

  const range = `${quoteSheetName(sheetName)}!A1`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  return {
    spreadsheetId,
    sheetName,
  };
}