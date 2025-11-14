// app.js (replace your file with this entire contents)
// Make sure your index.html includes: <script type="module" src="./app.js"></script>

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ------------------ CONFIG - replace with your values ------------------ */
const SUPABASE_URL = "https://xpvlejqxqdsjulbyloyn.supabase.co"; // <-- keep your URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk"; // <-- keep your anon key
/* ---------------------------------------------------------------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- DOM elements (guarded) ---------- */
const el = (id) => document.getElementById(id);
const authCard = document.querySelector(".auth-card");
const authForm = el("auth-form");
const emailInput = el("email");
const passwordInput = el("password");
const loginBtn = el("login-btn");
const openSignup = el("open-signup");
const authMessage = el("auth-message");

const signupModal = el("signup-modal");
const closeSignup = el("close-signup");
const signupForm = el("signup-form");
const signupName = el("signup-name");
const signupEmail = el("signup-email");
const signupPassword = el("signup-password");
const signupSubmit = el("signup-submit");
const signupMessage = el("signup-message");

const profileSection = el("profile-section");
const userEmailDisplay = el("user-email-display");
const avatarUpload = el("avatar-upload");
const avatarPreview = el("avatar-preview");
const profileForm = el("profile-form");
const fullNameInput = el("full_name");
const usernameInput = el("username");
const bioInput = el("bio");
const saveProfileBtn = profileForm ? profileForm.querySelector('button[type="submit"]') : null;
const logoutBtn = el("logout-btn");

/* utility */
function showMessage(targetEl, msg, ok = true) {
  if (!targetEl) return;
  targetEl.textContent = msg;
  targetEl.style.color = ok ? "#0b6b50" : "#b02a2a";
}

/* ---------- UI helpers ---------- */
function showProfileUI(user) {
  if (authCard) authCard.style.display = "none";
  if (profileSection) profileSection.style.display = "block";
  if (userEmailDisplay) userEmailDisplay.textContent = user?.email || "";
}

function showAuthUI() {
  if (authCard) authCard.style.display = "";
  if (profileSection) profileSection.style.display = "none";
  if (authMessage) authMessage.textContent = "";
}

/* ---------- Load user profile from Supabase ---------- */
async function loadUserProfile() {
  try {
    const { data: getUser } = await supabase.auth.getUser();
    const user = getUser?.user;
    if (!user) {
      showAuthUI();
      return null;
    }

    showProfileUI(user);

    // fetch profile row
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, bio, avatar_url")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Profile fetch error (non-empty):", error);
    }

    // populate fields if data exists
    fullNameInput.value = data?.full_name || "";
    usernameInput.value = data?.username || "";
    bioInput.value = data?.bio || "";

    if (data?.avatar_url) {
      try {
        // if we saved a public url string already
        avatarPreview.src = data.avatar_url;
      } catch (err) {
        console.warn("Could not set avatar preview:", err);
      }
    }

    return user;
  } catch (err) {
    console.error("loadUserProfile error:", err);
    showAuthUI();
    return null;
  }
}

/* ---------- Avatar preview & upload helper ---------- */
let avatarFile = null; // store selected file until save

if (avatarUpload) {
  avatarUpload.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    avatarFile = f;

    // show preview locally
    const url = URL.createObjectURL(f);
    if (avatarPreview) avatarPreview.src = url;
  });
}

/* ---------- SIGNUP handling (modal) ---------- */
if (openSignup) {
  openSignup.addEventListener("click", () => {
    if (!signupModal) return;
    signupModal.setAttribute("aria-hidden", "false");
  });
}
if (closeSignup) {
  closeSignup.addEventListener("click", () => {
    if (!signupModal) return;
    signupModal.setAttribute("aria-hidden", "true");
    signupMessage.textContent = "";
    signupForm.reset();
  });
}

