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
    const tier = (p.tier && tiers[p.tier]) ? tiers[p.tier] : null;

    const basePrice = (tier && tier.price !== undefined && !p.overridePrice)
      ? tier.price
      : (p.price || 0);

    let paintingCost = 0;
    const hasPainting = p.painting && p.painting.available;
    if (hasPainting) {
      paintingCost = (tier && tier.painting_cost !== undefined && !p.overridePaintCost)
        ? tier.painting_cost
        : (p.painting.cost || 0);
    }

    // 1. Tags
    const tagsHTML = (p.tags || []).map(t => {
      const typeClass = t.type ? `product-tag--${t.type}` : 'product-tag--resin';
      return `<span class="product-tag ${typeClass}">${t.text}</span>`;
    }).join('');

    // 2. Media / Image or SVG Placeholder
    const mediaHTML = p.image
      ? `<img src="${p.image}" alt="${p.name}" class="product-card__img" loading="lazy" />`
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

    const subCategoryAttr = p.subCategory ? `data-category="${p.subCategory}"` : '';

    return `
      <article class="product-card" data-id="${p.id}" data-name="${p.name}" data-price="${currentBasePrice}" data-tier="${p.tier || ''}" ${subCategoryAttr}>
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

  function renderAllWithData(data, containers) {
    if (!data || !data.products) return;
    window.ForjaCatalogData = data;

    containers.forEach(container => {
      const category = container.getAttribute('data-catalog-category');
      const subCategory = container.getAttribute('data-catalog-subcategory');

      let filtered = data.products.filter(p => p.category === category);
      if (subCategory) {
        filtered = filtered.filter(p => p.subCategory === subCategory);
      }

      if (filtered.length > 0) {
        container.innerHTML = filtered.map(p => renderCardHTML(p, data.tiers || {})).join('');
      }
    });

    // Re-bind interactive events in main.js
    if (typeof window.ForjaInitCatalogInteractions === 'function') {
      window.ForjaInitCatalogInteractions();
    }
  }

  async function loadAndRenderProducts() {
    const containers = document.querySelectorAll('[data-catalog-category]');
    if (containers.length === 0) return;

    // 1. Render inmediato si existe window.FORJA_CATALOG_DATA (soporte total para file:// y offline)
    if (window.FORJA_CATALOG_DATA) {
      renderAllWithData(window.FORJA_CATALOG_DATA, containers);
    }

    // 2. Fetch asíncrono para recargar data/products.json en entornos web/HTTP
    const jsonPath = window.location.pathname.includes('/catalogo/')
      ? '../data/products.json'
      : 'data/products.json';

    try {
      const response = await fetch(jsonPath);
      if (response.ok) {
        const freshData = await response.json();
        renderAllWithData(freshData, containers);
      }
    } catch (err) {
      // En modo file:// o si fetch falla, ya fue renderizado arriba con window.FORJA_CATALOG_DATA
    }
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRenderProducts);
  } else {
    loadAndRenderProducts();
  }

  // Global helper
  window.ForjaCatalog = {
    load: loadAndRenderProducts
  };

})();
