import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  GitBranch,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

interface PipelinePageProps {
  onBack: () => void;
}

interface PipelineRow {
  id: string;
  imageUrl: string;
  prompt: string;
  status: "idle" | "running" | "done" | "error";
  outputUrl?: string;
  errorMsg?: string;
}

function createRow(): PipelineRow {
  return { id: crypto.randomUUID(), imageUrl: "", prompt: "", status: "idle" };
}

export default function PipelinePage({ onBack }: PipelinePageProps) {
  const [rows, setRows] = useState<PipelineRow[]>([createRow(), createRow()]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [summary, setSummary] = useState<{
    completed: number;
    failed: number;
  } | null>(null);
  const abortRef = useRef(false);

  const updateRow = (id: string, patch: Partial<PipelineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const runAll = async () => {
    const eligible = rows.filter((r) => r.imageUrl.trim() && r.prompt.trim());
    if (eligible.length === 0) return;

    setRunning(true);
    abortRef.current = false;
    setSummary(null);

    // reset statuses
    setRows((prev) =>
      prev.map((r) =>
        r.imageUrl.trim() && r.prompt.trim()
          ? { ...r, status: "idle", outputUrl: undefined, errorMsg: undefined }
          : r,
      ),
    );

    let completed = 0;
    let failed = 0;

    for (let i = 0; i < eligible.length; i++) {
      if (abortRef.current) break;
      const row = eligible[i];
      setProgress({ current: i + 1, total: eligible.length });
      updateRow(row.id, { status: "running" });

      try {
        const puter = (window as any).puter;
        if (!puter) throw new Error("Puter.js not loaded");
        const imageElement = await puter.ai.txt2img(row.prompt, {
          model: "black-forest-labs/flux.1-kontext-pro",
          image_url: row.imageUrl,
        });
        updateRow(row.id, { status: "done", outputUrl: imageElement.src });
        completed++;
      } catch (err: any) {
        updateRow(row.id, {
          status: "error",
          errorMsg: err?.message || "Unknown error",
        });
        failed++;
      }
    }

    setProgress(null);
    setSummary({ completed, failed });
    setRunning(false);
  };

  const stopAll = () => {
    abortRef.current = true;
  };

  const completedCount = rows.filter((r) => r.status === "done").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
            data-ocid="pipeline.back.button"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(135deg, #4ECDC4, #2D9B94)",
              }}
            >
              <GitBranch className="h-3.5 w-3.5" />
            </div>
            <h1 className="font-bold text-lg" style={{ color: "#111827" }}>
              AI Pipeline
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {progress && (
            <span
              className="text-sm text-gray-500"
              data-ocid="pipeline.progress.loading_state"
            >
              Processing {progress.current}/{progress.total}...
            </span>
          )}
          {summary && !running && (
            <span
              className="text-sm font-medium"
              style={{ color: summary.failed > 0 ? "#EF4444" : "#10B981" }}
              data-ocid="pipeline.summary.success_state"
            >
              ✓ {summary.completed} completed
              {summary.failed > 0 ? `, ${summary.failed} failed` : ""}
            </span>
          )}
          {running ? (
            <button
              type="button"
              onClick={stopAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
              data-ocid="pipeline.stop.button"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={runAll}
              disabled={rows.every(
                (r) => !r.imageUrl.trim() || !r.prompt.trim(),
              )}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#111827", color: "#FFFFFF" }}
              data-ocid="pipeline.run_all.primary_button"
            >
              <Play className="h-3.5 w-3.5" />
              Run All
            </button>
          )}
        </div>
      </header>

      {/* Rows */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {rows.map((row, idx) => (
          <PipelineRowCard
            key={row.id}
            row={row}
            index={idx + 1}
            onUpdate={(patch) => updateRow(row.id, patch)}
            onDelete={() => deleteRow(row.id)}
            disabled={running}
          />
        ))}

        <button
          type="button"
          onClick={addRow}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "#D1D5DB", color: "#6B7280" }}
          data-ocid="pipeline.add_row.button"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </button>

        {(completedCount > 0 || errorCount > 0) && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
            data-ocid="pipeline.results.panel"
          >
            <p className="font-semibold mb-1" style={{ color: "#111827" }}>
              Results
            </p>
            <p style={{ color: "#6B7280" }}>
              {completedCount} succeeded · {errorCount} failed ·{" "}
              {
                rows.filter(
                  (r) => r.status === "idle" || r.status === "running",
                ).length
              }{" "}
              remaining
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs" style={{ color: "#9CA3AF" }}>
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}

interface PipelineRowCardProps {
  row: PipelineRow;
  index: number;
  onUpdate: (patch: Partial<PipelineRow>) => void;
  onDelete: () => void;
  disabled: boolean;
}

function PipelineRowCard({
  row,
  index,
  onUpdate,
  onDelete,
  disabled,
}: PipelineRowCardProps) {
  const [imgError, setImgError] = useState(false);

  const statusConfig = {
    idle: { label: "Idle", color: "#6B7280", bg: "#F3F4F6" },
    running: { label: "Running", color: "#3B82F6", bg: "#EFF6FF" },
    done: { label: "Done", color: "#10B981", bg: "#ECFDF5" },
    error: { label: "Error", color: "#EF4444", bg: "#FEF2F2" },
  }[row.status];

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith("http");
    } catch {
      return false;
    }
  };

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        border: "1px solid #E2E8F0",
      }}
      data-ocid={`pipeline.item.${index}`}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: "#111827", color: "#FFFFFF" }}
          >
            {index}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: statusConfig.bg,
              color: statusConfig.color,
            }}
          >
            {row.status === "running" && (
              <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
            )}
            {row.status === "done" && (
              <CheckCircle className="inline h-3 w-3 mr-1" />
            )}
            {row.status === "error" && (
              <AlertCircle className="inline h-3 w-3 mr-1" />
            )}
            {statusConfig.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-40"
          data-ocid={`pipeline.delete_button.${index}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      </div>

      {/* Inputs row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Image URL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={row.imageUrl}
              onChange={(e) => {
                onUpdate({ imageUrl: e.target.value });
                setImgError(false);
              }}
              disabled={disabled}
              placeholder="Paste image URL..."
              className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none transition-colors focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "#E2E8F0", color: "#111827" }}
              data-ocid={`pipeline.input.${index}`}
            />
          </div>
          {isValidUrl(row.imageUrl) && !imgError && (
            <img
              src={row.imageUrl}
              alt="Source preview"
              className="w-full h-28 object-cover rounded-lg"
              style={{ border: "1px solid #E2E8F0" }}
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Prompt */}
        <div>
          <textarea
            value={row.prompt}
            onChange={(e) => onUpdate({ prompt: e.target.value })}
            disabled={disabled}
            placeholder="Describe the transformation..."
            rows={isValidUrl(row.imageUrl) && !imgError ? 4 : 2}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors resize-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: "#E2E8F0", color: "#111827" }}
            data-ocid={`pipeline.textarea.${index}`}
          />
        </div>
      </div>

      {/* Output */}
      {row.status === "done" && row.outputUrl && (
        <div
          className="space-y-1"
          data-ocid={`pipeline.success_state.${index}`}
        >
          <p className="text-xs font-medium" style={{ color: "#10B981" }}>
            Output
          </p>
          <img
            src={row.outputUrl}
            alt="Generated output"
            className="w-full max-h-64 object-contain rounded-lg"
            style={{ border: "1px solid #D1FAE5", backgroundColor: "#F0FDF4" }}
          />
          <a
            href={row.outputUrl}
            download={`pipeline-output-${index}.png`}
            className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}
          >
            Download
          </a>
        </div>
      )}

      {row.status === "error" && row.errorMsg && (
        <div
          className="p-3 rounded-lg text-xs"
          style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}
          data-ocid={`pipeline.error_state.${index}`}
        >
          {row.errorMsg}
        </div>
      )}
    </div>
  );
}
