/* ==========================================================================
   AEGON — signup / login (localStorage-backed, no server auth)
   Signup stores the new account in localStorage. Login validates the
   entered email/password against those stored accounts and only then
   navigates to the home page.
   ========================================================================== */

(function () {
  function showError(el, message) {
    el.textContent = message;
    el.style.display = 'block';
  }

  function hideError(el) {
    el.style.display = 'none';
  }

  // ---------------- Signup ----------------
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('signup-error');
      hideError(errorEl);

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      const termsAccepted = document.getElementById('signup-terms').checked;

      if (!name || !email || !phone || !password || !confirm) {
        showError(errorEl, 'Please fill in every field.');
        return;
      }
      if (password.length < 8) {
        showError(errorEl, 'Password must be at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        showError(errorEl, 'Passwords do not match.');
        return;
      }
      if (!termsAccepted) {
        showError(errorEl, 'Please accept the Terms of Service to continue.');
        return;
      }

      try {
        AegonStorage.saveUser({ name, email, phone, password });
      } catch (err) {
        showError(errorEl, err.message);
        return;
      }

      // Credentials are stored; the user still has to log in with them
      // (matches the "signup stores, login validates" flow) before
      // reaching the home page.
      window.location.href = `login.html?justRegistered=1&email=${encodeURIComponent(email)}`;
    });
  }

  // ---------------- Login ----------------
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('justRegistered') === '1') {
      const errorEl = document.getElementById('login-error');
      errorEl.style.background = 'var(--color-success-light)';
      errorEl.style.color = 'var(--color-success)';
      showError(errorEl, 'Account created! Log in with your new credentials to continue.');
      const emailInput = document.getElementById('login-email');
      if (emailInput && params.get('email')) emailInput.value = params.get('email');
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('login-error');
      errorEl.style.background = 'hsl(4, 86%, 95%)';
      errorEl.style.color = 'hsl(4, 86%, 58%)';
      hideError(errorEl);

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const user = AegonStorage.validateLogin(email, password);
      if (!user) {
        showError(errorEl, 'Incorrect email or password. Please try again, or sign up first.');
        return;
      }

      AegonStorage.setCurrentUser(user.email);
      window.location.href = 'index.html';
    });
  }
})();
