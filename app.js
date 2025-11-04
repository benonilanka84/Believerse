// ---------- SUPABASE INIT ----------
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://xpvlejqxqdsjulbyloyn.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk";
const supabase = createClient(supabaseUrl, supabaseKey);

const authSection = document.getElementById("auth-section");
const profileSection = document.getElementById("profile-section");
const messageEl = document.getElementById("message");
const logoutBtn = document.getElementById("logout-btn");
const authForm = document.getElementById("auth-form");

// ---------- SIGNUP ----------
document.getElementById("signup-btn").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = authForm.email.value.trim();
  const password = authForm.password.value.trim();

  if (!email || !password) {
    messageEl.textContent = "Please enter both email and password.";
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    messageEl.textContent = "Signup error: " + error.message;
  } else {
    messageEl.textContent =
      "Signup successful! Check your email for verification.";
  }
});

// ---------- LOGIN ----------
document.getElementById("login-btn").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = authForm.email.value.trim();
  const password = authForm.password.value.trim();

  if (!email || !password) {
    messageEl.textContent = "Please enter both email and password.";
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    messageEl.textContent = "Login error: " + error.message;
  } else {
    messageEl.textContent = "Login successful!";
    loadUserProfile();
  }
});

// ---------- LOGOUT ----------
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  authSection.style.display = "block";
  profileSection.style.display = "none";
  logoutBtn.style.display = "none";
  messageEl.textContent = "Logged out successfully.";
});

// ---------- LOAD PROFILE ----------
async function loadUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  authSection.style.display = "none";
  profileSection.style.display = "block";
  logoutBtn.style.display = "inline-block";

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, username, bio")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    messageEl.textContent = "Error loading profile: " + error.message;
    return;
  }

  document.getElementById("full_name").value = data?.full_name || "";
  document.getElementById("username").value = data?.username || "";
  document.getElementById("bio").value = data?.bio || "";
}

// ---------- UPDATE PROFILE ----------
document
  .getElementById("profile-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updates = {
      id: user.id,
      full_name: document.getElementById("full_name").value,
      username: document.getElementById("username").value,
      bio: document.getElementById("bio").value,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);
    if (error) alert("Error saving profile: " + error.message);
    else alert("Profile updated successfully!");
  });

// ---------- AUTO LOGIN CHECK ----------
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) loadUserProfile();
});
