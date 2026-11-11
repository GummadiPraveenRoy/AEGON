/* ==========================================================================
   AEGON — Home page (index.html)
   Populates "Today's Offers", "Popular Products" and "Flash Sale" from
   the live product API instead of hardcoded cards, reusing the same
   Add to Cart / wishlist data-attributes that js/nav.js already wires
   up globally.
   ========================================================================== */

(function () {
  const offersGrid = document.querySelector('#offers .product-grid');
  const popularGrid = document.querySelector('#popular .product-grid');
  const flashGrid = document.querySelector('#flash-sale .product-grid');
  if (!offersGrid && !popularGrid && !flashGrid) return; // not on the home page

  function money(v) {
    return `$${v.toFixed(2)}`;
  }

  function badgeClassFor(badge) {
    if (badge.startsWith('-')) return 'badge--danger';
    if (badge === 'New') return 'badge--success';
    if (badge === 'Bestseller') return 'badge--accent';
    if (badge === 'Trending') return 'badge--info';
    return 'badge--warning';
  }

  // Full card: image + wishlist + quick view + rating + discount — used
  // for "Today's Offers" and "Popular Products".
  function fullCardHtml(p) {
    const wishlisted = AegonStorage.isWishlisted(p.id);
    return `
      <article class="product-card">
        <div class="product-card__media">
          <span class="badge ${badgeClassFor(p.badge)} product-card__badge">${p.badge.startsWith('-') ? p.badge : `-${p.discountPct}%`}</span>
          <label class="product-card__wishlist" aria-label="Add ${p.name} to wishlist">
            <input type="checkbox" data-wishlist-toggle="${p.id}" ${wishlisted ? 'checked' : ''} />
            <svg class="icon" width="17" height="17" aria-hidden="true"><use href="#icon-heart"></use></svg>
          </label>
          <img src="${p.frontImage || ''}" alt="${p.name}" width="400" height="400" loading="lazy" />
          <div class="product-card__overlay">
            <a href="singlepage.html?id=${p.id}" class="product-card__quickview">Quick View</a>
          </div>
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${p.categoryLabel}</span>
          <h3 class="product-card__title">${p.name}</h3>
          <div class="product-card__rating">
            <svg class="icon icon--filled" width="13" height="13" aria-hidden="true"><use href="#icon-star"></use></svg>
            ${p.rating} <span>(${p.reviewCount})</span>
          </div>
          <div class="product-card__price-row">
            <span class="product-card__price">${money(p.price)}</span>
            <span class="product-card__price-old">${money(p.oldPrice)}</span>
            <span class="product-card__discount">Save ${p.discountPct}%</span>
          </div>
        </div>
        <div class="product-card__footer">
          <button type="button" class="product-card__add-btn" data-add-to-cart="${p.id}">
            <svg class="icon" width="16" height="16" aria-hidden="true"><use href="#icon-cart"></use></svg>
            Add to Cart
          </button>
        </div>
      </article>`;
  }

  // Lean card: image + price only, no wishlist/quick-view — used for
  // the urgency-focused "Flash Sale" strip.
  function flashCardHtml(p) {
    return `
      <article class="product-card">
        <div class="product-card__media">
          <span class="badge badge--danger product-card__badge">-${p.discountPct}%</span>
          <img src="${p.frontImage || ''}" alt="${p.name}" width="400" height="400" loading="lazy" />
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${p.categoryLabel}</span>
          <h3 class="product-card__title">${p.name}</h3>
          <div class="product-card__price-row">
            <span class="product-card__price">${money(p.price)}</span>
            <span class="product-card__price-old">${money(p.oldPrice)}</span>
          </div>
        </div>
        <div class="product-card__footer">
          <button type="button" class="product-card__add-btn" data-add-to-cart="${p.id}">
            <svg class="icon" width="16" height="16" aria-hidden="true"><use href="#icon-cart"></use></svg>
            Add to Cart
          </button>
        </div>
      </article>`;
  }

  async function init() {
    let products;
    try {
      const res = await fetch(`${AEGON_API_BASE}/products?limit=100`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      products = data.products;
    } catch (err) {
      console.warn('AEGON home.js: could not load products from API, keeping static cards.', err);
      return; // leave the server-rendered fallback cards in place
    }

    // Today's Offers — the four biggest discounts.
    if (offersGrid) {
      const offers = [...products].sort((a, b) => b.discountPct - a.discountPct).slice(0, 4);
      offersGrid.innerHTML = offers.map(fullCardHtml).join('');
    }

    // Popular Products — the four most-reviewed items.
    if (popularGrid) {
      const popular = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
      popularGrid.innerHTML = popular.map(fullCardHtml).join('');
    }

    // Flash Sale — next four biggest discounts, distinct from Today's Offers.
    if (flashGrid) {
      const flash = [...products]
        .filter((p) => p.discountPct >= 15)
        .sort((a, b) => b.discountPct - a.discountPct)
        .slice(4, 8);
      flashGrid.innerHTML = flash.map(flashCardHtml).join('');
    }
  }

  init();
})();
