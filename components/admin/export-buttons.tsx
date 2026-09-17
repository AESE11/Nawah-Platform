"use client";

import { useState } from "react";

type ExportButtonsProps = {
  endpoint: string;
  googleSheetsEndpoint?: string;
  labels?: {
    excel?: string;
    csv?: string;
    googleSheets?: string;
  };
};

export function ExportButtons({
  endpoint,
  googleSheetsEndpoint,
  labels = {},
}: ExportButtonsProps) {
  const [loading, setLoading] = useState<
    "xlsx" | "csv" | "google-sheets" | null
  >(null);

  async function handleExport(format: "xlsx" | "csv") {
    try {
      setLoading(format);

      const separator = endpoint.includes("?") ? "&" : "?";
      const response = await fetch(
        `${endpoint}${separator}format=${format}`,
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;

      const contentDisposition = response.headers.get(
        "Content-Disposition",
      );

      const filenameMatch = contentDisposition?.match(
        /filename="([^"]+)"/,
      );

      link.download =
        filenameMatch?.[1] ?? `export.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      window.alert("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleSheetsExport() {
    if (!googleSheetsEndpoint) {
      return;
    }

    try {
      setLoading("google-sheets");

      const response = await fetch(googleSheetsEndpoint);

      if (!response.ok) {
        throw new Error("Google Sheets export failed");
      }

      window.alert("Students exported to Google Sheets successfully.");
    } catch {
      window.alert(
        "Google Sheets export failed. Please try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleExport("xlsx")}
        disabled={loading !== null}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "xlsx"
          ? "Exporting..."
          : labels.excel ?? "Excel"}
      </button>

      <button
        type="button"
        onClick={() => handleExport("csv")}
        disabled={loading !== null}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "csv"
          ? "Exporting..."
          : labels.csv ?? "CSV"}
      </button>

      {googleSheetsEndpoint ? (
        <button
          type="button"
          onClick={handleGoogleSheetsExport}
          disabled={loading !== null}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "google-sheets"
            ? "Exporting..."
            : labels.googleSheets ?? "Google Sheets"}
        </button>
      ) : null}
    </div>
  );
}