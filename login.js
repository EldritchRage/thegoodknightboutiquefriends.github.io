import {
  getLoginRedirectUrl,
  isAuthConfigured,
  register,
  signIn,
  watchAuth
} from "./auth-service.js";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const guestCheckoutForm = document.getElementById("guest-checkout-form");
const authMessage = document.getElementById("auth-message");

function setMessage(text, isError = false) {
  authMessage.textContent = text;
  authMessage.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

function redirectAfterLogin() {
  window.location.href = getLoginRedirectUrl("cart.html");
}

function saveGuestCheckoutInfo(formData) {
  const guestInfo = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    apartment: formData.get("apartment"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    country: formData.get("country"),
    isGuest: true
  };
  localStorage.setItem("guestCheckoutInfo", JSON.stringify(guestInfo));
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

  // In case the guest form is submitted normally
  if (guestCheckoutForm) {
    guestCheckoutForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage("Processing guest checkout...");
      try {
        const formData = new FormData(guestCheckoutForm);
        saveGuestCheckoutInfo(formData);
        setMessage("Proceeding to cart...");
        window.location.href = "cart.html";
      } catch (error) {
        console.error("guest checkout failed", error);
        setMessage("Could not proceed to checkout.", true);
      }
    });

    // Also handle button click (button is type="button" now)
    const guestContinueBtn = document.getElementById("guest-continue-btn");
    if (guestContinueBtn) {
      guestContinueBtn.addEventListener("click", (e) => {
        try {
          const formData = new FormData(guestCheckoutForm);
          saveGuestCheckoutInfo(formData);
          setMessage("Proceeding to cart...");
          window.location.href = "cart.html";
        } catch (error) {
          console.error("guest checkout click failed", error);
          setMessage("Could not proceed to checkout.", true);
        }
      });
    }
  }
}
