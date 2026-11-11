/* ==========================================================================
   AEGON — Single product page (singlepage.html)
   Reads ?id= from the URL, finds that product in data/products.json and
   fills the page. Quantity stepper feeds Add to Cart / Buy Now.
   ========================================================================== */

(function () {
  const titleEl = document.getElementById('pdp-title');
  if (!titleEl) return; // not on the product detail page

  const id = Number(new URLSearchParams(window.location.search).get('id'));
  let qty = 1;
  const qtyValueEl = document.getElementById('pdp-qty-value');

  const money = (v) => `$${v.toFixed(2)}`;
  const $ = (sel) => document.getElementById(sel);

  function setPhoto(img, src, alt) {
    if (src) {
      img.src = src;
      img.alt = alt;
    } else {
      img.style.display = 'none';
    }
  }

  function renderProduct(p, all) {
    document.title = `${p.name} | AEGON`;
    titleEl.textContent = p.name;
    $('pdp-category').textContent = p.categoryLabel;
    const catLink = $('pdp-category-link');
    catLink.textContent = p.categoryLabel;
    catLink.href = `product.html#${p.category}`;
    $('pdp-breadcrumb-name').textContent = p.name;
    $('pdp-rating').textContent = p.rating;
    $('pdp-reviews').textContent = `(${p.reviewCount} reviews)`;
    $('pdp-price').textContent = money(p.price);
    $('pdp-old-price').textContent = money(p.oldPrice);
    $('pdp-badge').textContent = `Save ${p.discountPct}%`;
    $('pdp-description').textContent = p.description;
    $('pdp-long-description').textContent = p.longDescription;
    $('pdp-delivery').textContent = `${p.deliveryMins}\u2013${p.deliveryMins + 5} mins`;
    $('pdp-features').innerHTML = p.features.map((f) => `<li><i class="fa-solid fa-check"></i>${f}</li>`).join('');

    setPhoto($('pdp-photo-front'), p.frontImage, p.name);
    setPhoto($('pdp-photo-back'), p.backImage, `${p.name} \u2014 alternate view`);

    const wish = $('pdp-wishlist-toggle');
    wish.checked = AegonStorage.isWishlisted(p.id);
    wish.addEventListener('change', () => AegonStorage.toggleWishlist(p.id));

    const addBtn = $('pdp-add-cart');
    addBtn.addEventListener('click', () => {
      AegonStorage.addToCart(p.id, qty);
      addBtn.textContent = 'Added \u2713';
      setTimeout(() => (addBtn.textContent = 'Add to Cart'), 1400);
    });
    $('pdp-buy-now').addEventListener('click', () => {
      AegonStorage.addToCart(p.id, qty);
      window.location.href = 'cart.html';
    });

    // Related: same category, excluding this product.
    $('pdp-related').innerHTML = all
      .filter((x) => x.category === p.category && x.id !== p.id)
      .slice(0, 4)
      .map(
        (x) => `<a class="pdp-related__card" href="singlepage.html?id=${x.id}">
          <img src="${x.frontImage}" alt="${x.name}" loading="lazy">
          <strong>${x.name}</strong>
          <span>${money(x.price)}</span>
        </a>`
      )
      .join('');
  }

  $('pdp-qty-dec').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    qtyValueEl.textContent = String(qty);
  });
  $('pdp-qty-inc').addEventListener('click', () => {
    qty += 1;
    qtyValueEl.textContent = String(qty);
  });

  async function load() {
    try {
      const all = await AegonData.getProducts();
      const product = all.find((p) => p.id === id);
      if (!product) throw new Error(id ? `No product with id ${id}` : 'No product id in the URL');
      renderProduct(product, all);
    } catch (err) {
      titleEl.textContent = 'Product not found';
      $('pdp-description').textContent = err.message;
    }
  }

  load();
})();
