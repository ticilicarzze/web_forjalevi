/**
 * FORJA LEVI — Checkout Page Logic
 * Finalizar Pedido por WhatsApp con datos de contacto y resumen sin imágenes
 */

(function () {
  'use strict';

  const WHATSAPP_PHONE = '5493416476504';
  const STORAGE_KEY = 'forjalevi_cart_v1';
  const CUSTOMER_INFO_KEY = 'forjalevi_customer_info_v1';

  // DOM Elements
  const checkoutGrid       = document.getElementById('checkoutGrid');
  const checkoutEmptyState = document.getElementById('checkoutEmptyState');
  const itemsListCont      = document.getElementById('checkoutItemsList');
  const totalCountEl       = document.getElementById('checkoutTotalCount');
  const totalAmountEl      = document.getElementById('checkoutTotalAmount');
  const shippingLabelEl    = document.getElementById('checkoutShippingLabel');
  const btnWhatsapp        = document.getElementById('btnWhatsappCheckout');
  const toastEl            = document.getElementById('toastNotification');

  // Customer Inputs
  const inputName          = document.getElementById('customerName');
  const inputLocation      = document.getElementById('customerLocation');
  const inputPhone         = document.getElementById('customerPhone');
  const inputNotes         = document.getElementById('customerNotes');
  const headerContinueBtn  = document.getElementById('headerContinueBtn');
  const footerContinueBtn  = document.getElementById('footerContinueBtn');

  let cart = [];

  // ── Currency Formatter ──
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // ── Toast Helper ──
  function showToast(message) {
    if (!toastEl) return;
    toastEl.innerHTML = message;
    toastEl.classList.add('is-active');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('is-active');
    }, 3000);
  }

  // ── Load & Save Cart ──
  function loadCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Error al guardar carrito', e);
    }
  }

  // ── Customer Info Persistence ──
  function loadCustomerInfo() {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_INFO_KEY) || '{}');
      if (inputName && saved.name) inputName.value = saved.name;
      if (inputLocation && saved.location) inputLocation.value = saved.location;
      if (inputPhone && saved.phone) inputPhone.value = saved.phone;
      if (inputNotes && saved.notes) inputNotes.value = saved.notes;
    } catch (e) {}
  }

  function saveCustomerInfo() {
    try {
      const data = {
        name: inputName ? inputName.value.trim() : '',
        location: inputLocation ? inputLocation.value.trim() : '',
        phone: inputPhone ? inputPhone.value.trim() : '',
        notes: inputNotes ? inputNotes.value.trim() : ''
      };
      localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  [inputName, inputLocation, inputPhone, inputNotes].forEach(input => {
    if (!input) return;
    input.addEventListener('input', saveCustomerInfo);
  });

  // ── Totals Calculation ──
  function getCartTotal() {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  function getCartCount() {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }

  // ── Update Qty & Remove ──
  function updateQty(key, delta) {
    const item = cart.find(i => (i.cartItemId || i.id) === key);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => (i.cartItemId || i.id) !== key);
    }
    saveCart();
    renderSummary();
  }

  function removeItem(key) {
    cart = cart.filter(i => (i.cartItemId || i.id) !== key);
    saveCart();
    renderSummary();
    showToast('Producto eliminado del pedido');
  }

  // ── Render Summary (Sin Imágenes) ──
  function renderSummary() {
    if (!itemsListCont) return;

    if (cart.length === 0) {
      if (checkoutGrid) checkoutGrid.style.display = 'none';
      if (checkoutEmptyState) checkoutEmptyState.style.display = 'block';
      return;
    }

    if (checkoutGrid) checkoutGrid.style.display = 'grid';
    if (checkoutEmptyState) checkoutEmptyState.style.display = 'none';

    const totalCount = getCartCount();
    const totalAmount = getCartTotal();

    if (totalCountEl) totalCountEl.textContent = `${totalCount} u.`;
    if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);

    // List items cleanly (no images)
    itemsListCont.innerHTML = cart.map(item => {
      const itemKey = item.cartItemId || item.id;
      const subtotal = item.price * item.qty;
      const paintBadge = item.isPainted
        ? `<span style="color: #ffb74d;">🖌️ ${item.paintLabel || 'Pintado Tabletop'}</span>`
        : `<span>⚪ Sin pintar</span>`;

      return `
        <div class="checkout-summary-item" data-key="${itemKey}">
          <div class="checkout-item__details">
            <span class="checkout-item__name">${item.name}</span>
            <div class="checkout-item__meta">
              <span class="checkout-item__badge">x${item.qty}</span>
              ${item.variantName ? `<span>🎨 ${item.variantName}</span> &middot; ` : ''}
              ${paintBadge}
            </div>
          </div>
          <div class="checkout-item__actions">
            <div class="cart-item__controls" style="margin: 0;">
              <button type="button" class="cart-item__btn-qty js-minus" data-key="${itemKey}" aria-label="Restar uno">&minus;</button>
              <span class="cart-item__qty">${item.qty}</span>
              <button type="button" class="cart-item__btn-qty js-plus" data-key="${itemKey}" aria-label="Sumar uno">&plus;</button>
            </div>
            <span class="checkout-item__price">${formatCurrency(subtotal)}</span>
            <button type="button" class="cart-item__remove js-remove" data-key="${itemKey}" aria-label="Eliminar producto" title="Eliminar producto">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    itemsListCont.querySelectorAll('.js-minus').forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.key, -1));
    });
    itemsListCont.querySelectorAll('.js-plus').forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.key, 1));
    });
    itemsListCont.querySelectorAll('.js-remove').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.key));
    });
  }

  // ── Shipping Method radio changes ──
  document.querySelectorAll('input[name="shippingMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (shippingLabelEl) {
        shippingLabelEl.textContent = e.target.value === 'Retiro en Rosario' 
          ? 'Retiro gratis en Rosario' 
          : 'A coordinar (Correo)';
      }
    });
  });

  // ── Finalizar Pedido por WhatsApp ──
  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Tu carrito está vacío.');
        return;
      }

      const name = inputName ? inputName.value.trim() : '';
      const location = inputLocation ? inputLocation.value.trim() : '';
      const phone = inputPhone ? inputPhone.value.trim() : '';
      const notes = inputNotes ? inputNotes.value.trim() : '';

      if (!name) {
        showToast('⚠️ Por favor ingresá tu nombre y apellido.');
        inputName && inputName.focus();
        return;
      }

      if (!location) {
        showToast('⚠️ Por favor ingresá tu ciudad o CP para el envío.');
        inputLocation && inputLocation.focus();
        return;
      }

      const shippingRadio = document.querySelector('input[name="shippingMethod"]:checked');
      const shippingMethod = shippingRadio ? shippingRadio.value : 'A coordinar';

      const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
      const paymentMethod = paymentRadio ? paymentRadio.value : 'A convenir';

      const total = getCartTotal();

      // Build WhatsApp message
      const lines = [];
      lines.push('⚔️ *¡Hola Forja Levi! Quiero confirmar este pedido:*');
      lines.push('━━━━━━━━━━━━━━━━━━━━');

      cart.forEach(item => {
        const itemSubtotal = formatCurrency(item.price * item.qty);
        const varText = item.variantName ? ` [${item.variantName}]` : '';
        const paintText = item.isPainted ? ` 🖌️(${item.paintLabel || 'Pintado Tabletop'})` : ` ⚪(Sin pintar)`;
        lines.push(`• *${item.qty}x* ${item.name}${varText}${paintText} (${itemSubtotal})`);
      });

      lines.push('━━━━━━━━━━━━━━━━━━━━');
      lines.push(`💰 *Total estimado:* ${formatCurrency(total)}`);
      lines.push(`👤 *Cliente:* ${name}`);
      lines.push(`📍 *Destino / CP:* ${location}`);
      if (phone) {
        lines.push(`📞 *Teléfono:* ${phone}`);
      }
      lines.push(`🚚 *Entrega:* ${shippingMethod}`);
      lines.push(`💳 *Pago preferido:* ${paymentMethod}`);
      if (notes) {
        lines.push(`📝 *Notas / STL:* ${notes}`);
      }
      lines.push('━━━━━━━━━━━━━━━━━━━━');
      lines.push('¿Me confirmás disponibilidad y fecha estimada de entrega? ¡Muchas gracias! 🎲');

      const message = lines.join('\n');
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // ── Seguir Comprando handlers ──
  function handleContinueShopping(e) {
    if (window.opener && !window.opener.closed) {
      e.preventDefault();
      window.close();
    }
  }

  if (headerContinueBtn) headerContinueBtn.addEventListener('click', handleContinueShopping);
  if (footerContinueBtn) footerContinueBtn.addEventListener('click', handleContinueShopping);

  // ── Listen for changes across tabs ──
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadCart();
      renderSummary();
    }
  });

  // ── Init ──
  loadCart();
  loadCustomerInfo();
  renderSummary();
})();
