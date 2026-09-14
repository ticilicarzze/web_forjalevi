/* ============================================
   FORJA LEVI — Main JavaScript
   Mobile nav, scroll effects, reveal animations,
   particles, and WhatsApp Interactive Cart
   ============================================ */

(function () {
  'use strict';

  // ── Config ──
  const WHATSAPP_PHONE = '5493416476504';
  const STORAGE_KEY = 'forjalevi_cart_v1';

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

  // ── Cart Operations (with Variant & MP Support) ──
  function addToCart(id, name, price, variantId = null, variantName = null) {
    const key = variantId ? `${id}__${variantId}` : id;
    const existing = cart.find(item => (item.cartItemId === key) || (item.id === id && item.variantId === variantId));
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: id,
        cartItemId: key,
        variantId: variantId || null,
        variantName: variantName || null,
        name: name,
        price: Number(price) || 0,
        qty: 1
      });
    }
    saveCart();
    renderCart();
    bumpBadges();
    const displayName = variantName ? `${name} (${variantName})` : name;
    showToast(`⚔️ Agregado: <strong>${displayName}</strong>`);
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

  // ── Add to Cart Buttons in Grid ──
  document.querySelectorAll('.js-add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = btn.dataset.price;
      const variantId = btn.dataset.variantId || null;
      const variantName = btn.dataset.variantName || null;
      addToCart(id, name, price, variantId, variantName);
    });
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
        lines.push(`• *${item.qty}x* ${item.name}${varText} (${itemSubtotal})`);
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
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // ── Mercado Pago Payload Generator (Ready for Backend/Preference API) ──
  function generateMercadoPagoPayload(customer = {}) {
    return {
      items: cart.map(item => ({
        id: item.variantId ? `${item.id}-${item.variantId}` : item.id,
        title: item.variantName ? `${item.name} (${item.variantName})` : item.name,
        unit_price: Number(item.price),
        quantity: Number(item.qty),
        currency_id: 'ARS'
      })),
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
    generateMercadoPagoPayload
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

      const items = targetContainer.querySelectorAll('[data-category]');

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');

          const filterVal = chip.getAttribute('data-filter');

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

          const varPrice = pill.dataset.price;
          const varId = pill.dataset.variantId;
          const varName = pill.dataset.variantName;

          if (priceEl && varPrice) {
            priceEl.textContent = formatCurrency(Number(varPrice));
          }

          if (addBtn) {
            if (varPrice) addBtn.dataset.price = varPrice;
            if (varId) addBtn.dataset.variantId = varId;
            if (varName) addBtn.dataset.variantName = varName;
          }
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

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    initReveal();
    initParticles();
    initDynamicFilters();
    initVariantSelectors();
  });

})();

