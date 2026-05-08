export function renderLoginPage(error?: string): string {
  const errorHtml = error
    ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:#dc2626;font-size:14px;">${error}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Dashboard — Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111827; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 40px; width: 100%; max-width: 420px; margin: 24px; }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo h1 { font-size: 22px; font-weight: 700; color: #111827; }
    .logo p { font-size: 14px; color: #6b7280; margin-top: 4px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    input[type="email"], input[type="password"] { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.15s; }
    input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,0.1); }
    .field { margin-bottom: 16px; }
    .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; background: #1d4ed8; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn:hover { background: #1e40af; }
    .btn:disabled { background: #93c5fd; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>WhatsApp Dashboard</h1>
      <p>Sign in to access the dashboard</p>
    </div>
    ${errorHtml}
    <form method="POST" action="login" id="loginForm">
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="admin@example.com" required autocomplete="email" />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required autocomplete="current-password" />
      </div>
      <button type="submit" class="btn" id="submitBtn">Sign In</button>
    </form>
  </div>
</body>
</html>`;
}
