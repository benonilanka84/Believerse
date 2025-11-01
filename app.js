// Initialize Supabase
const supabaseUrl = "https://xpvlejqxqdsjulbyloyn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk"; // Replace with your anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const messageEl = document.getElementById("message");
const userSection = document.getElementById("user-section");
const authSection = document.getElementById("auth-section");
const userEmailEl = document.getElementById("user-email");

// ---------------- SIGNUP ----------------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = signupForm.email.value;
  const password = signupForm.password.value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    messageEl.textContent = "Signup Error: " + error.message;
  } else {
    messageEl.textContent =
      "Signup successful! Please check your email to verify your account.";
  }
});

// ---------------- LOGIN ----------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    messageEl.textContent = "Login Error: " + error.message;
  } else {
    messageEl.textContent = "Login successful!";
    updateUI();
  }
});

// ---------------- LOGOUT ----------------
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  messageEl.textContent = "Logged out successfully!";
  updateUI();
});

// ---------------- SESSION LISTENER ----------------
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event);
  updateUI();
});

// ---------------- UPDATE UI ----------------
async function updateUI() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    authSection.style.display = "none";
    userSection.style.display = "block";
    userEmailEl.textContent = user.email;
  } else {
    authSection.style.display = "block";
    userSection.style.display = "none";
  }
}

// Run once on page load
updateUI();
