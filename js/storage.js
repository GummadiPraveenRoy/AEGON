/* ==========================================================================
   AEGON — localStorage layer
   Users/session, cart and wishlist all live in localStorage since this
   is a static front end that reads product data from data/products.json
   only (no auth/cart backend). Cart & wishlist logic leans on
   map / filter / reduce / find throughout, as requested.
   ========================================================================== */

const AegonStorage = (() => {
  const KEYS = {
    users: 'aegon_users',
    currentUser: 'aegon_current_user',
    cart: 'aegon_cart',
    wishlist: 'aegon_wishlist',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn(`AegonStorage: failed to read "${key}"`, err);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ---------------- Users / auth ----------------
  function getUsers() {
    return read(KEYS.users, []);
  }

  function findUserByEmail(email) {
    return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  function saveUser(user) {
    const users = getUsers();
    if (findUserByEmail(user.email)) {
      throw new Error('An account with this email already exists.');
    }
    write(KEYS.users, [...users, user]);
  }

  function validateLogin(email, password) {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) return null;
    return user;
  }

  function getCurrentUser() {
    const email = read(KEYS.currentUser, null);
    return email ? findUserByEmail(email) : null;
  }

  function setCurrentUser(email) {
    write(KEYS.currentUser, email);
  }

  function logout() {
    localStorage.removeItem(KEYS.currentUser);
  }

  // ---------------- Cart ----------------
  // Cart shape: [{ id: number, qty: number }, ...]
  function getCart() {
    return read(KEYS.cart, []);
  }

  function saveCart(cart) {
    write(KEYS.cart, cart);
    document.dispatchEvent(new CustomEvent('aegon:cart-updated', { detail: { cart } }));
  }

  function addToCart(id, qty = 1) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    const nextCart = existing
      ? cart.map((item) => (item.id === id ? { ...item, qty: item.qty + qty } : item))
      : [...cart, { id, qty }];
    saveCart(nextCart);
    return nextCart;
  }

  function setQty(id, qty) {
    const cart = getCart();
    // Dropping to zero (or below) removes the line entirely.
    const nextCart =
      qty < 1
        ? cart.filter((item) => item.id !== id)
        : cart.map((item) => (item.id === id ? { ...item, qty } : item));
    saveCart(nextCart);
    return nextCart;
  }

  function incrementCartItem(id) {
    const item = getCart().find((i) => i.id === id);
    return setQty(id, (item ? item.qty : 0) + 1);
  }

  function decrementCartItem(id) {
    const item = getCart().find((i) => i.id === id);
    return setQty(id, (item ? item.qty : 0) - 1);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter((item) => item.id !== id));
  }

  function clearCart() {
    saveCart([]);
  }

  function getCartCount() {
    return getCart().reduce((total, item) => total + item.qty, 0);
  }

  // products: array of full product objects (from the API) to price the cart against
  function getCartTotal(products) {
    const cart = getCart();
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.id);
      return product ? total + product.price * item.qty : total;
    }, 0);
  }

  // ---------------- Wishlist ----------------
  function getWishlist() {
    return read(KEYS.wishlist, []);
  }

  function isWishlisted(id) {
    return getWishlist().includes(id);
  }

  function toggleWishlist(id) {
    const list = getWishlist();
    const next = list.includes(id) ? list.filter((wid) => wid !== id) : [...list, id];
    write(KEYS.wishlist, next);
    document.dispatchEvent(new CustomEvent('aegon:wishlist-updated', { detail: { wishlist: next } }));
    return next;
  }

  return {
    getUsers,
    findUserByEmail,
    saveUser,
    validateLogin,
    getCurrentUser,
    setCurrentUser,
    logout,
    getCart,
    saveCart,
    addToCart,
    setQty,
    incrementCartItem,
    decrementCartItem,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartTotal,
    getWishlist,
    isWishlisted,
    toggleWishlist,
  };
})();
