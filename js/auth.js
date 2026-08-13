(() => {
  const AUTH_KEY = "nbaProtectedSessionV1";
  const USERNAME = "nbalr501";
  const PASSWORD_SHA256 = "09f56a34fb99a677e76667ec400434c5a1a244f3e519082433e64fad7326aa03";

  function makeGate() {
    const gate = document.createElement("div");
    gate.id = "authGate";
    gate.innerHTML = `
      <form class="auth-card" id="authForm" autocomplete="off">
        <div class="auth-brand">NO <span>BOUNDS</span> AUTO</div>
        <h1>Dealer Login</h1>
        <p>This page is reserved for No Bounds Auto dealer tools.</p>

        <label class="auth-field">
          <span>Username</span>
          <input id="authUsername" name="username" autocomplete="username" required />
        </label>

        <label class="auth-field">
          <span>Password</span>
          <input id="authPassword" name="password" type="password" autocomplete="current-password" required />
        </label>

        <button class="auth-submit" type="submit">Sign In</button>
        <p class="auth-error" id="authError" role="alert"></p>
      </form>
    `;
    document.body.appendChild(gate);

    const form = gate.querySelector("#authForm");
    const error = gate.querySelector("#authError");
    const username = gate.querySelector("#authUsername");
    const password = gate.querySelector("#authPassword");

    username.focus();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";

      const suppliedHash = await sha256(password.value);
      if (username.value === USERNAME && suppliedHash === PASSWORD_SHA256) {
        sessionStorage.setItem(AUTH_KEY, "1");
        unlock();
      } else {
        error.textContent = "Incorrect username or password.";
        password.value = "";
        password.focus();
      }
    });
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function addLogout() {
    if (document.querySelector(".auth-logout")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "auth-logout";
    button.textContent = "Dealer Logout";
    button.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      location.reload();
    });
    document.body.appendChild(button);
  }

  function unlock() {
    document.body.classList.remove("auth-locked");
    document.getElementById("authGate")?.remove();
    addLogout();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") {
      unlock();
    } else {
      makeGate();
    }
  });
})();
