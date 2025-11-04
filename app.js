// app.js (module)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ------------------ CONFIG - replace with your values ------------------ */
const SUPABASE_URL = "https://xpvlejqxqdsjulbyloyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk";
/* ---------------------------------------------------------------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const openSignup = document.getElementById("open-signup");
const authMessage = document.getElementById("auth-message");
const logoutBtn = document.getElementById("logout-btn");

const signupModal = document.getElementById("signup-modal");
const closeSignup = document.getElementById("close-signup");
const signupForm = document.getElementById("signup-form");
const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupSubmit = document.getElementById("signup-submit");
const signupMessage = document.getElementById("signup-message");

const profileSection = document.getElementById("profile-section"); // not used in this page but left for consistency

/* ------------------- Utility ------------------- */
function showAuthMessage(msg, success = true) {
  authMessage.textContent = msg;
  authMessage.style.color = success ? "#0b6b50" : "#b02a2a";
}

/* ------------------- LOGIN ------------------- */
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  showAuthMessage("", true);

  const email = (emailInput.value || "").trim();
  const password = (passwordInput.value || "").trim();

  if (!email || !password) {
    showAuthMessage("Please enter both email and password.", false);
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      showAuthMessage("Login error: " + error.message, false);
      return;
    }
    showAuthMessage("Login successful! Redirecting...", true);
    // On successful login, the onAuthStateChange listener will run and show profile page if implemented.
    // For this page we'll just show success.
    setTimeout(() => location.reload(), 700);
  } catch (err) {
    showAuthMessage("Unexpected error: " + err.message, false);
  }
});

/* ------------------- OPEN/CLOSE SIGNUP MODAL ------------------- */
openSignup.addEventListener("click", () => {
  signupModal.setAttribute("aria-hidden", "false");
});
closeSignup.addEventListener("click", () => {
  signupModal.setAttribute("aria-hidden", "true");
  signupMessage.textContent = "";
});

/* Close modal when clicking backdrop */
signupModal.addEventListener("click", (ev) => {
  if (ev.target === signupModal || ev.target.classList.contains("modal-backdrop")) {
    signupModal.setAttribute("aria-hidden", "true");
    signupMessage.textContent = "";
  }
});

/* ------------------- SIGNUP ------------------- */
signupSubmit.addEventListener("click", async (ev) => {
  ev.preventDefault();
  signupMessage.textContent = "";
  const full_name = (signupName.value || "").trim();
  const email = (signupEmail.value || "").trim();
  const password = (signupPassword.value || "").trim();

  if (!full_name || !email || !password) {
    signupMessage.textContent = "Please fill all fields.";
    signupMessage.style.color = "#b02a2a";
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      signupMessage.textContent = "Signup error: " + error.message;
      signupMessage.style.color = "#b02a2a";
      return;
    }

    // If user object is returned immediately (rare when email confirmation is off), create profile now.
    if (data?.user) {
      const userId = data.user.id;
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: userId,
        email,
        full_name,
        updated_at: new Date(),
      });
      if (upsertError) {
        // Not fatal; show message but still inform user to check email.
        console.warn("Profile upsert error:", upsertError);
      }
    }

    signupMessage.textContent =
      "Signup successful! Please check your email to confirm (if required).";
    signupMessage.style.color = "#0b6b50";

    // close modal after short delay
    setTimeout(() => {
      signupModal.setAttribute("aria-hidden","true");
      signupForm.reset();
    }, 1400);

  } catch (err) {
    signupMessage.textContent = "Unexpected error: " + err.message;
    signupMessage.style.color = "#b02a2a";
  }
});

/* ------------------- PASSWORD RESET (simple) ------------------- */
document.getElementById("forgot-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = (emailInput.value || "").trim();
  if (!email) {
    showAuthMessage("Enter your email first to receive reset link.", false);
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) showAuthMessage("Error: " + error.message, false);
  else showAuthMessage("Password reset email sent (check spam).", true);
});

/* ------------------- AUTH STATE CHANGE (optional) ------------------- */
supabase.auth.onAuthStateChange((event, session) => {
  // You can use this to redirect to a protected page, or auto-load profile.
  // Example: if(session) { window.location.href = '/dashboard.html' }
  console.log("Auth event:", event, session);
});

/* ------------------- INIT UI ------------------- */
(function init(){
  // Nothing special required initially. Clear messages.
  authMessage.textContent = "";
})();
