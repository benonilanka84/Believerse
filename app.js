// ---------- SUPABASE INIT ----------
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://YOUR_PROJECT_URL.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const authSection = document.getElementById("auth-section");
const profileSection = document.getElementById("profile-section");
const logoutBtn = document.getElementById("logout-btn");
const messageEl = document.getElementById("message");

// ---------- SIGNUP ----------
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) messageEl.textContent = "Signup error: " + error.message;
  else messageEl.textContent = "Signup successful! Check your email for verification.";
});

// ---------- LOGIN ----------
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) messageEl.textContent = "Login error: " + error.message;
  else {
    messageEl.textContent = "Login successful!";
    loadUserProfile();
  }
});

// ---------- LOGOUT ----------
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  profileSection.style.display = "none";
  authSection.style.display = "block";
  logoutBtn.style.display = "none";
  messageEl.textContent = "Logged out successfully.";
});

// ---------- LOAD PROFILE ----------
async function loadUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
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

  const { error } = await supabase.from("profiles").upsert(updates);
  if (error) alert("Error saving profile: " + error.message);
  else alert("Profile updated successfully!");
});

// ---------- AUTO LOGIN CHECK ----------
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) loadUserProfile();
});
