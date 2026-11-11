/* ==========================================================================
   AEGON — Products page (data-driven from data/products.json)
   Renders the catalog grid, wires the category chips, search box, sort
   dropdown, Add to Cart and wishlist buttons. Uses the array
   methods (map/filter/reduce/find) the storage layer already leans on.
   ========================================================================== */

(function () {
  const grid = document.getElementById('product-grid');
  if (!grid) return; // not on the products page

  const categoryHeading = document.getElementById('category-heading');
  const filterChipsWrap = document.getElementById('filter-chips');
  const searchInput = document.getElementById('site-search');
  const searchForm = searchInput ? searchInput.closest('form') : null;
  const sortSelect = document.getElementById('sort-select');
  const resultsSummary = document.getElementById('results-summary');

  const CATEGORY_LABELS = {
    all: 'All Products',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    groceries: 'Groceries',
    dairy: 'Dairy',
    bakery: 'Bakery',
    snacks: 'Snacks',
    beverages: 'Beverages',
    'frozen-foods': 'Frozen Foods',
    'personal-care': 'Personal Care',
    household: 'Household',
  };

  const urlParams = new URLSearchParams(window.location.search);
  const state = {
    category: (window.location.hash || '').replace('#', '') || 'all',
    search: urlParams.get('q') || '',
    sort: '',
  };
  if (!CATEGORY_LABELS[state.category]) state.category = 'all';
  if (searchInput && state.search) searchInput.value = state.search;

  function money(v) {
    return `$${v.toFixed(2)}`;
  }

  function productMediaHtml(p, isBack) {
    // Real product photo when we have one; otherwise fall back to the
    // gradient + icon placeholder tile.
    const imgSrc = isBack ? p.backImage || p.frontImage : p.frontImage;
    if (imgSrc) {
      const label = isBack ? `${p.name} — alternate view` : p.name;
      return `<img src="${imgSrc}" alt="${label}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" />`;
    }

    const icon = isBack ? p.backIcon : p.icon;
    const bg = isBack ? `var(--gradient-${p.backGradient})` : 'var(--gradient-primary)';
    return `
      <div style="width:100%; height:100%; display:grid; place-items:center; background:${bg};">
        <span style="width:64px; height:64px; border-radius:var(--radius-md); background:hsla(0,0%,100%,0.18); display:grid; place-items:center; color:var(--color-white);">
          <svg class="icon" style="width:34px; height:34px;" aria-hidden="true"><use href="#${icon}"></use></svg>
        </span>
      </div>`;
  }

  function cardHtml(p) {
    const wishlisted = AegonStorage.isWishlisted(p.id);
    const badgeClass =
      p.badge === '-20%' || p.badge.startsWith('-')
        ? 'badge--danger'
        : p.badge === 'New'
        ? 'badge--success'
        : p.badge === 'Bestseller'
        ? 'badge--accent'
        : p.badge === 'Trending'
        ? 'badge--info'
        : 'badge--warning';

    const bodyHtml = `
      <div class="product-card__body">
        <span class="product-card__category">${p.categoryLabel}</span>
        <h3 class="product-card__title">${p.name}</h3>
        <p class="product-card__desc">${p.description}</p>
        <div class="product-card__rating">
          <svg class="icon icon--filled" style="width:13px; height:13px;" aria-hidden="true"><use href="#icon-star"></use></svg>
          ${p.rating} <span>(${p.reviewCount})</span>
        </div>
        <div class="product-card__price-row">
          <span class="product-card__price">${money(p.price)}</span>
          <span class="product-card__price-old">${money(p.oldPrice)}</span>
          <span class="product-card__discount">Save ${p.discountPct}%</span>
        </div>
        <div class="product-card__delivery">
          <svg class="icon" style="width:14px; height:14px;" aria-hidden="true"><use href="#icon-clock"></use></svg>
          Delivery in ${p.deliveryMins} mins
        </div>
      </div>
      <div class="product-card__footer">
        <button type="button" class="product-card__add-btn" data-add-to-cart="${p.id}">
          <svg class="icon" style="width:16px; height:16px;" aria-hidden="true"><use href="#icon-cart"></use></svg>
          Add to Cart
        </button>
      </div>`;

    if (p.isAuto) {
      return `
        <article class="product-card flip-card flip-card--auto" data-cat="${p.category}" data-product-id="${p.id}">
          <div class="flip-card__inner">
            <div class="flip-card__face flip-card__face--front">
              <div class="product-card__media">
                <span class="badge ${badgeClass} product-card__badge">${p.badge}</span>
                <a href="singlepage.html?id=${p.id}" class="product-card__quickview-btn" aria-label="Quick view ${p.name}">
                  <svg class="icon" style="width:17px; height:17px;" aria-hidden="true"><use href="#icon-eye"></use></svg>
                </a>
                <label class="product-card__wishlist" aria-label="Add ${p.name} to wishlist">
                  <input type="checkbox" data-wishlist-toggle="${p.id}" ${wishlisted ? 'checked' : ''} />
                  <svg class="icon" style="width:17px; height:17px;" aria-hidden="true"><use href="#icon-heart"></use></svg>
                </label>
                ${productMediaHtml(p, false)}
              </div>
              ${bodyHtml}
            </div>
            <div class="flip-card__face flip-card__face--back">
              <h4>${p.name}</h4>
              <p>${p.longDescription}</p>
              <ul>
                ${p.features.map((f) => `<li><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg>${f}</li>`).join('')}
              </ul>
              <button type="button" class="btn btn--outline-light btn--sm" data-add-to-cart="${p.id}">
                <svg class="icon" style="width:16px; height:16px;" aria-hidden="true"><use href="#icon-cart"></use></svg>
                Add to Cart
              </button>
            </div>
          </div>
        </article>`;
    }

    return `
      <article class="product-card" data-cat="${p.category}" data-product-id="${p.id}">
        <div class="product-card__media product-card__media--flip">
          <span class="badge ${badgeClass} product-card__badge">${p.badge}</span>
          <a href="singlepage.html?id=${p.id}" class="product-card__quickview-btn" aria-label="Quick view ${p.name}">
            <svg class="icon" style="width:17px; height:17px;" aria-hidden="true"><use href="#icon-eye"></use></svg>
          </a>
          <label class="product-card__wishlist" aria-label="Add ${p.name} to wishlist">
            <input type="checkbox" data-wishlist-toggle="${p.id}" ${wishlisted ? 'checked' : ''} />
            <svg class="icon" style="width:17px; height:17px;" aria-hidden="true"><use href="#icon-heart"></use></svg>
          </label>
          <div class="product-card__media-inner">
            <div class="product-card__media-face product-card__media-face--front">${productMediaHtml(p, false)}</div>
            <div class="product-card__media-face product-card__media-face--back">${productMediaHtml(p, true)}</div>
          </div>
        </div>
        ${bodyHtml}
      </article>`;
  }

  function render(products) {
    if (products.length === 0) {
      grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1; text-align:center; padding:var(--space-2xl) 0;">No products matched your search. Try a different keyword or category.</p>`;
      if (resultsSummary) resultsSummary.textContent = '';
      return;
    }

    const groupByCategory = state.category === 'all' && !state.search;

    if (!groupByCategory) {
      grid.innerHTML = products.map(cardHtml).join('');
    } else {
      // Group by category (preserving catalog order) and inject a
      // full-width heading before each group, like the original
      // server-rendered layout did.
      const groups = products.reduce((acc, p) => {
        (acc[p.category] = acc[p.category] || []).push(p);
        return acc;
      }, {});
      grid.innerHTML = Object.entries(groups)
        .map(
          ([cat, items]) =>
            `<h3 class="product-grid__section-heading" data-section="${cat}">${CATEGORY_LABELS[cat]}</h3>` +
            items.map(cardHtml).join('')
        )
        .join('');
    }

    if (resultsSummary) {
      resultsSummary.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}${
        state.category !== 'all' ? ` in ${CATEGORY_LABELS[state.category]}` : ''
      }${state.search ? ` for "${state.search}"` : ''}.`;
    }
  }

  function updateChipStyles() {
    if (!filterChipsWrap) return;
    filterChipsWrap.querySelectorAll('[data-filter-chip]').forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.filterChip === state.category);
    });
  }

  function updateHeading() {
    if (categoryHeading) categoryHeading.textContent = CATEGORY_LABELS[state.category] || 'All Products';
  }

  let allProducts = null;

  function applyFilters(list) {
    let result = list;
    if (state.category !== 'all') result = result.filter((p) => p.category === state.category);
    if (state.search) {
      const term = state.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.categoryLabel.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }
    if (state.sort === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    else if (state.sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (state.sort === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
    else if (state.sort === 'newest') result = [...result].sort((a, b) => b.id - a.id);
    return result;
  }

  async function fetchAndRender() {
    try {
      if (!allProducts) allProducts = await AegonData.getProducts();
      render(applyFilters(allProducts));
    } catch (err) {
      grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1; text-align:center; padding:3rem 0;">
        Couldn't load products.<br />${err.message}<br />Open the site with Live Server (not by double-clicking the file).
      </p>`;
    }
    updateChipStyles();
    updateHeading();
  }

  // ---------------- Filter chips ----------------
  if (filterChipsWrap) {
    filterChipsWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter-chip]');
      if (!chip) return;
      state.category = chip.dataset.filterChip;
      history.replaceState(null, '', state.category === 'all' ? 'product.html' : `product.html#${state.category}`);
      fetchAndRender();
    });
  }

  // ---------------- Search ----------------
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.search = searchInput.value.trim();
      fetchAndRender();
    });
  }
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.search = searchInput.value.trim();
        fetchAndRender();
      }, 300);
    });
  }

  // ---------------- Sort ----------------
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      fetchAndRender();
    });
  }

  // Add to Cart / wishlist clicks inside the grid are handled globally
  // by js/nav.js (delegated on document), so every card — static or
  // rendered here — behaves identically without double-binding.

  window.addEventListener('hashchange', () => {
    const next = (window.location.hash || '').replace('#', '') || 'all';
    state.category = CATEGORY_LABELS[next] ? next : 'all';
    fetchAndRender();
  });

  fetchAndRender();
})();