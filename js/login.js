// js/login.js — v2 bridge
// Connects login.html's inline handlers to Firebase auth via authManager.
// Uses BOTH window._authHandlers (normal path) AND custom events (race-condition fallback).

import { authManager } from './auth.js';
import { auth, onAuthStateChanged } from './firebase.js';

// ── If already logged in, skip the login page ────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = '/index.html';
});

// ── Redirect helper ──────────────────────────────────────────────────────────
function redirectHome() {
  setTimeout(() => { window.location.href = '/index.html'; }, 1200);
}

// ── Core auth actions ─────────────────────────────────────────────────────────
async function doSignIn(email, password) {
  const result = await authManager.signInWithEmail(email, password);
  if (!result.success) throw new Error(result.error);
  redirectHome();
}

async function doSignUp(email, password, username) {
  const result = await authManager.registerWithEmail(email, password, username);
  if (!result.success) throw new Error(result.error);
  redirectHome();
}

async function doGoogle() {
  const result = await authManager.signInWithGoogle();
  if (!result.success) throw new Error(result.error);
  redirectHome();
}

// ── Primary path: window._authHandlers ───────────────────────────────────────
// login.html's inline functions call these directly when the module is ready.
window._authHandlers = {
  signIn: doSignIn,
  signUp: doSignUp,
  google: doGoogle,
};

// ── Fallback path: custom events ──────────────────────────────────────────────
// If the user clicks a button before this module finishes loading, login.html
// dispatches these events instead of calling _authHandlers. We handle both.
document.addEventListener('r7x:signin', async (e) => {
  const { email, pass } = e.detail;
  try { await doSignIn(email, pass); } catch (err) { console.error(err); }
});

document.addEventListener('r7x:signup', async (e) => {
  const { email, pass, username } = e.detail;
  try { await doSignUp(email, pass, username); } catch (err) { console.error(err); }
});

document.addEventListener('r7x:google', async () => {
  try { await doGoogle(); } catch (err) { console.error(err); }
});

console.log('[Rootrix] Auth handlers registered.');
