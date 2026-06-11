import {
  getLoginRedirectUrl,
  isAuthConfigured,
  register,
  signIn,
  watchAuth
} from "./auth-service.js";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");

function setMessage(text, isError = false) {
  authMessage.textContent = text;
  authMessage.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

function redirectAfterLogin() {
  window.location.href = getLoginRedirectUrl("cart.html");
}

if (!isAuthConfigured()) {
  setMessage("Firebase is not configured. Check firebase-config.js.", true);
} else {
  watchAuth((user) => {
    if (user) {
      redirectAfterLogin();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("Signing in...");
    try {
      await signIn(
        loginForm.elements.email.value.trim(),
        loginForm.elements.password.value
      );
      setMessage("Signed in. Redirecting...");
      redirectAfterLogin();
    } catch (error) {
      console.error("login failed", error);
      setMessage(error.message || "Could not sign in.", true);
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("Creating account...");
    try {
      await register(
        registerForm.elements.email.value.trim(),
        registerForm.elements.password.value
      );
      setMessage("Account created. Redirecting...");
      redirectAfterLogin();
    } catch (error) {
      console.error("register failed", error);
      setMessage(error.message || "Could not create account.", true);
    }
  });
}
