export type BulkInviteRow = {
  fullName: string;
  email: string;
  jobTitle?: string;
  lineManagerEmail?: string;
  role: "STAFF" | "ADMIN";
};

export type ParsedBulkInvite = {
  rows: BulkInviteRow[];
  errors: Array<{ line: number; message: string }>;
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseBulkInviteCsv(text: string): ParsedBulkInvite {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const errors: ParsedBulkInvite["errors"] = [];
  const rows: BulkInviteRow[] = [];

  if (lines.length === 0) {
    return { rows, errors: [{ line: 1, message: "File is empty." }] };
  }

  const headerCells = parseCsvLine(lines[0]!).map(normalizeHeader);
  const indexOf = (names: string[]) => headerCells.findIndex((h) => names.includes(h));

  const nameIdx = indexOf(["full_name", "fullname", "name"]);
  const emailIdx = indexOf(["email", "work_email"]);
  const titleIdx = indexOf(["job_title", "title"]);
  const managerIdx = indexOf(["line_manager_email", "line_manager", "manager_email"]);
  const roleIdx = indexOf(["role", "access"]);

  if (nameIdx === -1 || emailIdx === -1) {
    return {
      rows: [],
      errors: [
        {
          line: 1,
          message: "Header must include full_name (or name) and email columns.",
        },
      ],
    };
  }

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const cells = parseCsvLine(lines[i]!);
    const fullName = (cells[nameIdx] ?? "").trim();
    const email = (cells[emailIdx] ?? "").trim().toLowerCase();
    const jobTitle = titleIdx >= 0 ? (cells[titleIdx] ?? "").trim() : "";
    const lineManagerEmail = managerIdx >= 0 ? (cells[managerIdx] ?? "").trim().toLowerCase() : "";
    const roleRaw = roleIdx >= 0 ? (cells[roleIdx] ?? "").trim().toUpperCase() : "STAFF";

    if (!fullName && !email) continue;

    if (fullName.length < 2) {
      errors.push({ line: lineNumber, message: "Full name is required (min 2 characters)." });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line: lineNumber, message: `Invalid email: ${email || "(empty)"}` });
      continue;
    }
    if (lineManagerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lineManagerEmail)) {
      errors.push({
        line: lineNumber,
        message: `Invalid line manager email: ${lineManagerEmail}`,
      });
      continue;
    }
    if (roleRaw && roleRaw !== "STAFF" && roleRaw !== "ADMIN") {
      errors.push({ line: lineNumber, message: `Role must be STAFF or ADMIN (got ${roleRaw}).` });
      continue;
    }

    rows.push({
      fullName,
      email,
      jobTitle: jobTitle || undefined,
      lineManagerEmail: lineManagerEmail || undefined,
      role: roleRaw === "ADMIN" ? "ADMIN" : "STAFF",
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({ line: 2, message: "No data rows found after the header." });
  }

  return { rows, errors };
}
