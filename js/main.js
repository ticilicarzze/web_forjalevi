/* ============================================
   FORJA LEVI — Main JavaScript
   Mobile nav, scroll effects, reveal animations,
   particles, and WhatsApp Interactive Cart
   ============================================ */

(function () {
  'use strict';

  // ── Config & Centralización de Contacto (WhatsApp) ──
  // Cambiá este número en un solo lugar si en el futuro tenés una línea exclusiva:
  const WHATSAPP_PHONE = '5493416476504';
  const STORAGE_KEY = 'forjalevi_cart_v1';

  function getWhatsAppUrl(message = '') {
    const text = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${WHATSAPP_PHONE}${text}`;
  }

  function initWhatsAppLinks() {
    document.querySelectorAll('[data-wa-text]').forEach(el => {
      const text = el.getAttribute('data-wa-text') || 'Hola! Quiero hacer una consulta 🎲';
      el.href = getWhatsAppUrl(text);
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
  }

  // Delegación de clics para enlaces y botones de WhatsApp
  document.addEventListener('click', (e) => {
    const waLink = e.target.closest('[data-wa-text]');
    if (!waLink) return;
    const href = waLink.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) {
      e.preventDefault();
      const text = waLink.getAttribute('data-wa-text') || 'Hola! Quiero hacer una consulta 🎲';
      window.open(getWhatsAppUrl(text), '_blank', 'noopener,noreferrer');
    }
  });

  // ── DOM References ──
  const header        = document.getElementById('header');
  const navToggle     = document.getElementById('navToggle');
  const navMenu       = document.getElementById('navMenu');
  const navLinks      = document.querySelectorAll('.header__link');
  const sections      = document.querySelectorAll('section[id], footer[id]');

  // Cart DOM
  const cartToggle    = document.getElementById('cartToggle');
  const fabCart       = document.getElementById('fabCart');
  const cartClose     = document.getElementById('cartClose');
  const cartDrawer    = document.getElementById('cartDrawer');
  const cartOverlay   = document.getElementById('cartOverlay');
  const cartItemsCont = document.getElementById('cartItemsContainer');
  const cartCountEl   = document.getElementById('cartCount');
  const fabCartBadge  = document.getElementById('fabCartBadge');
  const cartTotalEl   = document.getElementById('cartTotal');
  const cartCheckout    = document.getElementById('cartCheckoutBtn');
  const cartContinueBtn = document.getElementById('cartContinueBtn');
  const cartClearBtn    = document.getElementById('cartClearBtn');
  const toastEl         = document.getElementById('toastNotification');

  // ── State ──
  let cart = [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    cart = [];
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart in localStorage', e);
    }
  }

  // ── Helpers ──
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.innerHTML = message;
    toastEl.classList.add('is-active');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('is-active');
    }, 2800);
  }

  function bumpBadges() {
    [cartCountEl, fabCartBadge].forEach(el => {
      if (!el) return;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 250);
    });
  }

  // ── Helper para obtener información de precios y pintura del catálogo ──
  function getProductInfo(productId) {
    const catalog = window.ForjaCatalogData || window.FORJA_CATALOG_DATA;
    if (!catalog || !catalog.products) return null;
    const product = catalog.products.find(p => p.id === productId);
    if (!product) return null;

    const tiers = catalog.tiers || {};
    const tier = (product.tier && tiers[product.tier]) ? tiers[product.tier] : null;

    const basePrice = (tier && tier.price !== undefined && !product.overridePrice)
      ? tier.price
      : (product.price || 0);

    let hasPainting = false;
    let paintCost = 0;
    if (product.painting && product.painting.available) {
      hasPainting = true;
      const tierPaint = tier ? (tier.paint ?? tier.painting_cost) : undefined;
      paintCost = (tierPaint !== undefined && !product.overridePaintCost)
        ? tierPaint
        : (product.painting.cost || 0);
    }

    return { product, basePrice, hasPainting, paintCost };
  }

  // ── Cart Operations (with Variant, Painting & MP Support) ──
  function addToCart(id, name, price, variantId = null, variantName = null, isPainted = false, paintLabel = null) {
    const info = getProductInfo(id);
    const hasPainting = info ? info.hasPainting : Boolean(isPainted);
    const paintCost = info ? info.paintCost : 0;
    const basePrice = info
      ? (variantId && info.product.variants?.find(v => v.id === variantId)?.price || info.basePrice)
      : (isPainted ? (Number(price) - paintCost) : Number(price));

    const paintKey = isPainted ? 'painted' : 'raw';
    const variantKey = variantId || 'std';
    const key = `${id}__${variantKey}__${paintKey}`;
    const existing = cart.find(item => (item.cartItemId || item.id) === key);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: id,
        cartItemId: key,
        variantId: variantId || null,
        variantName: variantName || null,
        hasPainting: Boolean(hasPainting),
        basePrice: Number(basePrice) || 0,
        paintCost: Number(paintCost) || 0,
        isPainted: Boolean(isPainted),
        paintLabel: paintLabel || (isPainted ? 'Con Pintado Tabletop' : 'Sin pintar'),
        name: name,
        price: Number(price) || 0,
        qty: 1
      });
    }
    saveCart();
    renderCart();
    bumpBadges();
    const displayName = variantName ? `${name} (${variantName})` : name;
    const paintTag = isPainted ? ' [Pintado]' : '';
    showToast(`⚔️ Agregado: <strong>${displayName}${paintTag}</strong>`);
  }

  // Permite seleccionar o deseleccionar el servicio de pintado directamente desde el carrito
  function setCartItemPainting(key, isPainted) {
    const item = cart.find(i => (i.cartItemId || i.id) === key);
    if (!item) return;

    if (item.isPainted === isPainted) return;

    const info = getProductInfo(item.id);
    const paintCost = item.paintCost || (info ? info.paintCost : 0);
    const basePrice = item.basePrice || (info ? (item.variantId && info.product.variants?.find(v => v.id === item.variantId)?.price || info.basePrice) : (item.isPainted ? (item.price - paintCost) : item.price));

    const variantKey = item.variantId || 'std';
    const newKey = `${item.id}__${variantKey}__${isPainted ? 'painted' : 'raw'}`;

    // Si al cambiar el estado de pintado coincide con otro item ya existente en el carrito, se fusionan
    const existingOther = cart.find(i => (i.cartItemId || i.id) === newKey);
    if (existingOther) {
      existingOther.qty += item.qty;
      cart = cart.filter(i => (i.cartItemId || i.id) !== key);
      showToast(`Combinado: <strong>${existingOther.qty}x ${existingOther.name}</strong> ${isPainted ? '[Pintado]' : '[Sin pintar]'}`);
    } else {
      item.cartItemId = newKey;
      item.isPainted = isPainted;
      item.hasPainting = true;
      item.basePrice = Number(basePrice) || 0;
      item.paintCost = Number(paintCost) || 0;
      item.price = isPainted ? (basePrice + paintCost) : basePrice;
      item.paintLabel = isPainted ? 'Con Pintado Tabletop' : 'Sin pintar';
      showToast(`${item.name}: <strong>${isPainted ? '🖌️ Con Pintado' : '⚪ Sin pintar'}</strong>`);
    }

    saveCart();
    renderCart();
  }

  function updateQty(key, delta) {
    const item = cart.find(i => (i.cartItemId || i.id) === key);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => (i.cartItemId || i.id) !== key);
    }
    saveCart();
    renderCart();
  }

  function removeItem(key) {
    cart = cart.filter(i => (i.cartItemId || i.id) !== key);
    saveCart();
    renderCart();
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('¿Seguro que querés vaciar todos los productos del pedido?')) return;
    cart = [];
    saveCart();
    renderCart();
    showToast('Lista de pedido vaciada');
  }

  function getCartTotal() {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  function getCartCount() {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }

  // ── Render Cart ──
  function renderCart() {
    const totalCount = getCartCount();
    const totalAmount = getCartTotal();

    // Badges
    if (cartCountEl) cartCountEl.textContent = totalCount;
    if (fabCartBadge) fabCartBadge.textContent = totalCount;
    if (cartTotalEl) cartTotalEl.textContent = formatCurrency(totalAmount);
    if (cartClearBtn) cartClearBtn.style.display = cart.length === 0 ? 'none' : 'inline-flex';

    if (!cartItemsCont) return;

    if (cart.length === 0) {
      cartItemsCont.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h3 class="cart-empty__title">Tu forja está vacía</h3>
          <p class="cart-empty__text">Explorá el catálogo y sumá miniaturas o accesorios para armar tu pedido.</p>
          <button class="btn btn--accent btn--small" id="cartExploreBtn">Explorar Catálogo</button>
        </div>
      `;

      const exploreBtn = document.getElementById('cartExploreBtn');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
          closeCart();
          const catSection = document.getElementById('catalogo');
          if (catSection) {
            catSection.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = window.location.pathname.includes('/catalogo/') ? '../index.html#catalogo' : 'index.html#catalogo';
          }
        });
      }
      return;
    }

    // Render items
    cartItemsCont.innerHTML = cart.map(item => {
      const itemKey = item.cartItemId || item.id;
      const info = getProductInfo(item.id);
      const hasPainting = item.hasPainting ?? (info ? info.hasPainting : false);
      const paintCost = item.paintCost || (info ? info.paintCost : 0);

      let paintSectionHTML = '';
      if (hasPainting && paintCost > 0) {
        paintSectionHTML = `
          <div class="cart-item__paint-section">
            <div class="cart-item__paint-toggle">
              <button type="button" class="cart-paint-pill ${!item.isPainted ? 'is-active' : ''} js-cart-paint-btn" data-key="${itemKey}" data-paint="no" title="Sin servicio de pintura">
                ⚪ Sin pintar
              </button>
              <button type="button" class="cart-paint-pill ${item.isPainted ? 'is-active' : ''} js-cart-paint-btn" data-key="${itemKey}" data-paint="yes" title="Sumar acabado tabletop pintado">
                🖌️ Pintado (+${formatCurrency(paintCost)})
              </button>
            </div>
          </div>
        `;
      } else if (item.isPainted) {
        paintSectionHTML = `
          <div class="cart-item__variant" style="color: #ffb74d; font-size: 0.74rem;">
            <span>🖌️</span> ${item.paintLabel || 'Pintado Tabletop'}
          </div>
        `;
      }

      return `
        <div class="cart-item" data-key="${itemKey}">
          <div class="cart-item__info">
            <h4 class="cart-item__title" title="${item.name}">${item.name}</h4>
            ${item.variantName ? `<div class="cart-item__variant"><span>🎨</span> ${item.variantName}</div>` : ''}
            ${paintSectionHTML}
            <span class="cart-item__price">${formatCurrency(item.price)} c/u &middot; <strong style="color:var(--text-primary);">${formatCurrency(item.price * item.qty)}</strong></span>
          </div>
          <div class="cart-item__controls">
            <button class="cart-item__btn-qty js-qty-minus" data-key="${itemKey}" aria-label="Restar uno">&minus;</button>
            <span class="cart-item__qty">${item.qty}</span>
            <button class="cart-item__btn-qty js-qty-plus" data-key="${itemKey}" aria-label="Sumar uno">&plus;</button>
          </div>
          <button class="cart-item__remove js-remove-item" data-key="${itemKey}" aria-label="Eliminar producto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Attach item events
    cartItemsCont.querySelectorAll('.js-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.key, -1));
    });
    cartItemsCont.querySelectorAll('.js-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.key, 1));
    });
    cartItemsCont.querySelectorAll('.js-remove-item').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.key));
    });
    cartItemsCont.querySelectorAll('.js-cart-paint-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const isPainted = btn.dataset.paint === 'yes';
        setCartItemPainting(key, isPainted);
      });
    });
  }

  // ── Drawer Open / Close ──
  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    if (cartOverlay) cartOverlay.classList.add('is-active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    if (cartOverlay) cartOverlay.classList.remove('is-active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (fabCart) fabCart.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  if (cartClearBtn) cartClearBtn.addEventListener('click', clearCart);
  if (cartContinueBtn) cartContinueBtn.addEventListener('click', closeCart);

  // Esc key to close drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('is-open')) {
      closeCart();
    }
  });

  // ── Sync Cart Across Tabs ──
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      try {
        cart = e.newValue ? JSON.parse(e.newValue) : [];
        renderCart();
      } catch (err) {
        console.warn('Error syncing cart from storage', err);
      }
    }
  });

  // ── Add to Cart Buttons in Grid (Event Delegation for static + dynamic products) ──
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-add-to-cart');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = btn.dataset.price;
    const variantId = btn.dataset.variantId || null;
    const variantName = btn.dataset.variantName || null;
    const isPainted = btn.dataset.painted === 'yes';
    const paintLabel = btn.dataset.paintLabel || (isPainted ? 'Con Pintado Tabletop' : 'Sin pintar');
    addToCart(id, name, price, variantId, variantName, isPainted, paintLabel);
  });

  // ── Proceed to Dedicated Checkout Page ──
  if (cartCheckout) {
    cartCheckout.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Tu lista está vacía. ¡Agregá productos primero!');
        return;
      }

      const checkoutUrl = window.location.pathname.includes('/catalogo/') ? '../checkout.html' : 'checkout.html';
      const win = window.open(checkoutUrl, '_blank');
      if (!win) {
        window.location.href = checkoutUrl;
      }
    });
  }

  // ── Mercado Pago Payload Generator (Ready for Backend/Preference API) ──
  function generateMercadoPagoPayload(customer = {}) {
    return {
      items: cart.map(item => {
        const paintSuffix = item.isPainted ? ' (Pintado)' : ' (Sin pintar)';
        const variantSuffix = item.variantName ? ` - ${item.variantName}` : '';
        return {
          id: item.cartItemId || item.id,
          title: `${item.name}${variantSuffix}${paintSuffix}`,
          unit_price: Number(item.price),
          quantity: Number(item.qty),
          currency_id: 'ARS'
        };
      }),
      payer: {
        name: customer.name || '',
        email: customer.email || ''
      },
      metadata: {
        notes: customer.notes || '',
        source: 'forjalevi_web'
      }
    };
  }

  // Expose API for future MP or external integrations
  window.ForjaLeviAPI = {
    getCart: () => [...cart],
    addToCart,
    clearCart,
    generateMercadoPagoPayload,
    getWhatsAppUrl
  };

  window.ForjaLeviConfig = {
    whatsappPhone: WHATSAPP_PHONE,
    getWhatsAppUrl
  };

  // ── Mobile Nav Toggle ──
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-active');
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
    });

    // Close nav on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });

    // Close nav on overlay click
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('nav-open') &&
          !navMenu.contains(e.target) &&
          !navToggle.contains(e.target)) {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // ── Header scroll effect ──
  window.addEventListener('scroll', () => {
    if (header) {
      header.classList.toggle('header--scrolled', window.scrollY > 40);
    }
  }, { passive: true });

  // ── Active nav link on scroll ──
  function updateActiveLink() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < bottom) {
        navLinks.forEach(link => {
          link.classList.toggle('active',
            link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  // ── Scroll Reveal Animation ──
  function initReveal() {
    const revealElements = document.querySelectorAll(
      '.card, .service-card, .services__banner, .product-card, .step, .section-header, .hero__content, .hero__image, .footer__brand, .footer__links, .footer__info'
    );

    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 6) * 0.07}s`;
      observer.observe(el);
    });
  }

  // ── Floating Particles (Canvas) ──
  function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
      canvas.width  = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(55, Math.floor(canvas.width * canvas.height / 14000));
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let col;
        if (rand > 0.7) {
          col = `rgba(255, 87, 34, ${Math.random() * 0.45 + 0.25})`;  // Naranja rojizo fuego
        } else if (rand > 0.4) {
          col = `rgba(255, 167, 38, ${Math.random() * 0.5 + 0.2})`;  // Ámbar forja
        } else if (rand > 0.15) {
          col = `rgba(255, 61, 0, ${Math.random() * 0.4 + 0.2})`;    // Rojo brasa
        } else {
          col = `rgba(255, 224, 130, ${Math.random() * 0.6 + 0.3})`; // Chispa incandescente
        }

        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2.2 + 0.6,
          dx: (Math.random() - 0.5) * 0.4,
          dy: -(Math.random() * 0.45 + 0.15), // Movimiento ascendente como brasas
          color: col,
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0)              p.x = canvas.width;
        if (p.x > canvas.width)   p.x = 0;
        if (p.y < 0)              p.y = canvas.height;
        if (p.y > canvas.height)  p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }

  // ── Dynamic Interactive Filter Tabs ──
  function initDynamicFilters() {
    const filterBars = document.querySelectorAll('.js-filter-bar');
    filterBars.forEach(bar => {
      const chips = bar.querySelectorAll('[data-filter]');
      const targetSelector = bar.getAttribute('data-target') || '.product-grid, .catalog__grid';
      const targetContainer = document.querySelector(targetSelector);
      if (!targetContainer) return;

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');

          const filterVal = chip.getAttribute('data-filter');
          const items = targetContainer.querySelectorAll('[data-category]');

          items.forEach(item => {
            const itemCats = (item.getAttribute('data-category') || '').split(' ');
            if (filterVal === 'all' || itemCats.includes(filterVal)) {
              item.classList.remove('is-hidden');
            } else {
              item.classList.add('is-hidden');
            }
          });
        });
      });
    });
  }

  // ── Product Variants Selection Handler ──
  function initVariantSelectors() {
    document.querySelectorAll('.product-card').forEach(card => {
      const pills = card.querySelectorAll('.variant-pill');
      if (pills.length === 0) return;

      const priceEl = card.querySelector('.product-card__price');
      const addBtn = card.querySelector('.js-add-to-cart');

      pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          pills.forEach(p => p.classList.remove('is-active'));
          pill.classList.add('is-active');

          const varPrice = Number(pill.dataset.price || 0);
          const varId = pill.dataset.variantId;
          const varName = pill.dataset.variantName;

          // Check if painting option is currently active on this card
          const activePaint = card.querySelector('.paint-btn.is-active[data-paint="yes"]');
          const paintExtra = activePaint ? Number(activePaint.dataset.add || 0) : 0;
          const finalPrice = varPrice + paintExtra;

          if (priceEl && varPrice) {
            priceEl.textContent = formatCurrency(finalPrice);
          }

          if (addBtn) {
            addBtn.dataset.basePrice = varPrice;
            addBtn.dataset.price = finalPrice;
            if (varId) addBtn.dataset.variantId = varId;
            if (varName) addBtn.dataset.variantName = varName;
          }
        });
      });
    });
  }

  // ── Painting Service Toggle Handler (Pintado Sí / No) ──
  function initPaintingToggles() {
    document.querySelectorAll('.product-card').forEach(card => {
      const paintOption = card.querySelector('.paint-option');
      if (!paintOption) return;

      const paintBtns = paintOption.querySelectorAll('.paint-btn');
      const priceEl = card.querySelector('.product-card__price');
      const addBtn = card.querySelector('.js-add-to-cart');
      if (!priceEl || !addBtn) return;

      // Ensure base price is recorded
      if (!addBtn.dataset.basePrice) {
        addBtn.dataset.basePrice = addBtn.dataset.price || card.dataset.price;
      }
      if (!card.dataset.basePrice) {
        card.dataset.basePrice = card.dataset.price || addBtn.dataset.price;
      }

      const getBasePrice = () => {
        const activeVariant = card.querySelector('.variant-pill.is-active');
        if (activeVariant && activeVariant.dataset.price) {
          return Number(activeVariant.dataset.price);
        }
        return Number(card.dataset.basePrice || addBtn.dataset.basePrice || 0);
      };

      paintBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          paintBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');

          const isPainted = btn.dataset.paint === 'yes';
          const extraCost = Number(btn.dataset.add || 0);
          const currentBase = getBasePrice();
          const finalPrice = currentBase + extraCost;

          priceEl.textContent = formatCurrency(finalPrice);
          addBtn.dataset.price = finalPrice;
          addBtn.dataset.painted = isPainted ? 'yes' : 'no';
          addBtn.dataset.paintLabel = btn.dataset.paintLabel || (isPainted ? 'Con Pintado Tabletop' : 'Sin pintar');
        });
      });
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── Global Live Search System ──
  function initGlobalSearch() {
    let searchModal = document.getElementById('searchModal');
    if (!searchModal) {
      searchModal = document.createElement('div');
      searchModal.id = 'searchModal';
      searchModal.className = 'search-modal';
      searchModal.setAttribute('role', 'dialog');
      searchModal.setAttribute('aria-modal', 'true');
      searchModal.setAttribute('aria-label', 'Buscador de modelos de Forja Levi');
      searchModal.innerHTML = `
        <div class="search-modal__backdrop" id="searchBackdrop"></div>
        <div class="search-modal__box">
          <div class="search-modal__header">
            <div class="search-modal__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input type="search" id="searchInput" class="search-modal__input" placeholder="Buscar miniaturas, dados, packs..." autocomplete="off" spellcheck="false" />
            <button type="button" class="search-modal__clear" id="searchClear" aria-label="Limpiar búsqueda" style="display: none;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <span class="search-modal__esc">ESC</span>
            <button type="button" class="search-modal__close" id="searchClose" aria-label="Cerrar buscador" title="Cerrar buscador (ESC)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="search-modal__chips" id="searchCategoryChips">
            <button type="button" class="search-chip is-active" data-cat="all">Todos</button>
            <button type="button" class="search-chip" data-cat="miniaturas-dnd">D&D / Rol</button>
            <button type="button" class="search-chip" data-cat="warhammer">Warhammer</button>
            <button type="button" class="search-chip" data-cat="packs-y-campanas">Packs & Kits</button>
            <button type="button" class="search-chip" data-cat="escenografia">Escenografía</button>
            <button type="button" class="search-chip" data-cat="torres-y-cajas">Torres & Cajas</button>
            <button type="button" class="search-chip" data-cat="dados-accesorios">Dados & Acc.</button>
          </div>
          <div class="search-modal__body" id="searchResultsBody"></div>
          <div class="search-modal__footer">
            <div class="search-modal__hints">
              <span class="search-modal__hint"><kbd>ESC</kbd> cerrar</span>
              <span class="search-modal__hint"><kbd>Ctrl</kbd> + <kbd>K</kbd> abrir</span>
            </div>
            <span style="color: var(--accent-light); font-size: 0.8rem; font-weight: 600;">⚔️ Forja Levi 3D</span>
          </div>
        </div>
      `;
      document.body.appendChild(searchModal);
    }

    const backdrop = document.getElementById('searchBackdrop');
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const closeBtn = document.getElementById('searchClose');
    const chipsCont = document.getElementById('searchCategoryChips');
    const resultsBody = document.getElementById('searchResultsBody');

    let currentCat = 'all';

    function normalize(str) {
      return (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }

    // Genera una expresión regular tolerante a acentos para cualquier término
    // Ej: "paladin" o "paladín" coincidirán tanto con "Paladín" como con "Paladin"
    function createAccentRegex(term) {
      const map = {
        'a': '[aáàäâAÁÀÄÂ]',
        'e': '[eéèëêEÉÈËÊ]',
        'i': '[iíìïîIÍÌÏÎ]',
        'o': '[oóòöôOÓÒÖÔ]',
        'u': '[uúùüûUÚÙÜÛ]',
        'n': '[nñNÑ]',
        'c': '[cçCÇ]'
      };
      const clean = (term || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      let pattern = '';
      for (const ch of clean) {
        pattern += map[ch] || ch.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      }
      return new RegExp(`(${pattern})`, 'gi');
    }

    function highlightMatch(text, query) {
      if (!query || !text) return text;
      const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
      if (terms.length === 0) return text;

      let result = text;
      terms.forEach(term => {
        try {
          const regex = createAccentRegex(term);
          result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
        } catch (e) {
          // fallback si hay algún caracter especial
        }
      });
      return result;
    }

    function extractTagText(t) {
      if (!t) return '';
      if (typeof t === 'string') return t;
      return t.text || '';
    }

    function getProducts() {
      if (window.ForjaCatalogData && window.ForjaCatalogData.products) {
        return {
          products: window.ForjaCatalogData.products,
          tiers: window.ForjaCatalogData.tiers || (window.FORJA_CATALOG_DATA ? window.FORJA_CATALOG_DATA.tiers : {})
        };
      }
      if (window.FORJA_CATALOG_DATA && window.FORJA_CATALOG_DATA.products) {
        return {
          products: window.FORJA_CATALOG_DATA.products,
          tiers: window.FORJA_CATALOG_DATA.tiers || {}
        };
      }
      return { products: [], tiers: {} };
    }

    function getCategoryName(catId) {
      const names = {
        'miniaturas-dnd': 'D&D / Pathfinder',
        'warhammer': 'Warhammer 40K / AoS',
        'packs-y-campanas': 'Packs & Campañas',
        'escenografia': 'Escenografía',
        'torres-y-cajas': 'Torres & Cajas',
        'dados-accesorios': 'Dados & Accesorios'
      };
      return names[catId] || catId;
    }

    function getCategoryUrl(catId) {
      const isSub = window.location.pathname.includes('/catalogo/');
      return isSub ? `${catId}.html` : `catalogo/${catId}.html`;
    }

    const POPULAR_SEARCHES = {
      'all': [
        { label: '🐉 Dragón Joven Rojo', q: 'dragon' },
        { label: '🤖 Dreadnought Pesado', q: 'dreadnought' },
        { label: '🛡️ Paladín Humano', q: 'paladin' },
        { label: '📦 Pack Escaramuza x25', q: 'pack 25' },
        { label: '🏰 Torre Castillo Medieval', q: 'castillo' },
        { label: '💀 Esqueletos de Cripta', q: 'esqueletos' },
        { label: '🎲 Aros de Condición', q: 'aros condicion' },
        { label: '⚔️ Capitán en Servoarmadura', q: 'capitan' }
      ],
      'miniaturas-dnd': [
        { label: '🐉 Dragón Joven Rojo', q: 'dragon' },
        { label: '🛡️ Paladín Humano', q: 'paladin' },
        { label: '🔮 Mago Elfo Arcano', q: 'mago' },
        { label: '🪓 Bárbaro Enano', q: 'barbaro' },
        { label: '🗡️ Pícaro Mediano', q: 'picaro' },
        { label: '💀 Esqueletos x5', q: 'esqueletos' },
        { label: '🧟 Goblins Saqueadores', q: 'goblins' },
        { label: '✨ Clérigo de la Luz', q: 'clerigo' }
      ],
      'warhammer': [
        { label: '🤖 Dreadnought de Combate', q: 'dreadnought' },
        { label: '⚔️ Capitán en Servoarmadura', q: 'capitan' },
        { label: '🛡️ Escuadrón Táctico x5', q: 'escuadron' },
        { label: '🐎 Caballero del Caos', q: 'caos' },
        { label: '🪓 Noble Orco Rebanadora', q: 'orco' },
        { label: '⚙️ Bits de Conversión x10', q: 'bits' },
        { label: '🔫 Tropas de Asalto', q: 'asalto' },
        { label: '⚡ Armadura de Élite', q: 'armadura' }
      ],
      'packs-y-campanas': [
        { label: '📦 Pack Escaramuza x25', q: 'pack 25' },
        { label: '🛡️ Pack Iniciación x10', q: 'pack 10' },
        { label: '⚔️ Pack Ejército x50', q: 'pack 50' },
        { label: '👑 Gran Campaña x100', q: 'pack 100' },
        { label: '🗺️ Campaña Starter Set', q: 'starter' },
        { label: '💀 Horda No-Muertos x18', q: 'no muertos' },
        { label: '🏰 Castillo & Mazmorras', q: 'castillo' },
        { label: '🐉 Guarida del Dragón Rojo', q: 'guarida' }
      ],
      'escenografia': [
        { label: '🏰 Ruinas Góticas 2 Niveles', q: 'ruinas' },
        { label: '🛡️ Barricadas y Muros x4', q: 'barricadas' },
        { label: '🧱 Dungeon Tiles x16', q: 'dungeon tiles' },
        { label: '🗼 Torre Fortificada', q: 'torre' },
        { label: '🌀 Portal Arcano', q: 'portal' },
        { label: '🪨 Muros Defensivos', q: 'muros' },
        { label: '🚪 Puertas & Pasillos', q: 'puertas' },
        { label: '🎯 Cobertura Táctica', q: 'cobertura' }
      ],
      'torres-y-cajas': [
        { label: '🏰 Torre Castillo Medieval', q: 'castillo' },
        { label: '🐉 Torre Cráneo Dragón', q: 'craneo dragon' },
        { label: '🌀 Torre Espiral Gótica', q: 'espiral' },
        { label: '🦷 Mímico Come-Dados', q: 'mimico' },
        { label: '🎒 Torre Plegable Viaje', q: 'plegable' },
        { label: '📖 Libro Grimorio', q: 'grimorio' },
        { label: '🏴‍☠️ Cofre del Tesoro', q: 'cofre' },
        { label: '⬡ Caja Hexagonal Dados', q: 'hexagonal' }
      ],
      'dados-accesorios': [
        { label: '🎲 Aros de Condición D&D', q: 'aros condicion' },
        { label: '❤️ Tracker de Vida Dial', q: 'tracker vida' },
        { label: '🎒 Bandeja Octogonal', q: 'bandeja octogonal' },
        { label: '✨ Tracker Spell Slots', q: 'spell slots' },
        { label: '⚔️ Marcadores Iniciativa', q: 'iniciativa' },
        { label: '🎯 Marcadores Objetivos x6', q: 'objetivos' },
        { label: '🎲 Accesorios de Mesa', q: 'accesorios' },
        { label: '🛡️ Pantalla DM', q: 'dm' }
      ]
    };

    function getCategoryTip(catId) {
      const tips = {
        'all': 'Podés buscar con o sin tildes (ej: <em>paladin</em> o <em>paladín</em>, <em>dragon</em> o <em>dragón</em>), por criatura, facción o accesorios.',
        'miniaturas-dnd': 'Filtrando por <strong>D&D / Rol</strong>. Buscá por clase (paladín, pícaro, mago, bárbaro), monstruos o esbirros.',
        'warhammer': 'Filtrando por <strong>Warhammer 40K / AoS</strong>. Buscá por dreadnought, servoarmadura, escuadrones, orcos, caos o bits.',
        'packs-y-campanas': 'Filtrando por <strong>Packs & Kits</strong>. Buscá por cantidad (x10, x25, x50, x100) o sets temáticos de campaña.',
        'escenografia': 'Filtrando por <strong>Escenografía</strong>. Buscá por ruinas, baldosas modulares de dungeon, barricadas o portales.',
        'torres-y-cajas': 'Filtrando por <strong>Torres & Cajas</strong>. Buscá por castillo medieval, cráneo de dragón, cofres o grimorios.',
        'dados-accesorios': 'Filtrando por <strong>Dados & Accesorios</strong>. Buscá por aros de condición, bandejas, diales de vida o marcadores.'
      };
      return tips[catId] || tips['all'];
    }

    function detectCategoryFromQuery(query) {
      const q = normalize(query);
      if (!q) return null;
      if (q.includes('warhammer') || q.includes('40k') || q.includes('aos') || q.includes('sigmar') || q.includes('space marine') || q.includes('marine')) return 'warhammer';
      if (q.includes('dnd') || q.includes('d&d') || q.includes('pathfinder') || q.includes('rol') || q.includes('dungeon master')) return 'miniaturas-dnd';
      if (q.includes('pack') || q.includes('kit') || q.includes('campana') || q.includes('lote')) return 'packs-y-campanas';
      if (q.includes('escenografia') || q.includes('ruina') || q.includes('dungeon tile') || q.includes('terreno')) return 'escenografia';
      if (q.includes('torre') || q.includes('caja') || q.includes('grimorio') || q.includes('cofre') || q.includes('maletin')) return 'torres-y-cajas';
      if (q.includes('dado') || q.includes('accesorio') || q.includes('aro') || q.includes('tracker') || q.includes('bandeja')) return 'dados-accesorios';
      return null;
    }

    function detectPageCategory() {
      const path = window.location.pathname;
      const cats = ['miniaturas-dnd', 'warhammer', 'packs-y-campanas', 'escenografia', 'torres-y-cajas', 'dados-accesorios'];
      for (const c of cats) {
        if (path.includes(c)) return c;
      }
      return 'all';
    }

    function setCategory(catId) {
      currentCat = catId;
      chipsCont.querySelectorAll('.search-chip').forEach(c => {
        if (c.dataset.cat === catId) {
          c.classList.add('is-active');
        } else {
          c.classList.remove('is-active');
        }
      });
    }

    function renderInitialState(cat = currentCat) {
      const popular = POPULAR_SEARCHES[cat] || POPULAR_SEARCHES['all'];
      const catLabel = cat === 'all' ? '' : ` en ${getCategoryName(cat)}`;
      const tipText = getCategoryTip(cat);

      const pillsHTML = popular.map(p => `
        <button type="button" class="search-suggestion-pill" data-q="${p.q}">
          ${p.label}
        </button>
      `).join('');

      resultsBody.innerHTML = `
        <div class="search-modal__suggestions">
          <div class="search-modal__section-label">🔥 Búsquedas Populares${catLabel}</div>
          <div class="search-modal__pills-wrap">
            ${pillsHTML}
          </div>
          <div class="search-modal__section-label">💡 Tip de Búsqueda</div>
          <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5;">
            ${tipText}
          </p>
        </div>
      `;

      resultsBody.querySelectorAll('.search-suggestion-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.q;
          clearBtn.style.display = 'flex';
          executeSearch();
          input.focus();
        });
      });
    }

    function executeSearch() {
      const rawQuery = input.value.trim();
      const normQuery = normalize(rawQuery);

      if (!normQuery) {
        clearBtn.style.display = 'none';
        renderInitialState(currentCat);
        return;
      }

      clearBtn.style.display = 'flex';

      const { products, tiers } = getProducts();
      const queryTokens = normQuery.split(/\s+/).filter(t => t.length > 0);

      // Filter con soporte 100% tolerante a acentos y mayúsculas
      let results = products.filter(p => {
        if (currentCat !== 'all' && p.category !== currentCat) {
          return false;
        }

        const catName = getCategoryName(p.category);
        const tagsStr = (p.tags || []).map(extractTagText).join(' ');

        // Comparación normalizada sin tildes
        const normName = normalize(p.name);
        const normDesc = normalize(p.description);
        const normTags = normalize(tagsStr);
        const normCat = normalize(catName);
        const fullHaystack = `${normName} ${normDesc} ${normTags} ${normCat} ${p.id || ''} ${p.category || ''}`;

        return queryTokens.every(tok => {
          // 1. Coincidencia directa en texto normalizado
          if (fullHaystack.includes(tok)) return true;

          // 2. Coincidencia por regex fonética / acentos
          const reg = createAccentRegex(tok);
          return reg.test(p.name) ||
                 reg.test(p.description) ||
                 reg.test(catName) ||
                 reg.test(tagsStr) ||
                 reg.test(p.category);
        });
      });

      if (results.length === 0) {
        const fallbackCat = currentCat !== 'all' ? currentCat : (detectCategoryFromQuery(rawQuery) || 'all');
        const fallbackPills = POPULAR_SEARCHES[fallbackCat] || POPULAR_SEARCHES['all'];
        const fallbackPillsHTML = fallbackPills.map(p => `
          <button type="button" class="search-suggestion-pill" data-q="${p.q}">
            ${p.label}
          </button>
        `).join('');

        resultsBody.innerHTML = `
          <div class="search-modal__empty">
            <div class="search-modal__empty-icon">🎲</div>
            <h4>No encontramos modelos para "${rawQuery}"${currentCat !== 'all' ? ` en ${getCategoryName(currentCat)}` : ''}</h4>
            <p>¿Buscás un modelo que no está en la lista o tenés tu propio archivo STL? ¡Podemos presupuestarlo e imprimirlo en resina 8K!</p>
            <a href="#" data-wa-text="Hola! Estaba buscando '${rawQuery}' en la web de Forja Levi y quería saber si lo pueden imprimir en 3D 🎲" target="_blank" rel="noopener noreferrer" class="btn btn--accent btn--small js-wa-link">
              Consultar por WhatsApp
            </a>
            <div class="search-modal__empty-suggestions">
              <div class="search-modal__section-label">🔥 Quizás te interese buscar${fallbackCat !== 'all' ? ` en ${getCategoryName(fallbackCat)}` : ''}:</div>
              <div class="search-modal__pills-wrap search-modal__pills-wrap--inline">
                ${fallbackPillsHTML}
              </div>
            </div>
          </div>
        `;
        if (typeof initWhatsAppLinks === 'function') initWhatsAppLinks();

        resultsBody.querySelectorAll('.search-suggestion-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            input.value = btn.dataset.q;
            clearBtn.style.display = 'flex';
            executeSearch();
            input.focus();
          });
        });
        return;
      }

      // Quick Context Pills si hay un filtro de categoría o coincidencia de categoría en la búsqueda
      const contextCat = currentCat !== 'all' ? currentCat : detectCategoryFromQuery(rawQuery);
      let contextPillsHTML = '';
      if (contextCat && POPULAR_SEARCHES[contextCat]) {
        const catPills = POPULAR_SEARCHES[contextCat].slice(0, 6);
        const pillsMarkup = catPills.map(p => `
          <button type="button" class="search-suggestion-pill" data-q="${p.q}">
            ${p.label}
          </button>
        `).join('');

        contextPillsHTML = `
          <div class="search-modal__cat-quick-pills">
            <span class="search-modal__cat-quick-title">🔥 Más buscados en ${getCategoryName(contextCat)}:</span>
            <div class="search-modal__pills-wrap search-modal__pills-wrap--inline">
              ${pillsMarkup}
            </div>
          </div>
        `;
      }

      const resultsHTML = results.map(p => {
        const tier = (p.tier && tiers[p.tier]) ? tiers[p.tier] : null;
        const effectivePrice = (tier && tier.price !== undefined && !p.overridePrice)
          ? tier.price
          : (p.price || 0);

        const priceDisplay = formatCurrency(effectivePrice);
        const catName = getCategoryName(p.category);
        const catUrl = getCategoryUrl(p.category);

        const titleHighlighted = highlightMatch(p.name, rawQuery);
        const descHighlighted = highlightMatch(p.description, rawQuery);

        const tagsHTML = (p.tags || []).slice(0, 2).map(t => `<span class="search-result-card__tag">${t.text}</span>`).join('');

        const imgSrc = (p.image && !p.image.startsWith('http') && !p.image.startsWith('/') && window.location.pathname.includes('/catalogo/'))
          ? '../' + p.image
          : p.image;

        const mediaHTML = p.image
          ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy" />`
          : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

        return `
          <div class="search-result-card">
            <div class="search-result-card__media">
              ${mediaHTML}
            </div>
            <div class="search-result-card__info">
              <span class="search-result-card__cat">${catName}</span>
              <h4 class="search-result-card__title">${titleHighlighted}</h4>
              <p class="search-result-card__desc">${descHighlighted}</p>
              <div class="search-result-card__tags">${tagsHTML}</div>
            </div>
            <div class="search-result-card__side">
              <span class="search-result-card__price">${priceDisplay}</span>
              <div class="search-result-card__actions">
                <button type="button" class="btn btn--accent btn--small search-result-card__btn js-add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${effectivePrice}" data-painted="no" data-paint-label="Sin pintar">
                  + Pedido
                </button>
                <a href="${catUrl}#${p.id}" class="search-result-card__link js-search-view-link" data-cat="${p.category}" data-id="${p.id}" title="Ver tarjeta de este modelo">
                  Ver ➜
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      resultsBody.innerHTML = `
        <div class="search-modal__count">
          Se encontraron <strong>${results.length}</strong> modelo${results.length === 1 ? '' : 's'}${currentCat !== 'all' ? ` en ${getCategoryName(currentCat)}` : ''}:
        </div>
        ${contextPillsHTML}
        <div class="search-modal__list">
          ${resultsHTML}
        </div>
      `;

      // Quick Context Pills click event
      resultsBody.querySelectorAll('.search-modal__cat-quick-pills .search-suggestion-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.q;
          clearBtn.style.display = 'flex';
          executeSearch();
          input.focus();
        });
      });

      // Navegar directo a la tarjeta específica al tocar "Ver" o la información de la tarjeta
      resultsBody.querySelectorAll('.js-search-view-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          navigateToProduct(link.dataset.cat, link.dataset.id);
        });
      });

      resultsBody.querySelectorAll('.search-result-card__info, .search-result-card__media').forEach(clickable => {
        clickable.style.cursor = 'pointer';
        clickable.addEventListener('click', () => {
          const card = clickable.closest('.search-result-card');
          const viewLink = card.querySelector('.js-search-view-link');
          if (viewLink) {
            navigateToProduct(viewLink.dataset.cat, viewLink.dataset.id);
          }
        });
      });
    }

    // Navega a la tarjeta del modelo, haciendo scroll suave y destello visual
    function navigateToProduct(catId, productId) {
      closeSearch();
      const isCurrentSubpage = window.location.pathname.endsWith(`${catId}.html`);
      const targetHash = `#${productId}`;

      if (isCurrentSubpage) {
        const targetEl = document.getElementById(productId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.classList.add('highlight-target');
          setTimeout(() => targetEl.classList.remove('highlight-target'), 2500);
          try {
            history.replaceState(null, '', targetHash);
          } catch (_) {}
        }
      } else {
        const isSub = window.location.pathname.includes('/catalogo/');
        const base = isSub ? `${catId}.html` : `catalogo/${catId}.html`;
        window.location.href = `${base}${targetHash}`;
      }
    }

    function openSearch() {
      searchModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      input.value = '';
      clearBtn.style.display = 'none';
      const pageCat = detectPageCategory();
      setCategory(pageCat);
      renderInitialState(currentCat);
      setTimeout(() => input.focus(), 50);
    }

    function closeSearch() {
      searchModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    // Listeners
    if (backdrop) backdrop.addEventListener('click', closeSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      renderInitialState(currentCat);
      input.focus();
    });

    input.addEventListener('input', executeSearch);

    chipsCont.querySelectorAll('.search-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        setCategory(chip.dataset.cat);
        executeSearch();
      });
    });

    // Open triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.js-open-search, #searchToggle');
      if (trigger) {
        e.preventDefault();
        openSearch();
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchModal.classList.contains('is-open')) {
          closeSearch();
        } else {
          openSearch();
        }
        return;
      }

      if (e.key === '/' && !searchModal.classList.contains('is-open')) {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          openSearch();
          return;
        }
      }

      if (e.key === 'Escape' && searchModal.classList.contains('is-open')) {
        e.preventDefault();
        closeSearch();
      }
    });
  }

  function initCatalogInteractions() {
    initVariantSelectors();
    initPaintingToggles();
    initReveal();
    initWhatsAppLinks();
  }
  window.ForjaInitCatalogInteractions = initCatalogInteractions;

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    initParticles();
    initDynamicFilters();
    initCatalogInteractions();
    initWhatsAppLinks();
    initGlobalSearch();

    // Auto-scroll y destello si se ingresa directamente con ancla (ej: #dnd-picaro-tiefling o #servicio-foto)
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
      }, 250);
    }
  });

})();

