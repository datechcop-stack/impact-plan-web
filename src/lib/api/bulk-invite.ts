import { ApiError, apiFetch, getErrorMessage } from "@/lib/api/client";
import type { BulkInviteRow } from "@/lib/parse-bulk-invite-csv";

export type BulkInviteResult = {
  invited: number;
  failed: Array<{ email: string; message: string }>;
};

type LookupUser = {
  id: string;
  email: string;
};

function isMissingBulkRoute(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 404) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes("bulk-invite");
}

async function resolveLineManagerId(email: string): Promise<string | null> {
  const matches = await apiFetch<LookupUser[]>(`/users/lookup?q=${encodeURIComponent(email)}`);
  const normalized = email.toLowerCase();
  const match = matches.find((user) => user.email.toLowerCase() === normalized);
  return match?.id ?? null;
}

async function bulkInviteSequential(
  rows: BulkInviteRow[],
  remindCreatePlan: boolean,
): Promise<BulkInviteResult> {
  const failed: BulkInviteResult["failed"] = [];
  let invited = 0;
  const seenEmails = new Set<string>();

  for (const row of rows) {
    const email = row.email.toLowerCase();
    if (seenEmails.has(email)) {
      failed.push({ email, message: "Duplicate email in this upload." });
      continue;
    }
    seenEmails.add(email);

    let lineManagerId: string | null = null;
    if (row.lineManagerEmail) {
      lineManagerId = await resolveLineManagerId(row.lineManagerEmail);
      if (!lineManagerId) {
        failed.push({
          email,
          message: `Line manager not found: ${row.lineManagerEmail}`,
        });
        continue;
      }
    }

    try {
      await apiFetch("/admin/users", {
        method: "POST",
        json: {
          fullName: row.fullName,
          email,
          jobTitle: row.jobTitle,
          lineManagerId,
          role: row.role,
          remindCreatePlan,
        },
      });
      invited += 1;
    } catch (error) {
      failed.push({ email, message: getErrorMessage(error) });
    }
  }

  return { invited, failed };
}

export async function bulkInviteUsers(
  rows: BulkInviteRow[],
  options: { remindCreatePlan: boolean },
): Promise<BulkInviteResult> {
  try {
    return await apiFetch<BulkInviteResult>("/admin/users/bulk-invite", {
      method: "POST",
      json: { invites: rows, remindCreatePlan: options.remindCreatePlan },
    });
  } catch (error) {
    if (!isMissingBulkRoute(error)) {
      throw error;
    }
    return bulkInviteSequential(rows, options.remindCreatePlan);
  }
}
