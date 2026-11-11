/* ==========================================================================
   AEGON — Cart page (cart.html)
   Renders cart lines from localStorage cross-referenced against the
   Express API's product catalog, and wires increment/decrement/remove
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
    const discount = Math.max(0, oldSubtotal - subtotal);

    itemCountLabel.textContent = `Subtotal (${itemCount} item${itemCount === 1 ? '' : 's'})`;
    subtotalEl.textContent = money(subtotal);
    discountEl.textContent = `−${money(discount)}`;
    totalEl.textContent = money(subtotal);
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
      const res = await fetch(`${AEGON_API_BASE}/products?limit=100`);
      const data = await res.json();
      products = data.products;
    } catch (err) {
      itemsList.innerHTML = `<p class="text-muted">Couldn't reach the AEGON API. ${err.message}</p>`;
    }
    render();
  }

  init();
})();
