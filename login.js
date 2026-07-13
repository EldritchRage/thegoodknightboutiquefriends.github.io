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

    // Handle button click (button is type="button" now)
    const guestContinueBtn = document.getElementById("guest-continue-btn");
    if (guestContinueBtn) {
      guestContinueBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Validate required fields
        const firstName = guestCheckoutForm.elements.firstName.value.trim();
        const lastName = guestCheckoutForm.elements.lastName.value.trim();
        const email = guestCheckoutForm.elements.email.value.trim();
        const phone = guestCheckoutForm.elements.phone.value.trim();
        const address = guestCheckoutForm.elements.address.value.trim();
        const city = guestCheckoutForm.elements.city.value.trim();
        const state = guestCheckoutForm.elements.state.value.trim();
        const zip = guestCheckoutForm.elements.zip.value.trim();
        
        if (!firstName || !lastName || !email || !phone || !address || !city || !state || !zip) {
          setMessage("Please fill in all required fields.", true);
          return;
        }
        
        try {
          const formData = new FormData(guestCheckoutForm);
          saveGuestCheckoutInfo(formData);
          setMessage("Proceeding to cart...");
          setTimeout(() => {
            window.location.href = "cart.html";
          }, 300);
        } catch (error) {
          console.error("guest checkout click failed", error);
          setMessage("Could not proceed to checkout.", true);
        }
      });
    }
  }
}
