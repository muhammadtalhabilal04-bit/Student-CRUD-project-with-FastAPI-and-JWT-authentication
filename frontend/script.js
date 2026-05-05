/* =========================================================
   Vanilla JS frontend for FastAPI JWT auth (no frameworks).
   Pages:
   - register.html -> POST /users/register (JSON)
   - login.html    -> POST /users/login (x-www-form-urlencoded)
   - dashboard.html (requires token) -> /users/me via GET/PUT/DELETE
   ========================================================= */

// Use this exact base URL (per project requirement).
const API_BASE = "http://127.0.0.1:8000";

const TOKEN_KEY = "token";

function $(sel) {
  return document.querySelector(sel);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function redirectTo(path) {
  window.location.href = path;
}

function showMessage(el, text, type) {
  // type: "success" | "error" | "info"
  if (!el) return;
  el.textContent = text;
  el.classList.remove("hidden", "success", "error", "info");
  el.classList.add(type || "info");
}

function hideMessage(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
  el.classList.remove("success", "error", "info");
}

async function readErrorMessage(res) {
  // FastAPI errors are typically: { "detail": "..." } or { "detail": [...] }
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data && typeof data.detail === "string") return data.detail;
      if (data && data.detail != null) return JSON.stringify(data.detail, null, 2);
      return JSON.stringify(data, null, 2);
    }
    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function apiFetch(path, options) {
  // Central place to call the API and throw useful errors.
  const url = `${API_BASE}${path}`;
  console.log("[API] Request:", options?.method || "GET", url, options || {});
  const res = await fetch(url, options);
  console.log("[API] Response:", options?.method || "GET", url, res.status);
  if (!res.ok) {
    const msg = await readErrorMessage(res);
    console.log("[API] Error body:", msg);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  // Some endpoints might return no content (204).
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await res.json();
  return await res.text();
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function prettyPrint(data) {
  if (data == null) return "";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

async function loadCurrentUser() {
  // Protected endpoint to prove the token works and get the user's email.
  return await apiFetch("/users/me", {
    method: "GET",
    headers: {
      ...authHeaders(),
    },
  });
}

function ensureAuthedOrRedirect() {
  // Called on dashboard load.
  const token = getToken();
  if (!token) {
    redirectTo("login.html");
    return false;
  }
  return true;
}

function renderToPre(preEl, data) {
  if (!preEl) return;
  preEl.textContent = prettyPrint(data);
}

function bindGetPage() {
  const root = $("#getRoot");
  if (!root) return;
  if (!ensureAuthedOrRedirect()) return;

  const msg = $("#message");
  const output = $("#output");
  const btn = $("#btnCall");
  const btnLogout = $("#btnLogout");

  hideMessage(msg);
  renderToPre(output, "{}");

  btnLogout?.addEventListener("click", () => {
    clearToken();
    redirectTo("login.html");
  });

  btn?.addEventListener("click", async () => {
    hideMessage(msg);
    renderToPre(output, "");
    try {
      const data = await apiFetch("/users/me", {
        method: "GET",
        headers: { ...authHeaders() },
      });
      showMessage(msg, "GET /users/me succeeded.", "success");
      renderToPre(output, data);
    } catch (err) {
      showMessage(msg, err?.message || "GET failed.", "error");
      renderToPre(output, { error: err?.message || "GET failed" });
    }
  });
}

function bindPostPage() {
  const root = $("#postRoot");
  if (!root) return;
  if (!ensureAuthedOrRedirect()) return;

  const msg = $("#message");
  const output = $("#output");
  const form = $("#postForm");
  const btnLogout = $("#btnLogout");

  hideMessage(msg);
  renderToPre(output, "{}");

  btnLogout?.addEventListener("click", () => {
    clearToken();
    redirectTo("login.html");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(msg);
    renderToPre(output, "");

    const email = $("#postEmail")?.value?.trim() || "";
    const password = $("#postPassword")?.value || "";
    if (!email || !password) {
      showMessage(msg, "Please enter email and password.", "error");
      return;
    }

    try {
      const data = await apiFetch("/users", {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      showMessage(msg, "POST /users succeeded.", "success");
      renderToPre(output, data);
      form.reset();
    } catch (err) {
      showMessage(msg, err?.message || "POST failed.", "error");
      renderToPre(output, { error: err?.message || "POST failed" });
    }
  });
}

function bindPutPage() {
  const root = $("#putRoot");
  if (!root) return;
  if (!ensureAuthedOrRedirect()) return;

  const msg = $("#message");
  const output = $("#output");
  const form = $("#putForm");
  const btnLogout = $("#btnLogout");

  hideMessage(msg);
  renderToPre(output, "{}");

  btnLogout?.addEventListener("click", () => {
    clearToken();
    redirectTo("login.html");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(msg);
    renderToPre(output, "");

    const password = $("#newPassword")?.value || "";
    if (!password) {
      showMessage(msg, "Please enter a new password.", "error");
      return;
    }

    try {
      const data = await apiFetch("/users/me", {
        method: "PUT",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      showMessage(msg, "PUT /users/me succeeded.", "success");
      renderToPre(output, data);
      form.reset();
    } catch (err) {
      showMessage(msg, err?.message || "PUT failed.", "error");
      renderToPre(output, { error: err?.message || "PUT failed" });
    }
  });
}

function bindDeletePage() {
  const root = $("#deleteRoot");
  if (!root) return;
  if (!ensureAuthedOrRedirect()) return;

  const msg = $("#message");
  const output = $("#output");
  const btn = $("#btnDeleteAccount");
  const btnLogout = $("#btnLogout");

  hideMessage(msg);
  renderToPre(output, "{}");

  btnLogout?.addEventListener("click", () => {
    clearToken();
    redirectTo("login.html");
  });

  btn?.addEventListener("click", async () => {
    const ok = confirm("Delete your account permanently?");
    if (!ok) return;

    hideMessage(msg);
    renderToPre(output, "");
    try {
      const data = await apiFetch("/users/me", {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      showMessage(msg, "DELETE /users/me succeeded.", "success");
      renderToPre(output, data);
      clearToken();
      setTimeout(() => redirectTo("login.html"), 700);
    } catch (err) {
      showMessage(msg, err?.message || "DELETE failed.", "error");
      renderToPre(output, { error: err?.message || "DELETE failed" });
    }
  });
}

function bindRegisterPage() {
  const form = $("#registerForm");
  if (!form) return;

  const msg = $("#message");
  hideMessage(msg);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(msg);

    const email = $("#regEmail")?.value?.trim() || "";
    const password = $("#regPassword")?.value || "";

    if (!email || !password) {
      showMessage(msg, "Please enter email and password.", "error");
      return;
    }

    try {
      const data = await apiFetch("/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Success: show message and let user go to login.
      showMessage(
        msg,
        `Registered successfully for ${data?.email || email}. You can now log in.`,
        "success"
      );
      form.reset();
    } catch (err) {
      showMessage(msg, err?.message || "Registration failed.", "error");
    }
  });
}

function bindLoginPage() {
  const form = $("#loginForm");
  if (!form) return;

  const msg = $("#message");
  hideMessage(msg);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage(msg);

    const username = $("#loginUsername")?.value?.trim() || "";
    const password = $("#loginPassword")?.value || "";

    if (!username || !password) {
      showMessage(msg, "Please enter username/email and password.", "error");
      return;
    }

    // IMPORTANT: FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);

    try {
      const data = await apiFetch("/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const token = data?.access_token;
      if (!token) throw new Error("Login succeeded but no access_token returned.");

      setToken(token);
      redirectTo("dashboard.html");
    } catch (err) {
      showMessage(msg, err?.message || "Login failed.", "error");
    }
  });
}

function bindDashboardPage() {
  const root = $("#dashboardRoot");
  if (!root) return;

  if (!ensureAuthedOrRedirect()) return;

  const welcome = $("#welcome");
  const msg = $("#message");
  const output = $("#output");
  const btnLogout = $("#btnLogout");

  const btnGet = $("#btnGet");
  const btnPost = $("#btnPost");
  const btnPut = $("#btnPut");
  const btnDelete = $("#btnDelete");

  hideMessage(msg);
  if (output) output.textContent = "";

  // Logout
  btnLogout?.addEventListener("click", () => {
    clearToken();
    redirectTo("login.html");
  });

  // On load: show current user
  (async () => {
    try {
      const me = await loadCurrentUser();
      if (welcome) welcome.textContent = `Welcome ${me?.email || "User"}`;
      showMessage(msg, "Token is valid. You’re authenticated.", "success");
    } catch (err) {
      // Token invalid/expired -> kick to login
      clearToken();
      redirectTo("login.html");
    }
  })();

  // Helper to render responses
  function render(data) {
    if (!output) return;
    output.textContent = prettyPrint(data);
  }

  // GET -> /users/me
  btnGet?.addEventListener("click", async () => {
    hideMessage(msg);
    render("");
    try {
      const data = await apiFetch("/users/me", {
        method: "GET",
        headers: {
          ...authHeaders(),
        },
      });
      showMessage(msg, "GET /users/me succeeded.", "success");
      render(data);
    } catch (err) {
      showMessage(msg, err?.message || "GET failed.", "error");
      render({ error: err?.message || "GET failed" });
    }
  });

  // POST -> no protected POST in your shown routes, so we demonstrate an authenticated call
  // by calling GET /users (list) but keep the button labeled POST per your requirements.
  // If your backend later adds a protected POST endpoint, just update this path.
  btnPost?.addEventListener("click", async () => {
    hideMessage(msg);
    render("");
    try {
      const data = await apiFetch("/users", {
        method: "GET",
        headers: {
          ...authHeaders(),
        },
      });
      showMessage(
        msg,
        "Demo: this button calls GET /users (your API has no protected POST route here).",
        "info"
      );
      render(data);
    } catch (err) {
      showMessage(msg, err?.message || "Request failed.", "error");
      render({ error: err?.message || "Request failed" });
    }
  });

  // PUT -> /users/me (update email/password)
  btnPut?.addEventListener("click", async () => {
    hideMessage(msg);
    render("");

    // Basic demo: update password only (no email change).
    // If you prefer, you can change this to prompt for email too.
    const newPassword = prompt("Enter a new password for your account:");
    if (newPassword == null) return;
    if (!newPassword) {
      showMessage(msg, "Password cannot be empty.", "error");
      return;
    }

    try {
      const data = await apiFetch("/users/me", {
        method: "PUT",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });
      showMessage(msg, "PUT /users/me succeeded.", "success");
      render(data);
    } catch (err) {
      showMessage(msg, err?.message || "PUT failed.", "error");
      render({ error: err?.message || "PUT failed" });
    }
  });

  // DELETE -> /users/me
  btnDelete?.addEventListener("click", async () => {
    hideMessage(msg);
    render("");

    const ok = confirm(
      "This will DELETE your user (/users/me). Are you sure you want to continue?"
    );
    if (!ok) return;

    try {
      const data = await apiFetch("/users/me", {
        method: "DELETE",
        headers: {
          ...authHeaders(),
        },
      });
      showMessage(msg, "DELETE /users/me succeeded (account deleted).", "success");
      render(data);
      clearToken();
      setTimeout(() => redirectTo("login.html"), 700);
    } catch (err) {
      showMessage(msg, err?.message || "DELETE failed.", "error");
      render({ error: err?.message || "DELETE failed" });
    }
  });
}

// Entry point: detect which page we’re on and bind handlers.
document.addEventListener("DOMContentLoaded", () => {
  bindRegisterPage();
  bindLoginPage();
  bindDashboardPage();
  bindGetPage();
  bindPostPage();
  bindPutPage();
  bindDeletePage();
});

