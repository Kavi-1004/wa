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

interface DashboardContact {
  id: string;
  phoneNumber: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface DashboardUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardUsersData {
  users: DashboardUser[];
  total: number;
  page: number;
  totalPages: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(date: Date | null): string {
  if (!date) return "\u2014";
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

function activeBadge(isActive: boolean): string {
  const color = isActive ? "#16a34a" : "#6b7280";
  const bgColor = isActive ? "#dcfce7" : "#f3f4f6";
  const label = isActive ? "Active" : "Inactive";
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:${color};background:${bgColor};">${label}</span>`;
}

function roleBadge(role: string): string {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "#7c3aed",
    ADMIN: "#1d4ed8",
    USER: "#6b7280",
  };
  const bg: Record<string, string> = {
    SUPER_ADMIN: "#ede9fe",
    ADMIN: "#dbeafe",
    USER: "#f3f4f6",
  };
  const color = colors[role] ?? "#6b7280";
  const bgColor = bg[role] ?? "#f3f4f6";
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:${color};background:${bgColor};text-transform:uppercase;">${escapeHtml(role)}</span>`;
}

function renderLogsTab(data: DashboardData, currentStatus: string): string {
  const { logs, totalPages, currentPage } = data;

  const logRows = logs
    .map(
      (log) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;">${escapeHtml(log.phoneNumber)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(log.contact?.name ?? "\u2014")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(log.message)}">${escapeHtml(log.message)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${statusBadge(log.status)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-family:monospace;">${escapeHtml(log.waMessageId ?? "\u2014")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#dc2626;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(log.errorDetail ?? "")}">${escapeHtml(log.errorDetail ?? "\u2014")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;white-space:nowrap;">${formatDate(log.createdAt)}</td>
      </tr>`,
    )
    .join("");

  const emptyRow = `<tr><td colspan="7" style="padding:40px;text-align:center;color:#9ca3af;font-size:14px;">No message logs found.</td></tr>`;

  const filterBtn = (label: string, value: string) => {
    const active = currentStatus === value;
    const bg = active ? "#1d4ed8" : "#f3f4f6";
    const color = active ? "#fff" : "#374151";
    return `<a href="?tab=logs&status=${value}&page=1" style="display:inline-block;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:500;background:${bg};color:${color};text-decoration:none;margin-right:6px;">${label}</a>`;
  };

  const pagination: string[] = [];
  if (totalPages > 1) {
    if (currentPage > 1) {
      pagination.push(
        `<a href="?tab=logs&status=${currentStatus}&page=${currentPage - 1}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-decoration:none;color:#374151;margin-right:4px;">&laquo; Prev</a>`,
      );
    }
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage;
      const bg = active ? "#1d4ed8" : "#fff";
      const color = active ? "#fff" : "#374151";
      pagination.push(
        `<a href="?tab=logs&status=${currentStatus}&page=${i}" style="display:inline-block;padding:6px 12px;border:1px solid ${active ? "#1d4ed8" : "#d1d5db"};border-radius:6px;font-size:13px;text-decoration:none;color:${color};background:${bg};margin-right:4px;">${i}</a>`,
      );
    }
    if (currentPage < totalPages) {
      pagination.push(
        `<a href="?tab=logs&status=${currentStatus}&page=${currentPage + 1}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-decoration:none;color:#374151;">&raquo; Next</a>`,
      );
    }
  }

  return `
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
    </div>`;
}

function renderContactsTab(contacts: DashboardContact[]): string {
  const activeContacts = contacts.filter((c) => c.isActive);

  const contactRows = contacts
    .map(
      (c) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
          ${c.isActive ? `<input type="checkbox" class="contact-checkbox" value="${c.id}" data-phone="${escapeHtml(c.phoneNumber)}" onchange="updateSelectedCount()" />` : ""}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;">${escapeHtml(c.phoneNumber)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(c.name ?? "\u2014")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${activeBadge(c.isActive)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${c.messageCount}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;white-space:nowrap;">${formatDate(c.createdAt)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <div style="display:flex;gap:6px;">
            <button onclick="editContact('${c.id}','${escapeHtml(c.phoneNumber)}','${escapeHtml(c.name ?? "")}')" style="padding:4px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;background:#fff;cursor:pointer;color:#374151;">Edit</button>
            ${c.isActive ? `<button onclick="deleteContact('${c.id}')" style="padding:4px 10px;border:1px solid #fca5a5;border-radius:6px;font-size:12px;background:#fef2f2;cursor:pointer;color:#dc2626;">Deactivate</button>` : `<button onclick="reactivateContact('${c.id}')" style="padding:4px 10px;border:1px solid #86efac;border-radius:6px;font-size:12px;background:#dcfce7;cursor:pointer;color:#16a34a;">Reactivate</button>`}
            <button onclick="sendToOne('${c.id}','${escapeHtml(c.phoneNumber)}')" style="padding:4px 10px;border:1px solid #93c5fd;border-radius:6px;font-size:12px;background:#eff6ff;cursor:pointer;color:#1d4ed8;">Send Message</button>
          </div>
        </td>
      </tr>`,
    )
    .join("");

  const emptyRow = `<tr><td colspan="7" style="padding:40px;text-align:center;color:#9ca3af;font-size:14px;">No contacts found. Add contacts using the form above.</td></tr>`;

  return `
    <div class="table-card" style="margin-bottom:20px;">
      <div class="table-header">
        <h2>Add Contact</h2>
      </div>
      <div style="padding:20px;">
        <form id="addContactForm" onsubmit="addContact(event)" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
          <div style="flex:1;min-width:200px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">Phone Number</label>
            <input type="text" id="newPhone" placeholder="919876543210" required pattern="\\d{10,15}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
          </div>
          <div style="flex:1;min-width:200px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">Name</label>
            <input type="text" id="newName" placeholder="John Doe" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
          </div>
          <button type="submit" style="padding:8px 20px;border:none;border-radius:8px;background:#1d4ed8;color:#fff;font-size:14px;font-weight:500;cursor:pointer;height:38px;">Add Contact</button>
        </form>
        <div id="addResult" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h2>Contacts (${contacts.length} total, ${activeContacts.length} active)</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          <span id="selectedCount" style="font-size:13px;color:#6b7280;"></span>
          <button id="sendSelectedBtn" onclick="sendToSelected()" style="display:none;padding:6px 16px;border:none;border-radius:6px;font-size:13px;font-weight:500;background:#16a34a;color:#fff;cursor:pointer;">Send to Selected</button>
          <button onclick="selectAllContacts()" style="padding:6px 16px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;font-weight:500;background:#fff;color:#374151;cursor:pointer;">Select All</button>
          <button onclick="deselectAllContacts()" style="padding:6px 16px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;font-weight:500;background:#fff;color:#374151;cursor:pointer;">Deselect All</button>
          <button onclick="sendToAll()" style="padding:6px 16px;border:none;border-radius:6px;font-size:13px;font-weight:500;background:#1d4ed8;color:#fff;cursor:pointer;">Send to All Active</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th style="text-align:center;width:40px;"><input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)" /></th>
              <th>Phone Number</th>
              <th>Name</th>
              <th style="text-align:center;">Status</th>
              <th style="text-align:center;">Messages</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${contacts.length > 0 ? contactRows : emptyRow}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:12px;padding:24px;max-width:400px;width:90%;margin:auto;position:relative;top:50%;transform:translateY(-50%);">
        <h3 style="font-size:18px;font-weight:600;margin-bottom:16px;">Edit Contact</h3>
        <input type="hidden" id="editId" />
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Phone Number</label>
          <input type="text" id="editPhone" pattern="\\d{10,15}" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Name</label>
          <input type="text" id="editName" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button onclick="closeEditModal()" style="padding:8px 16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;">Cancel</button>
          <button onclick="saveEdit()" style="padding:8px 16px;border:none;border-radius:8px;background:#1d4ed8;color:#fff;cursor:pointer;font-size:14px;">Save</button>
        </div>
        <div id="editResult" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>

    <!-- Send Message Modal -->
    <div id="sendModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:12px;padding:24px;max-width:500px;width:90%;margin:auto;position:relative;top:50%;transform:translateY(-50%);">
        <h3 id="sendModalTitle" style="font-size:18px;font-weight:600;margin-bottom:16px;">Send Message</h3>
        <input type="hidden" id="sendTargetId" />
        <input type="hidden" id="sendMode" />
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Message</label>
          <textarea id="sendMessage" rows="3" placeholder="Enter your message..." style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;resize:vertical;"></textarea>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Template Name (optional, overrides env default)</label>
          <input type="text" id="sendTemplate" placeholder="hello_world" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button onclick="closeSendModal()" style="padding:8px 16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;">Cancel</button>
          <button onclick="submitSend()" style="padding:8px 16px;border:none;border-radius:8px;background:#16a34a;color:#fff;cursor:pointer;font-size:14px;">Send</button>
        </div>
        <div id="sendResult" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>`;
}

function renderUsersTab(usersData: DashboardUsersData): string {
  const { users, total, page, totalPages } = usersData;

  const userRows = users
    .map(
      (u) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(u.email)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(u.firstName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(u.lastName)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${roleBadge(u.role)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${activeBadge(u.isActive)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;white-space:nowrap;">${formatDate(u.lastLoginAt)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;white-space:nowrap;">${formatDate(u.createdAt)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <div style="display:flex;gap:6px;">
            <button onclick="editUser('${u.id}','${escapeHtml(u.firstName)}','${escapeHtml(u.lastName)}','${escapeHtml(u.role)}',${u.isActive})" style="padding:4px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;background:#fff;cursor:pointer;color:#374151;">Edit</button>
            ${u.isActive ? `<button onclick="deleteUser('${u.id}')" style="padding:4px 10px;border:1px solid #fca5a5;border-radius:6px;font-size:12px;background:#fef2f2;cursor:pointer;color:#dc2626;">Delete</button>` : `<button onclick="restoreUser('${u.id}')" style="padding:4px 10px;border:1px solid #86efac;border-radius:6px;font-size:12px;background:#dcfce7;cursor:pointer;color:#16a34a;">Restore</button>`}
          </div>
        </td>
      </tr>`,
    )
    .join("");

  const emptyRow = `<tr><td colspan="8" style="padding:40px;text-align:center;color:#9ca3af;font-size:14px;">No users found.</td></tr>`;

  const pagination: string[] = [];
  if (totalPages > 1) {
    if (page > 1) {
      pagination.push(
        `<a href="?tab=users&page=${page - 1}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-decoration:none;color:#374151;margin-right:4px;">&laquo; Prev</a>`,
      );
    }
    for (let i = 1; i <= totalPages; i++) {
      const active = i === page;
      const bg = active ? "#1d4ed8" : "#fff";
      const color = active ? "#fff" : "#374151";
      pagination.push(
        `<a href="?tab=users&page=${i}" style="display:inline-block;padding:6px 12px;border:1px solid ${active ? "#1d4ed8" : "#d1d5db"};border-radius:6px;font-size:13px;text-decoration:none;color:${color};background:${bg};margin-right:4px;">${i}</a>`,
      );
    }
    if (page < totalPages) {
      pagination.push(
        `<a href="?tab=users&page=${page + 1}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-decoration:none;color:#374151;">&raquo; Next</a>`,
      );
    }
  }

  return `
    <div class="table-card" style="margin-bottom:20px;">
      <div class="table-header">
        <h2>Create User</h2>
      </div>
      <div style="padding:20px;">
        <form id="createUserForm" onsubmit="createUser(event)" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
          <div style="flex:1;min-width:180px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">Email</label>
            <input type="email" id="newUserEmail" placeholder="user@example.com" required style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
          </div>
          <div style="flex:1;min-width:140px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">First Name</label>
            <input type="text" id="newUserFirstName" placeholder="John" required style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
          </div>
          <div style="flex:1;min-width:140px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">Last Name</label>
            <input type="text" id="newUserLastName" placeholder="Doe" required style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
          </div>
          <div style="flex:1;min-width:180px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">Password</label>
            <input type="password" id="newUserPassword" placeholder="SecureP@ss123" required minlength="8" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
          </div>
          <div style="min-width:120px;">
            <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;text-transform:uppercase;">Role</label>
            <select id="newUserRole" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;background:#fff;">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
          <button type="submit" style="padding:8px 20px;border:none;border-radius:8px;background:#1d4ed8;color:#fff;font-size:14px;font-weight:500;cursor:pointer;height:38px;">Create User</button>
        </form>
        <div id="createUserResult" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h2>Users (${total} total)</h2>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th style="text-align:center;">Role</th>
              <th style="text-align:center;">Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.length > 0 ? userRows : emptyRow}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="page-info">
          Showing page ${page} of ${totalPages || 1} (${total} total users)
        </div>
        <div>${pagination.join("")}</div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div id="editUserModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:12px;padding:24px;max-width:450px;width:90%;margin:auto;position:relative;top:50%;transform:translateY(-50%);">
        <h3 style="font-size:18px;font-weight:600;margin-bottom:16px;">Edit User</h3>
        <input type="hidden" id="editUserId" />
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">First Name</label>
          <input type="text" id="editUserFirstName" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Last Name</label>
          <input type="text" id="editUserLastName" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;" />
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Role</label>
          <select id="editUserRole" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;background:#fff;">
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#6b7280;margin-bottom:4px;">Active</label>
          <select id="editUserActive" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;background:#fff;">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button onclick="closeEditUserModal()" style="padding:8px 16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;">Cancel</button>
          <button onclick="saveUserEdit()" style="padding:8px 16px;border:none;border-radius:8px;background:#1d4ed8;color:#fff;cursor:pointer;font-size:14px;">Save</button>
        </div>
        <div id="editUserResult" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>`;
}

function dashboardScript(token: string): string {
  return `
  <script>
    const API = '/api/v1/whatsapp';
    const USERS_API = '/api/v1/users';
    const TOKEN = '${token}';

    async function apiCall(method, path, body) {
      const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(API + path, opts);
      if (res.status === 401) { window.location.href = 'dashboard/login'; return; }
      return res.json();
    }

    async function usersApiCall(method, path, body) {
      const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(USERS_API + path, opts);
      if (res.status === 401) { window.location.href = 'dashboard/login'; return; }
      return res.json();
    }

    async function addContact(e) {
      e.preventDefault();
      const phone = document.getElementById('newPhone').value.trim();
      const name = document.getElementById('newName').value.trim();
      const el = document.getElementById('addResult');
      try {
        const r = await apiCall('POST', '/contacts', { contacts: [{ phoneNumber: phone, name: name || undefined }] });
        el.innerHTML = '<span style="color:#16a34a;">Contact added successfully!</span>';
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        el.innerHTML = '<span style="color:#dc2626;">Failed: ' + err.message + '</span>';
      }
    }

    function editContact(id, phone, name) {
      document.getElementById('editId').value = id;
      document.getElementById('editPhone').value = phone;
      document.getElementById('editName').value = name;
      document.getElementById('editResult').innerHTML = '';
      document.getElementById('editModal').style.display = 'block';
    }

    function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }

    async function saveEdit() {
      const id = document.getElementById('editId').value;
      const phone = document.getElementById('editPhone').value.trim();
      const name = document.getElementById('editName').value.trim();
      const el = document.getElementById('editResult');
      try {
        await apiCall('PATCH', '/contacts/' + id, { phoneNumber: phone, name: name });
        el.innerHTML = '<span style="color:#16a34a;">Updated!</span>';
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        el.innerHTML = '<span style="color:#dc2626;">Failed: ' + err.message + '</span>';
      }
    }

    async function deleteContact(id) {
      if (!confirm('Deactivate this contact?')) return;
      try { await apiCall('DELETE', '/contacts/' + id); location.reload(); }
      catch (err) { alert('Failed: ' + err.message); }
    }

    async function reactivateContact(id) {
      try { await apiCall('PATCH', '/contacts/' + id, { isActive: true }); location.reload(); }
      catch (err) { alert('Failed: ' + err.message); }
    }

    function toggleSelectAll(checkbox) {
      document.querySelectorAll('.contact-checkbox').forEach(cb => { cb.checked = checkbox.checked; });
      updateSelectedCount();
    }

    function selectAllContacts() {
      document.querySelectorAll('.contact-checkbox').forEach(cb => { cb.checked = true; });
      const sa = document.getElementById('selectAllCheckbox');
      if (sa) sa.checked = true;
      updateSelectedCount();
    }

    function deselectAllContacts() {
      document.querySelectorAll('.contact-checkbox').forEach(cb => { cb.checked = false; });
      const sa = document.getElementById('selectAllCheckbox');
      if (sa) sa.checked = false;
      updateSelectedCount();
    }

    function updateSelectedCount() {
      const checked = document.querySelectorAll('.contact-checkbox:checked');
      const countEl = document.getElementById('selectedCount');
      const btnEl = document.getElementById('sendSelectedBtn');
      if (countEl) countEl.textContent = checked.length > 0 ? checked.length + ' selected' : '';
      if (btnEl) btnEl.style.display = checked.length > 0 ? 'inline-block' : 'none';
    }

    function getSelectedContactIds() {
      return Array.from(document.querySelectorAll('.contact-checkbox:checked')).map(cb => cb.value);
    }

    function sendToOne(id, phone) {
      document.getElementById('sendTargetId').value = id;
      document.getElementById('sendMode').value = 'individual';
      document.getElementById('sendModalTitle').textContent = 'Send Message to ' + phone;
      document.getElementById('sendMessage').value = '';
      document.getElementById('sendTemplate').value = '';
      document.getElementById('sendResult').innerHTML = '';
      document.getElementById('sendModal').style.display = 'block';
    }

    function sendToAll() {
      document.getElementById('sendTargetId').value = '';
      document.getElementById('sendMode').value = 'all';
      document.getElementById('sendModalTitle').textContent = 'Send Message to All Active Contacts';
      document.getElementById('sendMessage').value = '';
      document.getElementById('sendTemplate').value = '';
      document.getElementById('sendResult').innerHTML = '';
      document.getElementById('sendModal').style.display = 'block';
    }

    function sendToSelected() {
      const ids = getSelectedContactIds();
      if (ids.length === 0) { alert('No contacts selected.'); return; }
      document.getElementById('sendTargetId').value = JSON.stringify(ids);
      document.getElementById('sendMode').value = 'selected';
      document.getElementById('sendModalTitle').textContent = 'Send Message to ' + ids.length + ' Selected Contact(s)';
      document.getElementById('sendMessage').value = '';
      document.getElementById('sendTemplate').value = '';
      document.getElementById('sendResult').innerHTML = '';
      document.getElementById('sendModal').style.display = 'block';
    }

    function closeSendModal() { document.getElementById('sendModal').style.display = 'none'; }

    async function submitSend() {
      const mode = document.getElementById('sendMode').value;
      const message = document.getElementById('sendMessage').value.trim();
      const template = document.getElementById('sendTemplate').value.trim();
      const el = document.getElementById('sendResult');
      if (!message) { el.innerHTML = '<span style="color:#dc2626;">Message is required.</span>'; return; }
      el.innerHTML = '<span style="color:#6b7280;">Sending...</span>';
      try {
        let r;
        const body = { message };
        if (template) body.templateName = template;
        if (mode === 'individual') {
          r = await apiCall('POST', '/send/' + document.getElementById('sendTargetId').value, body);
        } else if (mode === 'selected') {
          body.contactIds = JSON.parse(document.getElementById('sendTargetId').value);
          r = await apiCall('POST', '/send-bulk', body);
        } else {
          r = await apiCall('POST', '/send', body);
        }
        const data = r.data || r;
        el.innerHTML = '<span style="color:#16a34a;">Sent: ' + (data.sent || 0) + ', Failed: ' + (data.failed || 0) + '</span>';
        setTimeout(() => { closeSendModal(); location.href = '?tab=logs'; }, 1500);
      } catch (err) {
        el.innerHTML = '<span style="color:#dc2626;">Error: ' + err.message + '</span>';
      }
    }

    async function createUser(e) {
      e.preventDefault();
      const email = document.getElementById('newUserEmail').value.trim();
      const firstName = document.getElementById('newUserFirstName').value.trim();
      const lastName = document.getElementById('newUserLastName').value.trim();
      const password = document.getElementById('newUserPassword').value;
      const role = document.getElementById('newUserRole').value;
      const el = document.getElementById('createUserResult');
      try {
        const r = await usersApiCall('POST', '', { email, firstName, lastName, password, role });
        if (r.success === false) { el.innerHTML = '<span style="color:#dc2626;">Failed: ' + (r.message || 'Unknown error') + '</span>'; return; }
        el.innerHTML = '<span style="color:#16a34a;">User created successfully!</span>';
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        el.innerHTML = '<span style="color:#dc2626;">Failed: ' + err.message + '</span>';
      }
    }

    function editUser(id, firstName, lastName, role, isActive) {
      document.getElementById('editUserId').value = id;
      document.getElementById('editUserFirstName').value = firstName;
      document.getElementById('editUserLastName').value = lastName;
      document.getElementById('editUserRole').value = role;
      document.getElementById('editUserActive').value = isActive ? 'true' : 'false';
      document.getElementById('editUserResult').innerHTML = '';
      document.getElementById('editUserModal').style.display = 'block';
    }

    function closeEditUserModal() { document.getElementById('editUserModal').style.display = 'none'; }

    async function saveUserEdit() {
      const id = document.getElementById('editUserId').value;
      const firstName = document.getElementById('editUserFirstName').value.trim();
      const lastName = document.getElementById('editUserLastName').value.trim();
      const role = document.getElementById('editUserRole').value;
      const isActive = document.getElementById('editUserActive').value === 'true';
      const el = document.getElementById('editUserResult');
      try {
        const r = await usersApiCall('PATCH', '/' + id, { firstName, lastName, role, isActive });
        if (r.success === false) { el.innerHTML = '<span style="color:#dc2626;">Failed: ' + (r.message || 'Unknown error') + '</span>'; return; }
        el.innerHTML = '<span style="color:#16a34a;">Updated!</span>';
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        el.innerHTML = '<span style="color:#dc2626;">Failed: ' + err.message + '</span>';
      }
    }

    async function deleteUser(id) {
      if (!confirm('Delete this user? (soft delete)')) return;
      try {
        const r = await usersApiCall('DELETE', '/' + id);
        if (r.success === false) { alert('Failed: ' + (r.message || 'Unknown error')); return; }
        location.reload();
      } catch (err) { alert('Failed: ' + err.message); }
    }

    async function restoreUser(id) {
      try {
        const r = await usersApiCall('POST', '/' + id + '/restore');
        if (r.success === false) { alert('Failed: ' + (r.message || 'Unknown error')); return; }
        location.reload();
      } catch (err) { alert('Failed: ' + err.message); }
    }
  </script>`;
}

export function renderDashboard(
  data: DashboardData,
  contacts: DashboardContact[],
  currentStatus: string,
  currentTab: string,
  token: string,
  usersData?: DashboardUsersData,
): string {
  const { stats } = data;

  const tabBtn = (label: string, value: string) => {
    const active = currentTab === value;
    const bg = active ? "#1d4ed8" : "transparent";
    const color = active ? "#fff" : "#374151";
    const border = active ? "none" : "1px solid #d1d5db";
    return `<a href="?tab=${value}" style="display:inline-block;padding:8px 20px;border-radius:8px;font-size:14px;font-weight:500;background:${bg};color:${color};text-decoration:none;border:${border};margin-right:4px;">${label}</a>`;
  };

  let tabContent: string;
  if (currentTab === "contacts") {
    tabContent = renderContactsTab(contacts);
  } else if (currentTab === "users") {
    tabContent = renderUsersTab(
      usersData ?? { users: [], total: 0, page: 1, totalPages: 0 },
    );
  } else {
    tabContent = renderLogsTab(data, currentStatus);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Dashboard</title>
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
    .tabs { margin-bottom: 20px; }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      table { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WhatsApp Dashboard</h1>
      <div class="header-actions">
        <a href="javascript:location.reload()" class="btn-secondary">Refresh</a>
        <a href="/docs#/WhatsApp" class="btn-primary">API Docs</a>
        <a href="dashboard/logout" class="btn-secondary" style="color:#dc2626;border-color:#fca5a5;">Logout</a>
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

    <div class="tabs">
      ${tabBtn("Message Logs", "logs")}
      ${tabBtn("Contacts", "contacts")}
      ${tabBtn("Users", "users")}
    </div>

    ${tabContent}

    <div style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af;">
      WhatsApp Messaging Dashboard
    </div>
  </div>
  ${currentTab === "logs" ? "<script>setTimeout(()=>location.reload(), 30000);</script>" : dashboardScript(token)}
</body>
</html>`;
}
