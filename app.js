// app.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://xpvlejqxqdsjulbyloyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginMessage = document.getElementById("login-message");
const forgotLink = document.getElementById("forgot-password");
const goSignup = document.getElementById("go-signup");

function showMessage(el, msg, ok = true) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? "#0b6b50" : "#b02a2a";
}

// prefill from query
(function prefillFromQuery(){
  try{
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e && emailInput) emailInput.value = e;
  }catch(e){}
})();

loginBtn?.addEventListener("click", async (ev) => {
  ev.preventDefault();
  showMessage(loginMessage, "", true);

  const email = (emailInput?.value || "").trim();
  const password = (passwordInput?.value || "").trim();

  if (!email || !password) {
    showMessage(loginMessage, "Please enter both email and password.", false);
    return;
  }

  loginBtn.disabled = true;
  showMessage(loginMessage, "Signing in...", true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.warn("Sign in error:", error);
      // check if the user has a profile (exists) by email
      const { data: rows, error: checkErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (checkErr) {
        console.error("profile check error:", checkErr);
      }

      if (rows && rows.length === 0) {
        showMessage(loginMessage, "Account not found — redirecting to Sign up...", false);
        setTimeout(() => {
          window.location.href = `signup.html?email=${encodeURIComponent(email)}`;
        }, 900);
        return;
      }

      // profile exists -> invalid credentials
      showMessage(loginMessage, "Incorrect email or password.", false);
      return;
    }

    // success
    showMessage(loginMessage, "Login successful — redirecting...", true);
    setTimeout(() => (window.location.href = "profile.html"), 700);

  } catch (err) {
    console.error(err);
    showMessage(loginMessage, "Unexpected error: " + (err.message || err), false);
  } finally {
    loginBtn.disabled = false;
  }
});

forgotLink?.addEventListener("click", async (ev) => {
  ev.preventDefault();
  const email = (emailInput?.value || "").trim();
  if (!email) {
    showMessage(loginMessage, "Enter your email to receive a reset link.", false);
    return;
  }
  showMessage(loginMessage, "Sending password reset email...", true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/index.html"
  });
  if (error) showMessage(loginMessage, "Error: " + error.message, false);
  else showMessage(loginMessage, "Password reset email sent (check spam).", true);
});

goSignup?.addEventListener("click", () => {
  const email = (emailInput?.value || "").trim();
  const url = email ? `signup.html?email=${encodeURIComponent(email)}` : "signup.html";
  window.location.href = url;
});

// handle auth state changes (redirect if signed in elsewhere)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) {
    if (!location.pathname.endsWith("profile.html")) {
      location.href = "profile.html";
    }
  }
});

console.log("app.js loaded");
window._sb = supabase;