/* Sign up */
if (signupSubmit) {
  signupSubmit.addEventListener("click", async (ev) => {
    ev.preventDefault();
    signupMessage.textContent = "";
    const full_name = (signupName.value || "").trim();
    const email = (signupEmail.value || "").trim();
    const password = (signupPassword.value || "").trim();

    if (!full_name || !email || !password) {
      signupMessage.textContent = "Please provide name, email and password.";
      signupMessage.style.color = "#b02a2a";
      return;
    }

    signupSubmit.disabled = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        signupMessage.textContent = "Signup error: " + error.message;
        signupMessage.style.color = "#b02a2a";
        console.error("signup error:", error);
        return;
      }

      // if user object is returned immediately (rare), create profile
      if (data?.user) {
        const userId = data.user.id;
        const { error: upsertErr } = await supabase.from("profiles").upsert({
          id: userId,
          email,
          full_name,
          updated_at: new Date()
        });
        if (upsertErr) console.warn("profile upsert error:", upsertErr);
      }

      signupMessage.textContent = "Signup successful — check email to confirm (if required).";
      signupMessage.style.color = "#0b6b50";

      // close modal
      setTimeout(() => {
        signupModal.setAttribute("aria-hidden", "true");
        signupForm.reset();
      }, 1200);
    } catch (err) {
      signupMessage.textContent = "Unexpected error: " + err.message;
      signupMessage.style.color = "#b02a2a";
      console.error(err);
    } finally {
      signupSubmit.disabled = false;
    }
  });
}

/* ---------- LOGIN ---------- */
if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage(authMessage, "Please enter both email and password.", false);
    return;
  }

  loginBtn.disabled = true;
  showMessage(authMessage, "Signing in...", true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        showMessage(authMessage, "Account not found. Redirecting to signup...", false);
        setTimeout(() => { window.location.href = "signup.html"; }, 1300);
        return;
      }

      showMessage(authMessage, "Login failed: " + error.message, false);
      return;
    }

    // SUCCESS — REDIRECT TO PROFILE PAGE
    window.location.href = "profile.html";

  } catch (err) {
    showMessage(authMessage, "Unexpected error: " + err.message, false);
  } finally {
    loginBtn.disabled = false;
  }
});


/* ---------- LOGOUT ---------- */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    logoutBtn.disabled = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("signOut error:", error);
      }
      // clear UI
      showAuthUI();
      // reset profile fields
      if (profileForm) profileForm.reset();
      if (avatarPreview) avatarPreview.src = "https://via.placeholder.com/120";
      avatarFile = null;
    } catch (err) {
      console.error("logout err:", err);
    } finally {
      logoutBtn.disabled = false;
    }
  });
}

/* ---------- SAVE PROFILE ---------- */
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!fullNameInput || !usernameInput) return;

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving...";

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        alert("No authenticated user. Please login again.");
        showAuthUI();
        return;
      }

      const updates = {
        id: user.id,
        full_name: fullNameInput.value.trim() || null,
        username: usernameInput.value.trim() || null,
        bio: bioInput.value.trim() || null,
        updated_at: new Date()
      };

      // If an avatar file was chosen, upload it first
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${ext}`;
        const filePath = fileName;

        // Upload to avatars bucket (make sure bucket exists & policy allows)
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error("Avatar upload failed: " + uploadError.message);
        }

        // Get public URL (public bucket) or create signed URL for private
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        updates.avatar_url = data?.publicUrl || null;
      }

      // Upsert profile row
      const { error: upsertError } = await supabase.from("profiles").upsert(updates);
      if (upsertError) {
        throw upsertError;
      }

      alert("Profile updated successfully!");
      avatarFile = null;
      // reload profile to reflect any changes
      await loadUserProfile();
    } catch (err) {
      console.error("save profile error:", err);
      alert("Error saving profile: " + (err.message || err));
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = "Save Profile";
    }
  });
}

/* ---------- FORGOT PASSWORD ---------- */
const forgotLink = el("forgot-link");
if (forgotLink) {
  forgotLink.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const email = (emailInput.value || "").trim();
    if (!email) {
      showMessage(authMessage, "Enter your email first to receive reset link.", false);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) showMessage(authMessage, "Error: " + error.message, false);
    else showMessage(authMessage, "Password reset email sent (check spam).", true);
  });
}

/* ---------- AUTH STATE CHANGE ---------- */
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("onAuthStateChange", event, session);
  if (session?.access_token) {
    // logged in
    const { data: getUser } = await supabase.auth.getUser();
    const user = getUser?.user;
    if (user) {
      await loadUserProfile();
    } else {
      showAuthUI();
    }
  } else {
    // logged out
    showAuthUI();
  }
});

/* ---------- INIT ---------- */
(async function init() {
  console.log("APP.JS IS RUNNING");
  // initial UI state
  showAuthUI();

  // if already logged in (session persisted), load profile
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      // session exists, load profile
      await loadUserProfile();
    } else {
      showAuthUI();
    }
  } catch (err) {
    console.warn("init auth check failed:", err);
    showAuthUI();
  }
})();
