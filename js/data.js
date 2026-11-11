/* ==========================================================================
   AEGON — product data
   Loads the catalog from data/products.json (plain static file, no server).
   Every page that needs products calls AegonData.getProducts().
   Works with Live Server / any static host (fetch needs http, not file://).
   ========================================================================== */

const AegonData = (() => {
  let cache = null;

  // products.json stores "images/products/x.jpg"; this project keeps the
  // photos in Assets/products/, so point the paths there.
  function fixImage(path) {
    return path ? '../Assets/products/' + path.split('/').pop() : '';
  }

  async function getProducts() {
    if (cache) return cache;
    const res = await fetch('../data/products.json');
    if (!res.ok) throw new Error('Could not load data/products.json (' + res.status + ')');
    const list = await res.json();
    cache = list.map((p) => ({
      ...p,
      frontImage: fixImage(p.frontImage),
      backImage: fixImage(p.backImage),
    }));
    return cache;
  }

  return { getProducts };
})();
