"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch, getErrorMessage } from "@/lib/api/client";
import { parseBulkInviteCsv, type BulkInviteRow } from "@/lib/parse-bulk-invite-csv";
import { cn } from "@/lib/utils";

type BulkInviteModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

type BulkInviteResponse = {
  invited: number;
  failed: Array<{ email: string; message: string }>;
};

export function BulkInviteModal({ open, onClose, onSuccess, onError }: BulkInviteModalProps) {
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<BulkInviteRow[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiFetch<BulkInviteResponse>("/admin/users/bulk-invite", {
        method: "POST",
        json: { invites: rows, remindCreatePlan: true },
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      const failCount = data.failed.length;
      onSuccess(
        failCount === 0
          ? `${data.invited} invitation${data.invited === 1 ? "" : "s"} sent.`
          : `${data.invited} sent, ${failCount} failed. Check the list for details.`,
      );
      reset();
      onClose();
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setSubmitError(message);
      onError(message);
    },
  });

  function reset() {
    setFileName(null);
    setRows([]);
    setParseErrors([]);
    setSubmitError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const parsed = parseBulkInviteCsv(text);
    setFileName(file.name);
    setRows(parsed.rows);
    setParseErrors(parsed.errors);
    setSubmitError(null);
  }

  if (!open) return null;

  const canSubmit = rows.length > 0 && parseErrors.length === 0 && !inviteMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-invite-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="bulk-invite-title" className="text-xl font-extrabold text-navy">
                Bulk invite upload
              </h2>
              <p className="mt-1 text-sm text-muted">
                Upload a CSV with one row per person. Use the sample file to match column names.
              </p>
            </div>
            <button
              type="button"
              className="text-muted hover:text-navy"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-soft">
              Choose CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={onFileChange}
              />
            </label>
            <a
              href="/samples/bulk-invite-sample.csv"
              download
              className="text-sm font-semibold text-accent"
            >
              Download sample CSV
            </a>
            {fileName ? <span className="text-sm text-muted">{fileName}</span> : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {submitError ? (
            <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              <p className="font-semibold">Could not send invitations</p>
              <p className="mt-1">{submitError}</p>
            </div>
          ) : null}

          {parseErrors.length > 0 ? (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              <p className="font-semibold">Fix these rows before inviting:</p>
              <ul className="mt-2 list-disc pl-5">
                {parseErrors.map((item) => (
                  <li key={`${item.line}-${item.message}`}>
                    Line {item.line}: {item.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <p className="text-sm font-semibold text-navy">
                {rows.length} person{rows.length === 1 ? "" : "s"} ready to invite
              </p>
              <table className="mt-3 w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Line manager</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.email} className="border-t border-border">
                      <td className="py-2 font-medium text-navy">{row.fullName}</td>
                      <td>{row.email}</td>
                      <td className="text-muted">{row.lineManagerEmail ?? "—"}</td>
                      <td>{row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={cn("text-sm text-muted", parseErrors.length > 0 && "mt-4")}>
              No rows loaded yet. Choose a CSV or download the sample to get started.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border p-6">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            loading={inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
          >
            Send{" "}
            {rows.length > 0
              ? `${rows.length} invitation${rows.length === 1 ? "" : "s"}`
              : "invitations"}
          </Button>
        </div>
      </div>
    </div>
  );
}
