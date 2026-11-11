/* ==========================================================================
   AEGON — shared nav behaviour (every page)
   Keeps the "Cart N" badge in sync with localStorage and swaps the
   account dropdown between guest (Login/Sign Up) and signed-in state.
   ========================================================================== */

(function () {
  function updateCartBadges() {
    const count = AegonStorage.getCartCount();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(count);
      // Hide the whole pill (not just the number) when the cart is empty,
      // otherwise an empty green dot lingers next to "Cart".
      const pill = el.closest('.badge') || el;
      pill.style.display = count > 0 ? '' : 'none';
    });
  }

  function updateAccountMenu() {
    const user = AegonStorage.getCurrentUser();
    const panel = document.querySelector('[data-account-panel]');
    if (!panel) return;

    if (user) {
      panel.innerHTML = `
        <a href="cart.html">My Cart</a>
        <a href="#" data-logout-btn>Logout (${escapeHtml(user.name.split(' ')[0])})</a>
      `;
      const logoutBtn = panel.querySelector('[data-logout-btn]');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          AegonStorage.logout();
          window.location.href = 'index.html';
        });
      }
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Global, delegated Add to Cart / wishlist handling — covers both
  // statically-authored cards (home page) and JS-rendered ones
  // (products.html), since delegation reads the target at click time.
  function bindGlobalProductActions() {
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-to-cart]');
      if (addBtn) {
        const id = Number(addBtn.dataset.addToCart);
        AegonStorage.addToCart(id, 1);
        const original = addBtn.innerHTML;
        addBtn.innerHTML = `<svg class="icon" width="16" height="16" aria-hidden="true"><use href="#icon-check"></use></svg> Added`;
        setTimeout(() => (addBtn.innerHTML = original), 1200);
      }
    });

    document.addEventListener('change', (e) => {
      const toggle = e.target.closest('[data-wishlist-toggle]');
      if (toggle) {
        AegonStorage.toggleWishlist(Number(toggle.dataset.wishlistToggle));
      }
    });

    // Pre-check wishlist toggles that are already saved, on load.
    document.querySelectorAll('[data-wishlist-toggle]').forEach((el) => {
      el.checked = AegonStorage.isWishlisted(Number(el.dataset.wishlistToggle));
    });
  }

  // Newsletter forms (footer / home / offers): validate, thank the user, remember the email.
  function bindNewsletters() {
    document.querySelectorAll('form.newsletter, form.newsletter-form').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"], input');
        const email = input ? input.value.trim() : '';
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          input.setCustomValidity('Please enter a valid email address.');
          input.reportValidity();
          input.setCustomValidity('');
          return;
        }
        try {
          const list = JSON.parse(localStorage.getItem('aegon_newsletter') || '[]');
          if (!list.includes(email)) localStorage.setItem('aegon_newsletter', JSON.stringify([...list, email]));
        } catch (err) {}
        form.innerHTML = '<p style="font-weight:600;">Thanks for subscribing! Fresh offers are on the way.</p>';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindNewsletters();
    updateCartBadges();
    updateAccountMenu();
    bindGlobalProductActions();
  });
  document.addEventListener('aegon:cart-updated', updateCartBadges);
})();
