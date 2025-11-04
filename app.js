// app.js (module)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://xpvlejqxqdsjulbyloyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwdmxlanF4cWRzanVsYnlsb3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDc3MzIsImV4cCI6MjA3NzQ4MzczMn0.CHJ1C0U1Ipm8tEkyen4O9ZfXV0zUVSh6mxo8jZ5E3Pk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ----------------- INDEX PAGE ELEMENTS ----------------- */
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

/* ----------------- PROFILE PAGE ELEMENTS ----------------- */
const profilePage = document.getElementById("profile-page");
const avatarUpload = document.getElementById("avatar-upload");
const avatarPreview = document.getElementById("avatar-preview");
const profileFullname = document.getElementById("profile-fullname");
const profileEmail = document.getElementById("profile-email");
const pfFullName = document.getElementById("pf-full_name");
const pfUsername = document.getElementById("pf-username");
const pfBio = document.getElementById("pf-bio");
const saveProfileBtn = document.getElementById("save-profile");
const logoutBtn = document.getElementById("logout-btn");
const profileMessage = document.getElementById("profile-message");

/* ----------------- UTIL ----------------- */
function showAuthMessage(msg, success=true){ if(authMessage) { authMessage.textContent = msg; authMessage.style.color = success ? '#0b6b50' : '#b02a2a'; } }
function showSignupMessage(msg, success=true){ if(signupMessage) { signupMessage.textContent = msg; signupMessage.style.color = success ? '#0b6b50' : '#b02a2a'; } }
function showProfileMessage(msg, success=true){ if(profileMessage) { profileMessage.textContent = msg; profileMessage.style.color = success ? '#0b6b50' : '#b02a2a'; } }


/* ----------------- LOGIN ----------------- */
if (loginBtn) {
  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    showAuthMessage('', true);
    const email = (emailInput.value || '').trim();
    const password = (passwordInput.value || '').trim();
    if(!email || !password){ showAuthMessage('Please enter both email and password.', false); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error){ showAuthMessage('Login error: ' + error.message, false); return; }
    // Successful login -> redirect to profile page
    showAuthMessage('Login successful. Redirecting...', true);
    setTimeout(()=> { window.location.href = 'profile.html'; }, 600);
  });
}

/* ----------------- SIGNUP MODAL ----------------- */
if (openSignup) openSignup.addEventListener('click', ()=> signupModal.setAttribute('aria-hidden', 'false'));
if (closeSignup) closeSignup.addEventListener('click', ()=> { signupModal.setAttribute('aria-hidden','true'); signupMessage.textContent = ''; });
if (signupModal) signupModal.addEventListener('click', (ev)=> { if(ev.target === signupModal || ev.target.classList.contains('modal-backdrop')) { signupModal.setAttribute('aria-hidden','true'); signupMessage.textContent=''; } });

/* ----------------- SIGNUP ----------------- */
if (signupSubmit) {
  signupSubmit.addEventListener('click', async (ev) => {
    ev.preventDefault();
    showSignupMessage('', true);
    const full_name = (signupName.value||'').trim();
    const email = (signupEmail.value||'').trim();
    const password = (signupPassword.value||'').trim();
    if(!full_name || !email || !password){ showSignupMessage('Please fill all fields.', false); return; }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if(error){ showSignupMessage('Signup error: ' + error.message, false); return; }
    showSignupMessage('Signup successful! Please check your email to confirm (if required).', true);
    // Do not auto-redirect — option B (user must confirm email)
    setTimeout(()=>{ signupModal.setAttribute('aria-hidden','true'); signupForm.reset(); }, 1200);
  });
}

/* ----------------- PASSWORD RESET ----------------- */
const forgotLink = document.getElementById('forgot-link');
if (forgotLink) forgotLink.addEventListener('click', async (e)=>{
  e.preventDefault();
  const email = (emailInput.value||'').trim();
  if(!email){ showAuthMessage('Enter your email first to receive reset link.', false); return; }
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/profile.html' });
  if(error) showAuthMessage('Error: ' + error.message, false); else showAuthMessage('Password reset email sent (check spam).', true);
});

/* ----------------- PROFILE PAGE LOGIC ----------------- */
async function loadProfilePage(){
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if(!session){ // not logged in -> redirect to home
      window.location.href = 'index.html';
      return;
    }
    const user = session.user;
    // populate header
    if(profileFullname) profileFullname.textContent = user.user_metadata?.full_name || '';
    if(profileEmail) profileEmail.textContent = user.email || '';
    // load profile from DB
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if(!error && data){
      if(pfFullName) pfFullName.value = data.full_name || '';
      if(pfUsername) pfUsername.value = data.username || '';
      if(pfBio) pfBio.value = data.bio || '';
      if(avatarPreview && data.avatar_url) avatarPreview.src = data.avatar_url;
      if(profileFullname && (data.full_name)) profileFullname.textContent = data.full_name;
    }
  } catch(err){
    console.error('Error loading profile page', err);
    window.location.href = 'index.html';
  }
}

if (profilePage) {
  // initialize profile page when present
  loadProfilePage();
  // avatar upload handler
  if (avatarUpload) {
    avatarUpload.addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const { data: { session } } = await supabase.auth.getSession();
      if(!session){ showProfileMessage('You must be logged in to upload an avatar.', false); return; }
      const user = session.user;
      const ext = file.name.split('.').pop();
      const fileName = user.id + '.' + ext;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if(uploadError){ showProfileMessage('Upload error: ' + uploadError.message, false); return; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = data.publicUrl;
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      if(dbError){ showProfileMessage('Error saving avatar URL: ' + dbError.message, false); return; }
      if(avatarPreview) avatarPreview.src = avatarUrl;
      showProfileMessage('Avatar uploaded successfully!', true);
    });
  }
  // save profile
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async (e)=>{
      e.preventDefault();
      const { data: { session } } = await supabase.auth.getSession();
      if(!session){ showProfileMessage('You must be logged in to save profile.', false); return; }
      const user = session.user;
      const updates = {
        id: user.id,
        full_name: (pfFullName.value||'').trim(),
        username: (pfUsername.value||'').trim(),
        bio: (pfBio.value||'').trim(),
        updated_at: new Date()
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if(error){ showProfileMessage('Error saving profile: ' + error.message, false); } else { showProfileMessage('Profile saved!', true); }
    });
  }
  // logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async ()=>{
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }
}

/* ----------------- AUTH STATE CHANGE ----------------- */
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event', event, session);
});

/* ----------------- INIT ----------------- */
(function init(){ if(authMessage) authMessage.textContent=''; if(signupMessage) signupMessage.textContent=''; })();
