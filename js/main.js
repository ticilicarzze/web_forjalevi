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
  const cartCheckout  = document.getElementById('cartCheckoutBtn');
  const cartClearBtn  = document.getElementById('cartClearBtn');
  const orderNameInp  = document.getElementById('orderName');
  const orderNotesInp = document.getElementById('orderNotes');
  const toastEl       = document.getElementById('toastNotification');

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

  // ── Cart Operations (with Variant, Painting & MP Support) ──
  function addToCart(id, name, price, variantId = null, variantName = null, isPainted = false, paintLabel = null) {
    const paintKey = isPainted ? 'painted' : 'raw';
    const variantKey = variantId || 'std';
    const key = `${id}__${variantKey}__${paintKey}`;
    const existing = cart.find(item => item.cartItemId === key);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: id,
        cartItemId: key,
        variantId: variantId || null,
        variantName: variantName || null,
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
      return `
        <div class="cart-item" data-key="${itemKey}">
          <div class="cart-item__info">
            <h4 class="cart-item__title" title="${item.name}">${item.name}</h4>
            ${item.variantName ? `<div class="cart-item__variant"><span>🎨</span> ${item.variantName}</div>` : ''}
            <div class="cart-item__variant" style="color: ${item.isPainted ? '#ffb74d' : 'var(--text-muted)'}; font-size: 0.74rem;">
              <span>${item.isPainted ? '🖌️' : '⚪'}</span> ${item.paintLabel || (item.isPainted ? 'Pintado Tabletop' : 'Sin pintar')}
            </div>
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

  // Esc key to close drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('is-open')) {
      closeCart();
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

  // ── WhatsApp Checkout Compilation ──
  if (cartCheckout) {
    cartCheckout.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Tu lista está vacía. ¡Agregá items primero!');
        return;
      }

      const total = getCartTotal();
      const customerName = orderNameInp ? orderNameInp.value.trim() : '';
      const orderNotes   = orderNotesInp ? orderNotesInp.value.trim() : '';

      // Format WhatsApp Message
      let lines = [];
      lines.push('⚔️ *¡Hola Forja Levi! Quiero coordinar este pedido:*');
      lines.push('━━━━━━━━━━━━━━━━━━━━');

      cart.forEach(item => {
        const itemSubtotal = formatCurrency(item.price * item.qty);
        const varText = item.variantName ? ` [${item.variantName}]` : '';
        const paintText = item.isPainted ? ` 🖌️(${item.paintLabel || 'Pintado Tabletop'})` : ` ⚪(Sin pintar)`;
        lines.push(`• *${item.qty}x* ${item.name}${varText}${paintText} (${itemSubtotal})`);
      });

      lines.push('━━━━━━━━━━━━━━━━━━━━');
      lines.push(`💰 *Total estimado:* ${formatCurrency(total)}`);

      if (customerName) {
        lines.push(`👤 *Nombre:* ${customerName}`);
      }
      if (orderNotes) {
        lines.push(`📝 *Detalles / STL:* ${orderNotes}`);
      }

      lines.push('📍 *Ubicación:* Rosario / Envío');
      lines.push('━━━━━━━━━━━━━━━━━━━━');
      lines.push('¿Tienen disponibilidad y tiempos estimados? ¡Muchas gracias! 🎲');

      const message = lines.join('\n');
      const whatsappUrl = getWhatsAppUrl(message);

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
        name: customer.name || (orderNameInp ? orderNameInp.value.trim() : ''),
        email: customer.email || ''
      },
      metadata: {
        notes: customer.notes || (orderNotesInp ? orderNotesInp.value.trim() : ''),
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
            <input type="search" id="searchInput" class="search-modal__input" placeholder="Buscar miniaturas, dragones, packs, torres, accesorios..." autocomplete="off" spellcheck="false" />
            <button type="button" class="search-modal__clear" id="searchClear" aria-label="Limpiar búsqueda" style="display: none;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <span class="search-modal__esc">ESC</span>
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

    function highlightMatch(text, query) {
      if (!query || !text) return text;
      const terms = query.split(/\s+/).filter(t => t.length > 0);
      if (terms.length === 0) return text;

      let result = text;
      terms.forEach(term => {
        const regex = new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
      });
      return result;
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

    function renderInitialState() {
      const popular = [
        { label: '🐉 Dragón Joven Rojo', q: 'dragon' },
        { label: '🦷 Mímico Come-Dados', q: 'mimico' },
        { label: '🛡️ Paladín Humano', q: 'paladin' },
        { label: '📦 Pack x25 Escaramuza', q: 'pack 25' },
        { label: '💀 Esqueletos de la Cripta', q: 'esqueletos' },
        { label: '🏰 Torre Castillo Medieval', q: 'castillo' },
        { label: '🎲 Aros de Condición', q: 'aros condicion' },
        { label: '⚔️ Capitán Espacial', q: 'capitan espacial' }
      ];

      const pillsHTML = popular.map(p => `
        <button type="button" class="search-suggestion-pill" data-q="${p.q}">
          ${p.label}
        </button>
      `).join('');

      resultsBody.innerHTML = `
        <div class="search-modal__suggestions">
          <div class="search-modal__section-label">🔥 Búsquedas Populares</div>
          <div class="search-modal__pills-wrap">
            ${pillsHTML}
          </div>
          <div class="search-modal__section-label">💡 Tip de Búsqueda</div>
          <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5;">
            Podés buscar por facción, tipo de criatura (ej: <em>goblin, orco, dragón</em>), accesorios (<em>aros, dados, torre</em>) o packs de campaña.
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
        renderInitialState();
        return;
      }

      clearBtn.style.display = 'flex';

      const { products, tiers } = getProducts();
      const queryTokens = normQuery.split(/\s+/).filter(t => t.length > 0);

      // Filter
      let results = products.filter(p => {
        if (currentCat !== 'all' && p.category !== currentCat) {
          return false;
        }

        const normName = normalize(p.name);
        const normDesc = normalize(p.description);
        const normTags = normalize((p.tags || []).map(t => t.text).join(' '));
        const normCat = normalize(getCategoryName(p.category));

        const fullHaystack = `${normName} ${normDesc} ${normTags} ${normCat}`;
        return queryTokens.every(tok => fullHaystack.includes(tok));
      });

      if (results.length === 0) {
        resultsBody.innerHTML = `
          <div class="search-modal__empty">
            <div class="search-modal__empty-icon">🎲</div>
            <h4>No encontramos modelos para "${rawQuery}"</h4>
            <p>¿Buscás un modelo que no está en la lista o tenés tu propio archivo STL? ¡Podemos presupuestarlo e imprimirlo en resina 8K!</p>
            <a href="#" data-wa-text="Hola! Estaba buscando '${rawQuery}' en la web de Forja Levi y quería saber si lo pueden imprimir en 3D 🎲" target="_blank" rel="noopener noreferrer" class="btn btn--accent btn--small js-wa-link">
              Consultar por WhatsApp
            </a>
          </div>
        `;
        if (typeof initWhatsAppLinks === 'function') initWhatsAppLinks();
        return;
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

        const mediaHTML = p.image
          ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />`
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
                <a href="${catUrl}" class="search-result-card__link" title="Ver categoría">
                  Ver ➜
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      resultsBody.innerHTML = `
        <div class="search-modal__count">
          Se encontraron <strong>${results.length}</strong> modelo${results.length === 1 ? '' : 's'}:
        </div>
        <div class="search-modal__list">
          ${resultsHTML}
        </div>
      `;
    }

    function openSearch() {
      searchModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      input.value = '';
      clearBtn.style.display = 'none';
      renderInitialState();
      setTimeout(() => input.focus(), 50);
    }

    function closeSearch() {
      searchModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    // Listeners
    if (backdrop) backdrop.addEventListener('click', closeSearch);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      renderInitialState();
      input.focus();
    });

    input.addEventListener('input', executeSearch);

    chipsCont.querySelectorAll('.search-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipsCont.querySelectorAll('.search-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        currentCat = chip.dataset.cat;
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
  });

})();

