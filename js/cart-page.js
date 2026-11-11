/* ==========================================================================
   AEGON — Cart page (cart.html)
   Renders cart lines from localStorage cross-referenced against
   data/products.json, and wires increment/decrement/remove
   plus the order summary totals — all via map/filter/reduce/find.
   ========================================================================== */

(function () {
  const layout = document.getElementById('cart-layout');
  if (!layout) return; // not on the cart page

  const itemsList = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const itemCountLabel = document.getElementById('cart-item-count-label');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountEl = document.getElementById('cart-discount');
  const totalEl = document.getElementById('cart-total');

  let products = [];
  let cartTotal = 0;

  // Coupon codes (percent off the subtotal) — remembered in localStorage.
  const COUPONS = { WELCOME50: 0.5, FRESH10: 0.1 };
  let coupon = null;
  try { coupon = localStorage.getItem('aegon_coupon'); } catch (e) {}
  if (!COUPONS[coupon]) coupon = null;

  const couponInput = document.getElementById('coupon-input');
  const couponBtn = document.getElementById('coupon-apply');
  const couponMsg = document.getElementById('coupon-msg');
  const checkoutBtn = document.getElementById('checkout-btn');

  function setCouponMsg(text, ok) {
    couponMsg.textContent = text;
    couponMsg.style.color = ok ? 'hsl(152, 68%, 42%)' : 'hsl(4, 86%, 58%)';
  }
  if (coupon) {
    couponInput.value = coupon;
    setCouponMsg(`${coupon} applied — ${COUPONS[coupon] * 100}% off`, true);
  }

  couponBtn.addEventListener('click', () => {
    const code = couponInput.value.trim().toUpperCase();
    if (!COUPONS[code]) {
      coupon = null;
      try { localStorage.removeItem('aegon_coupon'); } catch (e) {}
      setCouponMsg(code ? 'Invalid coupon code.' : 'Enter a coupon code first.', false);
    } else {
      coupon = code;
      try { localStorage.setItem('aegon_coupon', code); } catch (e) {}
      setCouponMsg(`${code} applied — ${COUPONS[code] * 100}% off`, true);
    }
    render();
  });

  // Checkout: must be logged in, then the order is "placed" and the cart emptied.
  checkoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!AegonStorage.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    const orderNo = 'AEG' + Math.floor(10000 + Math.random() * 90000);
    const total = money(cartTotal);
    AegonStorage.clearCart();
    try { localStorage.removeItem('aegon_coupon'); } catch (e2) {}
    coupon = null;
    emptyState.innerHTML = `<h3>Order ${orderNo} placed!</h3>
      <p class="text-muted" style="max-width:40ch;">Thanks ${AegonStorage.getCurrentUser().name}. Your total of ${total} is on its way — delivery in about 15 minutes.</p>
      <a href="./product.html" class="btn btn--primary btn--lg">Continue Shopping</a>`;
    render();
  });

  function money(v) {
    return `$${v.toFixed(2)}`;
  }

  function cartItemHtml(item, product) {
    const lineTotal = product.price * item.qty;
    const lineOldTotal = product.oldPrice * item.qty;
    return `
      <article class="cart-item" data-cart-item="${product.id}">
        <div class="cart-item__media" style="${product.frontImage ? '' : 'background: var(--gradient-primary);'} display:grid; place-items:center; overflow:hidden;">
          ${
            product.frontImage
              ? `<img src="${product.frontImage}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;" />`
              : `<svg class="icon" style="width:40px; height:40px; color:var(--color-white);" aria-hidden="true"><use href="#${product.icon}"></use></svg>`
          }
        </div>
        <div class="cart-item__body">
          <div class="cart-item__top">
            <div>
              <span class="product-card__category">${product.categoryLabel}</span>
              <h3 style="font-size:var(--fs-md);"><a href="singlepage.html?id=${product.id}" style="color:inherit;">${product.name}</a></h3>
            </div>
            <button type="button" class="cart-item__remove" data-remove="${product.id}" aria-label="Remove ${product.name} from cart">
              <svg class="icon" width="20" height="20" aria-hidden="true"><use href="#icon-trash"></use></svg>
            </button>
          </div>
          <div class="cart-item__footer">
            <div class="qty-stepper" role="group" aria-label="Quantity for ${product.name}">
              <button type="button" class="qty-stepper__btn" data-dec="${product.id}" aria-label="Decrease quantity">&minus;</button>
              <span class="qty-stepper__value">${item.qty}</span>
              <button type="button" class="qty-stepper__btn" data-inc="${product.id}" aria-label="Increase quantity">+</button>
            </div>
            <div>
              <strong style="font-size:var(--fs-lg);">${money(lineTotal)}</strong>
              <span class="product-card__price-old">${money(lineOldTotal)}</span>
            </div>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const cart = AegonStorage.getCart();

    if (cart.length === 0) {
      layout.style.display = 'none';
      emptyState.style.display = '';
      return;
    }
    layout.style.display = '';
    emptyState.style.display = 'none';

    // Cross-reference cart lines with product data via find(); drop any
    // line whose product id no longer exists in the catalog.
    const lines = cart
      .map((item) => ({ item, product: products.find((p) => p.id === item.id) }))
      .filter((line) => Boolean(line.product));

    itemsList.innerHTML = lines.map((line) => cartItemHtml(line.item, line.product)).join('');

    const itemCount = cart.reduce((total, item) => total + item.qty, 0);
    const subtotal = lines.reduce((total, line) => total + line.product.price * line.item.qty, 0);
    const oldSubtotal = lines.reduce((total, line) => total + line.product.oldPrice * line.item.qty, 0);
    const couponOff = coupon ? subtotal * COUPONS[coupon] : 0;
    const discount = Math.max(0, oldSubtotal - subtotal) + couponOff;

    itemCountLabel.textContent = `Subtotal (${itemCount} item${itemCount === 1 ? '' : 's'})`;
    subtotalEl.textContent = money(subtotal);
    discountEl.textContent = `−${money(discount)}`;
    totalEl.textContent = money(subtotal - couponOff);
    cartTotal = subtotal - couponOff;
  }

  itemsList.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const remove = e.target.closest('[data-remove]');

    if (inc) AegonStorage.incrementCartItem(Number(inc.dataset.inc));
    if (dec) AegonStorage.decrementCartItem(Number(dec.dataset.dec)); // drops to 0 removes the line
    if (remove) AegonStorage.removeFromCart(Number(remove.dataset.remove));
  });

  document.addEventListener('aegon:cart-updated', render);

  async function init() {
    try {
      products = await AegonData.getProducts();
    } catch (err) {
      itemsList.innerHTML = `<p class="text-muted">Couldn't load products. ${err.message}</p>`;
    }
    render();
  }

  init();
})();
