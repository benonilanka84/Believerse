// ---------------------------------------------------------------
// SUPABASE INIT
// ---------------------------------------------------------------
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://xpvlejqxqdsjulbyloyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk"; // keep your real key here
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const openSignup = document.getElementById("open-signup");
const authMessage = document.getElementById("auth-message");

const signupModal = document.getElementById("signup-modal");
const closeSignup = document.getElementById("close-signup");
const signupForm = document.getElementById("signup-form");
const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupSubmit = document.getElementById("signup-submit");
const signupMessage = document.getElementById("signup-message");

// Profile DOM
const profileSection = document.getElementById("profile-section");
const avatarUpload = document.getElementById("avatar-upload");
const avatarPreview = document.getElementById("avatar-preview");
const logoutBtn = document.getElementById("logout-btn");

// ---------------------------------------------------------------
// SHOW MESSAGE
// ---------------------------------------------------------------
function showAuthMessage(msg, success = true) {
  authMessage.textContent = msg;
  authMessage.style.color = success ? "#0b6b50" : "#b02a2a";
}

// ---------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showAuthMessage("Login error: " + error.message, false);

  showAuthMessage("Login successful!");
});

// ---------------------------------------------------------------
// SIGNUP MODAL OPEN/CLOSE
// ---------------------------------------------------------------
openSignup.addEventListener("click", () => signupModal.setAttribute("aria-hidden", "false"));
closeSignup.addEventListener("click", () => signupModal.setAttribute("aria-hidden", "true"));

// ---------------------------------------------------------------
// SIGNUP SUBMIT
// ---------------------------------------------------------------
signupSubmit.addEventListener("click", async () => {
  const full_name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    signupMessage.textContent = "Signup error: " + error.message;
    signupMessage.style.color = "#b02a2a";
    return;
  }

  signupMessage.textContent = "Signup successful! Check your email.";
  signupMessage.style.color = "#0b6b50";

  // Create profile record
  await supabase.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name,
  });

  setTimeout(() => signupModal.setAttribute("aria-hidden", "true"), 1500);
});

// ---------------------------------------------------------------
// LOAD USER PROFILE
// ---------------------------------------------------------------
async function loadUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  document.getElementById("user-email-display").textContent = user.email;

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  document.getElementById("full_name").value = profile?.full_name || "";
  document.getElementById("username").value = profile?.username || "";
  document.getElementById("bio").value = profile?.bio || "";
  if (profile?.avatar_url) avatarPreview.src = profile.avatar_url;

  // Show profile section
  document.querySelector(".right").style.display = "none";
  profileSection.style.display = "block";
}

// ---------------------------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------------------------
document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const { data: { user } } = await supabase.auth.getUser();

  const updates = {
    id: user.id,
    full_name: document.getElementById("full_name").value,
    username: document.getElementById("username").value,
    bio: document.getElementById("bio").value,
    updated_at: new Date()
  };

  await supabase.from("profiles").upsert(updates);
  alert("Profile updated!");
});

// ---------------------------------------------------------------
// AVATAR UPLOAD
// ---------------------------------------------------------------
avatarUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const { data: { user } } = await supabase.auth.getUser();
  const ext = file.name.split(".").pop();
  const fileName = `${user.id}.${ext}`;

  // Upload
  await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });

  // Get URL
  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  const url = data.publicUrl;

  avatarPreview.src = url;

  // Save to profile
  await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);

  alert("Profile picture updated!");
});

// ---------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

// ---------------------------------------------------------------
// AUTH STATE LISTENER (CORRECTED)
// ---------------------------------------------------------------
supabase.auth.onAuthStateChange(async (event, session) => {
  const loginArea = document.querySelector(".right");

  if (session) {
    // User logged in
    loginArea.style.display = "none";
    profileSection.style.display = "block";
    await loadUserProfile();
  } else {
    // User logged out or first visit
    loginArea.style.display = "block";
    profileSection.style.display = "none";
  }
});

(async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const loginArea = document.querySelector(".right");

  if (session) {
    loginArea.style.display = "none";
    profileSection.style.display = "block";
    await loadUserProfile();
  } else {
    loginArea.style.display = "block";
    profileSection.style.display = "none";
  }
})();
