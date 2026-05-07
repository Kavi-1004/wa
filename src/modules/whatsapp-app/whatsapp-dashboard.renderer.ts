interface DashboardLog {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  waMessageId: string | null;
  errorDetail: string | null;
  sentAt: Date | null;
  createdAt: Date;
  contact: { name: string | null };
}

interface DashboardData {
  logs: DashboardLog[];
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  stats: {
    totalMessages: number;
    sent: number;
    failed: number;
    pending: number;
    totalContacts: number;
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    sent: "#16a34a",
    failed: "#dc2626",
    pending: "#d97706",
  };
  const bg: Record<string, string> = {
    sent: "#dcfce7",
    failed: "#fef2f2",
    pending: "#fefce8",
  };
  const color = colors[status] ?? "#6b7280";
  const bgColor = bg[status] ?? "#f3f4f6";
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:${color};background:${bgColor};text-transform:uppercase;">${escapeHtml(status)}</span>`;
}

export function renderDashboard(
  data: DashboardData,
  currentStatus: string,
): string {
  const { logs, totalPages, currentPage, stats } = data;

  const logRows = logs
    .map(
      (log) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;">${escapeHtml(log.phoneNumber)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(log.contact?.name ?? "—")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(log.message)}">${escapeHtml(log.message)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${statusBadge(log.status)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-family:monospace;">${escapeHtml(log.waMessageId ?? "—")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#dc2626;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(log.errorDetail ?? "")}">${escapeHtml(log.errorDetail ?? "—")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;white-space:nowrap;">${formatDate(log.createdAt)}</td>
      </tr>`,
    )
    .join("");

  const emptyRow = `<tr><td colspan="7" style="padding:40px;text-align:center;color:#9ca3af;font-size:14px;">No message logs found.</td></tr>`;

  const filterBtn = (label: string, value: string) => {
    const active = currentStatus === value;
    const bg = active ? "#1d4ed8" : "#f3f4f6";
    const color = active ? "#fff" : "#374151";
    return `<a href="?status=${value}&page=1" style="display:inline-block;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:500;background:${bg};color:${color};text-decoration:none;margin-right:6px;">${label}</a>`;
  };

  const pagination: string[] = [];
  if (totalPages > 1) {
    if (currentPage > 1) {
      pagination.push(
        `<a href="?status=${currentStatus}&page=${currentPage - 1}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-decoration:none;color:#374151;margin-right:4px;">&laquo; Prev</a>`,
      );
    }
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage;
      const bg = active ? "#1d4ed8" : "#fff";
      const color = active ? "#fff" : "#374151";
      pagination.push(
        `<a href="?status=${currentStatus}&page=${i}" style="display:inline-block;padding:6px 12px;border:1px solid ${active ? "#1d4ed8" : "#d1d5db"};border-radius:6px;font-size:13px;text-decoration:none;color:${color};background:${bg};margin-right:4px;">${i}</a>`,
      );
    }
    if (currentPage < totalPages) {
      pagination.push(
        `<a href="?status=${currentStatus}&page=${currentPage + 1}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-decoration:none;color:#374151;">&raquo; Next</a>`,
      );
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Message Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111827; }
    .container { max-width: 1280px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { font-size: 24px; font-weight: 700; color: #111827; }
    .header-actions { display: flex; gap: 8px; }
    .header-actions a { padding: 8px 16px; border-radius: 8px; font-size: 13px; text-decoration: none; font-weight: 500; }
    .btn-primary { background: #1d4ed8; color: #fff; }
    .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .table-header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .table-header h2 { font-size: 16px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; background: #fafafa; }
    .pagination { padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .page-info { font-size: 13px; color: #6b7280; }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      table { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WhatsApp Message Dashboard</h1>
      <div class="header-actions">
        <a href="javascript:location.reload()" class="btn-secondary">Refresh</a>
        <a href="/docs#/WhatsApp" class="btn-primary">API Docs</a>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Active Contacts</div>
        <div class="stat-value" style="color:#1d4ed8;">${stats.totalContacts}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Messages</div>
        <div class="stat-value" style="color:#111827;">${stats.totalMessages}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sent</div>
        <div class="stat-value" style="color:#16a34a;">${stats.sent}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Failed</div>
        <div class="stat-value" style="color:#dc2626;">${stats.failed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value" style="color:#d97706;">${stats.pending}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h2>Message Logs</h2>
        <div>
          ${filterBtn("All", "")}
          ${filterBtn("Sent", "sent")}
          ${filterBtn("Failed", "failed")}
          ${filterBtn("Pending", "pending")}
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Contact</th>
              <th>Message</th>
              <th style="text-align:center;">Status</th>
              <th>WA Message ID</th>
              <th>Error</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length > 0 ? logRows : emptyRow}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="page-info">
          Showing page ${currentPage} of ${totalPages || 1} (${data.totalLogs} total logs)
        </div>
        <div>${pagination.join("")}</div>
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af;">
      Auto-refreshes every 30 seconds &middot; WhatsApp Messaging Dashboard
    </div>
  </div>
  <script>setTimeout(()=>location.reload(), 30000);</script>
</body>
</html>`;
}
