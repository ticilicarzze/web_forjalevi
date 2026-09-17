/**
 * FORJA LEVI — Catalog Dynamic Renderer
 * Carga data/products.json y renderiza automáticamente las tarjetas de producto
 * con soporte para fotos, SVG fallbacks, servicio de pintura, variantes y carrito.
 */

(function () {
  'use strict';

  // SVG Icon library for fallback placeholders when image is empty
  const ICONS = {
    shield: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    sparkles: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/></svg>',
    axe: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    dagger: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    dragon: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    pack: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    mech: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>',
    knight: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    bits: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    book: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 6v6l4 2"/></svg>',
    tower: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h6"/></svg>',
    box: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    scenery: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 0V4h6v3m0 0v1a3 3 0 006 0V7M6 21V11m12 0v10M9 21v-6h6v6"/></svg>',
    dice: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>',
    rings: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>',
    clock: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    target: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>',
    anvil: '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
  };

  function formatCurrency(num) {
    return '$' + Number(num || 0).toLocaleString('es-AR');
  }

  function renderCardHTML(p, tiers = {}) {
    // 0. Resolve Tier Pricing & Painting Cost
    // tiers.json uses { price, paint } — products.json legacy tiers used { price, painting_cost }
    const tier = (p.tier && tiers[p.tier]) ? tiers[p.tier] : null;

    const basePrice = (tier && tier.price !== undefined && !p.overridePrice)
      ? tier.price
      : (p.price || 0);

    let paintingCost = 0;
    const hasPainting = p.painting && p.painting.available;
    if (hasPainting) {
      const tierPaint = tier ? (tier.paint ?? tier.painting_cost) : undefined;
      paintingCost = (tierPaint !== undefined && !p.overridePaintCost)
        ? tierPaint
        : (p.painting.cost || 0);
    }

    // 1. Tags
    const tagsHTML = (p.tags || []).map(t => {
      const typeClass = t.type ? `product-tag--${t.type}` : 'product-tag--resin';
      return `<span class="product-tag ${typeClass}">${t.text}</span>`;
    }).join('');

    // 2. Media / Image or SVG Placeholder
    const imgSrc = (p.image && !p.image.startsWith('http') && !p.image.startsWith('/') && window.location.pathname.includes('/catalogo/'))
      ? '../' + p.image
      : p.image;

    const mediaHTML = p.image
      ? `<img src="${imgSrc}" alt="${p.name}" class="product-card__img" loading="lazy" />`
      : `<div class="product-card__placeholder">
          ${ICONS[p.icon] || ICONS.shield}
          <span class="product-card__placeholder-text">${p.placeholderText || 'Foto del Producto'}</span>
        </div>`;

    // 3. Painting Option Toggle
    let paintHTML = '';
    if (hasPainting) {
      const costFormatted = formatCurrency(paintingCost);
      const discountHTML = p.painting.discountBadge
        ? `<span class="paint-option__discount">${p.painting.discountBadge}</span>`
        : '';
      const sectionHeader = p.category === 'escenografia' ? '🎨 Pintado Escénico:' : '🎨 Servicio de Pintado:';

      paintHTML = `
        <div class="paint-option">
          <div class="paint-option__header">
            <span class="paint-option__label">${sectionHeader}</span>
            ${discountHTML}
          </div>
          <div class="paint-option__toggle">
            <button type="button" class="paint-btn is-active" data-paint="no" data-add="0" data-paint-label="Sin pintar">
              ⚪ Sin pintar
            </button>
            <button type="button" class="paint-btn" data-paint="yes" data-add="${paintingCost}" data-paint-label="${p.painting.label || 'Pintado'}">
              🖌️ Pintado (+ ${costFormatted})
            </button>
          </div>
        </div>
      `;
    }

    // 4. Variants Selector
    let variantsHTML = '';
    let initialVariantId = '';
    let initialVariantName = '';
    let currentBasePrice = basePrice;

    if (p.variants && p.variants.length > 0) {
      const activeVariant = p.variants[0];
      initialVariantId = activeVariant.id;
      initialVariantName = activeVariant.name;
      currentBasePrice = activeVariant.price;

      const pillsHTML = p.variants.map((v, i) => {
        const activeClass = i === 0 ? 'is-active' : '';
        const dotHTML = v.colorHex ? `<span class="variant-dot" style="background: ${v.colorHex};"></span>` : '';
        const titleAttr = v.title || `${v.name} (${formatCurrency(v.price)})`;
        return `
          <button type="button" class="variant-pill ${activeClass}" data-variant-id="${v.id}" data-variant-name="${v.name}" data-price="${v.price}" title="${titleAttr}">
            ${dotHTML}
            ${v.name}
          </button>
        `;
      }).join('');

      variantsHTML = `
        <div class="variant-selector">
          <span class="variant-label">Acabado / Color:</span>
          <div class="variant-pills">
            ${pillsHTML}
          </div>
        </div>
      `;
    }

    // 5. Price Row & Action Button
    let priceRowHTML = '';
    let actionHTML = '';

    if (p.customCTA) {
      priceRowHTML = `
        <div class="product-card__price-row">
          <span class="product-card__price-label">${p.priceLabel || 'Cotización:'}</span>
          <span class="product-card__price" style="font-size: 1.1rem; color: var(--color-primary-light);">${p.priceDisplay || 'Presupuesto sin cargo'}</span>
        </div>
      `;
      const waText = p.customCTA.waText || (p.customCTA.url && p.customCTA.url.includes('text=') ? decodeURIComponent(p.customCTA.url.split('text=')[1]) : (p.customCTA.text || 'Hola! Quiero pedir presupuesto 🎲'));
      const customHref = (window.ForjaLeviConfig && typeof window.ForjaLeviConfig.getWhatsAppUrl === 'function')
        ? window.ForjaLeviConfig.getWhatsAppUrl(waText)
        : '#';
      actionHTML = `
        <a href="${customHref}" data-wa-text="${waText}" target="_blank" rel="noopener noreferrer" class="btn btn--accent js-wa-link" style="width: 100%;">
          ${p.customCTA.text}
        </a>
      `;
    } else {
      const displayPrice = formatCurrency(currentBasePrice);
      priceRowHTML = `
        <div class="product-card__price-row">
          <span class="product-card__price-label">${p.priceLabel || 'Precio total:'}</span>
          <span class="product-card__price">${displayPrice}</span>
        </div>
      `;

      const varAttrs = initialVariantId
        ? `data-variant-id="${initialVariantId}" data-variant-name="${initialVariantName}"`
        : '';

      const paintedAttrs = p.painting && p.painting.available
        ? 'data-painted="no" data-paint-label="Sin pintar"'
        : '';

      actionHTML = `
        <button class="btn btn--accent js-add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${currentBasePrice}" ${varAttrs} ${paintedAttrs}>
          + Agregar al pedido
        </button>
      `;
    }

    const subCat1Attr = p.subCategory ? `data-subcategory="${p.subCategory}"` : '';
    const subCat2Attr = p.subCategory2 ? `data-subcategory2="${p.subCategory2}"` : '';

    return `
      <article class="product-card" id="${p.id}" data-id="${p.id}" data-name="${p.name}" data-price="${currentBasePrice}" data-tier="${p.tier || ''}" ${subCat1Attr} ${subCat2Attr}>
        <div class="product-card__media">
          <div class="product-card__tag-wrap">
            ${tagsHTML}
          </div>
          ${mediaHTML}
        </div>
        <div class="product-card__body">
          <h3 class="product-card__title">${p.name}</h3>
          <p class="product-card__desc">${p.description}</p>
          ${variantsHTML}
          ${paintHTML}
          ${priceRowHTML}
          <div class="product-card__actions">
            ${actionHTML}
          </div>
        </div>
      </article>
    `;
  }


  function renderFilters(categoryId, container, categoriesData) {
    if (container.hasAttribute('data-catalog-subcategory')) return;

    const cats = categoriesData || (window.FORJA_CATALOG_DATA && window.FORJA_CATALOG_DATA.categories) || (window.ForjaCatalogData && window.ForjaCatalogData.categories);
    if (!cats) return;
    
    const catData = cats.find(c => c.id === categoryId);
    if (!catData || !catData.subcategories || catData.subcategories.length === 0) return;

    // Check if filters already exist to avoid duplicating
    if (container.previousElementSibling && container.previousElementSibling.classList.contains('catalog-filters')) {
      return;
    }

    let filtersHTML = '<div class="catalog-filters">';
    
    // Primary Row
    filtersHTML += '<div class="filter-row filter-row-primary">';
    filtersHTML += '<button type="button" class="filter-chip is-active" data-filter="all">Todos</button>';
    catData.subcategories.forEach(sub => {
      filtersHTML += `<button type="button" class="filter-chip" data-filter="${sub.id}">${sub.name}</button>`;
    });
    filtersHTML += '</div>';

    // Secondary Rows (One for each subcategory that has children)
    catData.subcategories.forEach(sub => {
      if (sub.children && sub.children.length > 0) {
        filtersHTML += `<div class="filter-row filter-row-secondary" data-parent="${sub.id}">`;
        filtersHTML += `<button type="button" class="filter-chip is-active" data-subfilter="all">Todos en ${sub.name}</button>`;
        sub.children.forEach(child => {
          filtersHTML += `<button type="button" class="filter-chip" data-subfilter="${child.id}">${child.name}</button>`;
        });
        filtersHTML += '</div>';
      }
    });

    filtersHTML += '</div>';

    container.insertAdjacentHTML('beforebegin', filtersHTML);

    const filterContainer = container.previousElementSibling;
    const primaryChips = filterContainer.querySelectorAll('.filter-row-primary .filter-chip');
    const secondaryRows = filterContainer.querySelectorAll('.filter-row-secondary');
    const secondaryChips = filterContainer.querySelectorAll('.filter-row-secondary .filter-chip');
    const cards = container.querySelectorAll('.product-card');

    let activePrimary = 'all';
    let activeSecondary = 'all';

    function applyFilters() {
      let visibleCount = 0;
      cards.forEach(card => {
        const cat1 = card.getAttribute('data-subcategory');
        const cat2 = card.getAttribute('data-subcategory2');

        let show = true;
        if (activePrimary !== 'all' && cat1 !== activePrimary) show = false;
        if (show && activePrimary !== 'all' && activeSecondary !== 'all' && cat2 !== activeSecondary) show = false;

        if (show) {
          card.style.display = '';
          card.classList.remove('is-hidden');
          visibleCount++;
        } else {
          card.style.display = 'none';
          card.classList.add('is-hidden');
        }
      });

      let emptyNotice = container.querySelector('.catalog-filter-empty');
      if (!emptyNotice) {
        emptyNotice = document.createElement('div');
        emptyNotice.className = 'catalog-filter-empty';
        emptyNotice.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--color-bg-card, #1c1c24); border: 1px dashed var(--color-border, #333); border-radius: 12px; margin: 1.5rem 0; width: 100%;';
        const waUrl = (window.ForjaLeviConfig && typeof window.ForjaLeviConfig.getWhatsAppUrl === 'function')
          ? window.ForjaLeviConfig.getWhatsAppUrl('Hola! Busco miniaturas para imprimir en 3D 🎲')
          : '#';
        emptyNotice.innerHTML = `
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚔️</div>
          <h4 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Modelos listos a pedido</h4>
          <p style="color: var(--color-text-muted, #aaa); max-width: 500px; margin: 0 auto 1.25rem; font-size: 0.95rem; line-height: 1.5;">
            Actualmente estamos agregando más piezas de esta selección a la galería web. Si tenés tu propio archivo STL o querés que busquemos uno de esta clase o raza, ¡te lo cotizamos e imprimimos en resina 8K!
          </p>
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--accent js-wa-link" style="display: inline-flex; align-items: center; gap: 0.5rem;">
            Pedir cotización por WhatsApp 💬
          </a>
        `;
        container.appendChild(emptyNotice);
      }

      emptyNotice.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    primaryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        primaryChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activePrimary = chip.getAttribute('data-filter');
        activeSecondary = 'all';

        // Hide all secondary rows
        secondaryRows.forEach(row => row.classList.remove('is-visible'));
        
        // Show secondary row for this primary filter if it exists
        const targetRow = filterContainer.querySelector(`.filter-row-secondary[data-parent="${activePrimary}"]`);
        if (targetRow) {
          targetRow.classList.add('is-visible');
          const rowChips = targetRow.querySelectorAll('.filter-chip');
          rowChips.forEach(c => c.classList.remove('is-active'));
          if (rowChips[0]) rowChips[0].classList.add('is-active');
        }

        applyFilters();
      });
    });

    secondaryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const row = chip.closest('.filter-row-secondary');
        const rowChips = row.querySelectorAll('.filter-chip');
        rowChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeSecondary = chip.getAttribute('data-subfilter');
        applyFilters();
      });
    });
  }

  function renderAllWithData(products, tiers, containers, categories) {
    if (!products || !products.length) return;

    containers.forEach(container => {
      const category = container.getAttribute('data-catalog-category');
      const subCategory = container.getAttribute('data-catalog-subcategory');

      let filtered = products.filter(p => p.category === category);
      if (subCategory) {
        filtered = filtered.filter(p => p.subCategory === subCategory);
      }

      if (filtered.length > 0) {
        container.innerHTML = filtered.map(p => renderCardHTML(p, tiers)).join('');
        renderFilters(category, container, categories);
      }
    });

    if (typeof window.ForjaInitCatalogInteractions === 'function') {
      window.ForjaInitCatalogInteractions();
    }

    // Auto-scroll y destello visual si se llega con ancla (ej: #dnd-picaro-tiefling)
    if (window.location.hash) {
      setTimeout(() => {
        try {
          const target = document.querySelector(window.location.hash);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlight-target');
            setTimeout(() => target.classList.remove('highlight-target'), 2500);
          }
        } catch (_) {}
      }, 150);
    }
  }

  async function loadAndRenderProducts() {
    const containers = document.querySelectorAll('[data-catalog-category]');
    if (containers.length === 0) return;

    // Resolve base paths depending on location (web vs /catalogo/ subfolder)
    const base = window.location.pathname.includes('/catalogo/') ? '../' : '';

    try {
      const [productsRes, tiersRes] = await Promise.all([
        fetch(base + 'data/products.json'),
        fetch(base + 'data/tiers.json')
      ]);

      const dataJson = productsRes.ok ? await productsRes.json() : null;
      const products = dataJson ? dataJson.products : null;
      const categories = dataJson ? dataJson.categories : null;
      const tiers    = tiersRes.ok    ? await tiersRes.json()              : {};

      if (products) {
        window.ForjaCatalogData = { products, tiers, categories };
        window.FORJA_CATALOG_DATA = window.FORJA_CATALOG_DATA || {};
        window.FORJA_CATALOG_DATA.products = products;
        window.FORJA_CATALOG_DATA.tiers = tiers;
        if (categories) {
          window.FORJA_CATALOG_DATA.categories = categories;
        }
        renderAllWithData(products, tiers, containers, categories);
        return;
      }
    } catch (_) {
      // fetch failed (e.g. file:// protocol) — fall through to inline fallback
    }

    // Offline / file:// fallback: use data embedded in js/products-data.js
    if (window.FORJA_CATALOG_DATA) {
      const { products, tiers, categories } = window.FORJA_CATALOG_DATA;
      const activeTiers = window.FORJA_TIERS || tiers || {};
      window.ForjaCatalogData = { products, tiers: activeTiers, categories };
      renderAllWithData(products, activeTiers, containers, categories);
    }
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRenderProducts);
  } else {
    loadAndRenderProducts();
  }

    window.ForjaCatalog = { load: loadAndRenderProducts };

})();

