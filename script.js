/**
 * ZIROX STORE — MAIN APPLICATION CONTROLLER
 * Architecture: Clean ES Modules, Service Layer, and XSS-Defensive UI Rendering.
 */

import { StorageService } from './storage.js';
import { escapeHTML, sanitizeURL } from './security.js';
import { TRANSLATIONS, t, localize, formatPrice, setLanguage, getCurrentLang } from './i18n.js';
import { ProductsService } from './products.js';
import { CartService } from './cart.js';
import {
    calculateShippingCost,
    getWilayaZone,
    FREE_SHIPPING_THRESHOLD,
    getFreeShippingStatus
} from './shipping.js';

// =============================================================================
// 1. TOAST NOTIFICATIONS (SAFE DOM CONSTRUCTED)
// =============================================================================
let toastContainer = document.querySelector('.toast-container');
if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

export function showToast(title, message, image = '', icon = '🛍️') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const safeTitle = escapeHTML(title);
    const safeMessage = escapeHTML(message);
    const safeImg = sanitizeURL(image, '');

    const visualMedia = safeImg
        ? `<img src="${safeImg}" alt="${safeTitle}" class="toast-img" onerror="this.style.display='none'">`
        : `<div class="toast-icon">${escapeHTML(icon)}</div>`;

    toast.innerHTML = `
        ${visualMedia}
        <div class="toast-content">
            <h5>${safeTitle}</h5>
            <p>${safeMessage}</p>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}

window.showToast = showToast;

// =============================================================================
// 2. PRODUCT CARD BUILDER (XSS-PROTECTED)
// =============================================================================
export function buildProductCard(product) {
    if (!product) return '';

    const id = escapeHTML(product.id || '');
    const name = escapeHTML(localize(product.name));
    const categoryKey = escapeHTML((product.categoryKey || 'general').toLowerCase());
    const category = escapeHTML(localize(product.category) || 'General');
    const rawShortDesc = localize(product.shortDesc) || localize(product.description) || '';
    const shortDesc = escapeHTML(rawShortDesc);
    const imageSrc = sanitizeURL(product.image, 'assets/product-image.png');
    const price = parseInt(product.price, 10) || 0;
    const formattedPrice = escapeHTML(formatPrice(price));
    const ratingVal = (parseFloat(product.rating) || 4.9).toFixed(1);
    const reviewsVal = parseInt(product.reviewsCount, 10) || 24;
    const stock = typeof product.stock === 'number' ? product.stock : 10;

    // Badges
    let badgeClass = '';
    let badgeHTML = '';
    const localizedBadge = localize(product.badge);
    if (localizedBadge) {
        const b = String(localizedBadge).toUpperCase();
        if (b.includes('SALE') || b.includes('%') || b.includes('تخفيض') || b.includes('SOLDE')) badgeClass = 'sale';
        else if (b.includes('BEST') || b.includes('TOP') || b.includes('أكثر') || b.includes('MEILLEUR')) badgeClass = 'bestseller';
        badgeHTML = `<span class="product-badge ${badgeClass}">${escapeHTML(localizedBadge)}</span>`;
    }

    // Old Price
    const oldPriceHTML = product.oldPrice
        ? `<span class="product-old-price">${escapeHTML(formatPrice(product.oldPrice))}</span>`
        : '';

    // Low stock warning
    const isLowStock = stock > 0 && stock <= 5;
    const lowStockHTML = isLowStock
        ? `<div style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.72rem;font-weight:700;color:#dc2626;background:rgba(220,38,38,0.08);padding:0.2rem 0.6rem;border-radius:var(--radius-full);width:max-content;margin-top:2px;">${escapeHTML(t('stock_low_badge').replace('{stock}', stock))}</div>`
        : '';

    const isOutOfStock = stock === 0;
    const buttonText = isOutOfStock ? escapeHTML(t('sold_out')) : escapeHTML(t('add_to_cart'));

    return `
    <div class="product-card" data-category="${categoryKey}">
        ${badgeHTML}
        <div class="product-img">
            <img src="${imageSrc}" alt="${name}" loading="lazy" onerror="this.src='assets/product-image.png'">
            <div class="quick-view-overlay">
                <a href="product-view.html?id=${id}" class="quick-view-btn">${escapeHTML(t('view_details'))}</a>
            </div>
        </div>
        <div class="product-details">
            <div class="product-category-meta">
                <span class="product-category">${category}</span>
                <span class="product-rating">★ ${ratingVal} <span style="color:var(--text-muted);font-weight:500;font-size:0.7rem;">(${reviewsVal})</span></span>
            </div>
            <a href="product-view.html?id=${id}" style="text-decoration:none;color:inherit;">
                <h3>${name}</h3>
            </a>
            <p class="product-desc">${shortDesc}</p>
            ${lowStockHTML}
            <div class="product-footer">
                <div class="price-wrap">
                    ${oldPriceHTML}
                    <span class="product-price">${formattedPrice}</span>
                </div>
                <button class="buy-btn add-to-cart-btn"
                    data-id="${id}"
                    data-name="${name}"
                    data-price="${price}"
                    data-image="${imageSrc}"
                    ${isOutOfStock ? 'disabled aria-disabled="true"' : ''}>
                    <span>${buttonText}</span>
                </button>
            </div>
        </div>
    </div>`;
}

// =============================================================================
// 3. CATALOG RENDERERS
// =============================================================================

export async function renderFeaturedProducts() {
    const grid = document.querySelector('.featured-products .products-grid') ||
                 document.querySelector('.products-grid:not(.shop-grid)');
    if (!grid) return;

    const products = await ProductsService.getAll();
    if (!products || products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--color-black-60);">${escapeHTML(t('catalog_empty'))}</div>`;
        return;
    }

    const featured = products.slice(0, 6);
    grid.innerHTML = featured.map(buildProductCard).join('');
}

let shopInitialized = false;
const HOME_GRID_LIMIT = 6;

export async function renderShopProducts() {
    const grid = document.querySelector('.shop-grid');
    if (!grid) return;

    // Homepage (#trending-grid) shows a curated subset; products.html shows all
    const limit = grid.id === 'trending-grid' ? HOME_GRID_LIMIT : Infinity;
    const products = await ProductsService.getAll();

    if (!shopInitialized) {
        shopInitialized = true;
        // Mount shimmer skeleton
        grid.innerHTML = Array(6).fill(0).map(() => `
            <div class="skeleton-card" style="padding: 16px; border-radius: 20px; border: 1px solid var(--border-light); background: var(--surface-white);">
                <div class="skeleton-box" style="height: 240px; border-radius: 14px; margin-bottom: 14px;"></div>
                <div class="skeleton-box" style="height: 18px; width: 75%; margin-bottom: 8px;"></div>
                <div class="skeleton-box" style="height: 14px; width: 45%; margin-bottom: 14px;"></div>
                <div class="skeleton-box" style="height: 42px; border-radius: 9999px;"></div>
            </div>
        `).join('');

        setTimeout(() => {
            if (!products || products.length === 0) {
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:70px;color:var(--color-black-60);">${escapeHTML(t('catalog_empty'))}</div>`;
                return;
            }
            grid.innerHTML = products.slice(0, limit).map(buildProductCard).join('');
            setupShopFilters(products, limit);
        }, 180);
        return;
    }

    if (!products || products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:70px;color:var(--color-black-60);">${escapeHTML(t('catalog_empty'))}</div>`;
        return;
    }

    grid.innerHTML = products.slice(0, limit).map(buildProductCard).join('');
    setupShopFilters(products, limit);
}

function setupShopFilters(allProducts, limit = Infinity) {
    const filterBtns  = document.querySelectorAll('.filter-btn');
    const sortSelect  = document.querySelector('.sort-select');
    const grid        = document.querySelector('.shop-grid');
    const searchInput = document.getElementById('product-search');
    if (!grid) return;

    // استرجاع الفلتر النشط حالياً من الواجهة للحفاظ عليه عبر اللغات
    let activeCategory = 'all';
    const activeBtnEl = document.querySelector('.filter-btn.active');
    if (activeBtnEl) {
        activeCategory = (activeBtnEl.getAttribute('data-category') || 'all').toLowerCase();
    }

    // استرجاع الترتيب المختار
    let sortOrder = 'featured';
    if (sortSelect) {
        const v = (sortSelect.value || '').toLowerCase();
        if (v.includes('low') || v.includes('croissant') || v.includes('الأقل')) sortOrder = 'low';
        else if (v.includes('high') || v.includes('décroissant') || v.includes('الأعلى')) sortOrder = 'high';
        else if (v.includes('newest') || v.includes('nouveautés') || v.includes('الأحدث')) sortOrder = 'newest';
    }

    let searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const applyFiltersAndSort = () => {
        const filtered = ProductsService.filterAndSort(allProducts, {
            category: activeCategory,
            searchQuery,
            sortOrder
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--color-black-60);">
                    <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
                    <h3>${escapeHTML(t('search_placeholder') || 'No products found')}</h3>
                </div>`;
        } else {
            grid.innerHTML = filtered.slice(0, limit).map(buildProductCard).join('');
        }
    };

    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = (btn.getAttribute('data-category') || 'all').toLowerCase();
            applyFiltersAndSort();
        };
    });

    let searchDebounceTimer;
    if (searchInput) {
        searchInput.oninput = (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                searchQuery = e.target.value.trim().toLowerCase();
                applyFiltersAndSort();
            }, 200);
        };
    }

    if (sortSelect) {
        sortSelect.onchange = () => {
            const val = sortSelect.value.toLowerCase();
            if (val.includes('low') || val.includes('croissant') || val.includes('الأقل')) sortOrder = 'low';
            else if (val.includes('high') || val.includes('décroissant') || val.includes('الأعلى')) sortOrder = 'high';
            else if (val.includes('newest') || val.includes('nouveautés') || val.includes('الأحدث')) sortOrder = 'newest';
            else sortOrder = 'featured';
            applyFiltersAndSort();
        };
    }

    // تطبيق الفلتر فوراً إذا كانت هناك حالة مسبقة غير الافتراضية
    if (activeCategory !== 'all' || searchQuery || sortOrder !== 'featured') {
        applyFiltersAndSort();
    }
}

// =============================================================================
// 4. PRODUCT DETAIL VIEW (product-view.html)
// =============================================================================

export async function renderProductView() {
    const viewContainer = document.querySelector('.product-view-container');
    if (!viewContainer) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    let p = null;
    if (productId) {
        p = await ProductsService.getById(productId);
    }
    if (!p) {
        const all = await ProductsService.getAll();
        p = all && all.length > 0 ? all[0] : null;
    }

    if (!p) {
        viewContainer.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:80px 20px;">
                <h2>${escapeHTML(t('product_not_found'))}</h2>
                <a href="products.html" class="btn-primary" style="margin-top:20px;">${escapeHTML(t('browse_all'))}</a>
            </div>`;
        return;
    }

    const rawName = localize(p.name);
    const name = escapeHTML(rawName);
    document.title = `${name} | Zirox Store`;

    const category = escapeHTML(localize(p.category) || 'General');
    const imageSrc = sanitizeURL(p.image, 'assets/product-image.png');
    const formattedPrice = escapeHTML(formatPrice(p.price));
    const rawDesc = localize(p.description) || localize(p.shortDesc) || '';
    const safeDesc = escapeHTML(rawDesc).replace(/\n/g, '<br>');

    // Specifications Grid
    let specsHTML = '';
    const lang = getCurrentLang();
    const localizedSpecs = (p.specs && typeof p.specs === 'object' && (p.specs.ar || p.specs.fr || p.specs.en))
        ? (p.specs[lang] || p.specs.ar || p.specs.fr || p.specs.en || {})
        : (p.specs || {});

    if (localizedSpecs && typeof localizedSpecs === 'object') {
        specsHTML = Object.entries(localizedSpecs).map(([key, val]) => `
            <div class="spec-box">
                <span class="spec-title">${escapeHTML(key)}</span>
                <span class="spec-value">${escapeHTML(val)}</span>
            </div>
        `).join('');
    }

    // Gallery Thumbs
    const galleryImages = (Array.isArray(p.gallery) && p.gallery.length > 0)
        ? p.gallery.map(img => sanitizeURL(img, imageSrc))
        : [imageSrc];

    const thumbsHTML = galleryImages.map((img, idx) => `
        <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-full-img="${encodeURI(img)}">
            <img src="${img}" alt="${name} - View ${idx + 1}" onerror="this.src='assets/product-image.png'">
        </div>
    `).join('');

    const dynamicSettings = StorageService.getSettings();
    const waNum = dynamicSettings?.whatsappNumber || '213676184805';
    const whatsappMessage = encodeURIComponent(`Hello! I want to order "${rawName}" (${formatPrice(p.price)}) directly.`);
    const whatsappLink = `https://wa.me/${waNum}?text=${whatsappMessage}`;

    viewContainer.innerHTML = `
        <div class="product-gallery">
            <div class="main-image-wrap">
                <img src="${imageSrc}" alt="${name}" id="main-view-img" onerror="this.src='assets/product-image.png'">
            </div>
            <div class="gallery-thumbs">
                ${thumbsHTML}
            </div>
        </div>

        <div class="product-info-full">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
                <span class="product-category">${category}</span>
                <span style="background:#ecfdf5;color:#10b981;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">${escapeHTML(t('in_stock'))}</span>
            </div>

            <h1>${name}</h1>
            <span class="price">${formattedPrice}</span>

            <p class="product-description">${safeDesc}</p>

            <!-- Purchase Controls -->
            <div class="purchase-row">
                <div class="qty-picker">
                    <button type="button" id="qty-decrease">-</button>
                    <span id="qty-value">1</span>
                    <button type="button" id="qty-increase">+</button>
                </div>

                <button class="btn-black-pill add-to-cart-btn"
                    id="view-add-to-cart"
                    style="padding:14px 28px;font-size:1rem;"
                    data-id="${escapeHTML(p.id)}"
                    data-name="${name}"
                    data-price="${p.price}"
                    data-image="${imageSrc}">
                    🛒 ${escapeHTML(t('add_to_cart'))}
                </button>
            </div>

            <div style="display:flex;gap:12px;margin-bottom:20px;">
                <a href="${whatsappLink}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="btn-secondary-pill"
                   style="flex:1;text-align:center;">
                   ${escapeHTML(t('order_whatsapp_direct'))}
                </a>
            </div>

            <!-- Point-of-Decision Trust Strip -->
            <div class="product-trust-strip">
                <div class="trust-pill">
                    <span class="trust-pill-icon">🛡️</span>
                    <span>${escapeHTML(t('trust_warranty_title') || 'ضمان رسمي معتمد 12 شهراً')}</span>
                </div>
                <div class="trust-pill">
                    <span class="trust-pill-icon">📦</span>
                    <span>${escapeHTML(t('trust_inspect_title') || 'معاينة الطرد قبل الدفع')}</span>
                </div>
                <div class="trust-pill">
                    <span class="trust-pill-icon">🚚</span>
                    <span>${escapeHTML(t('trust_shipping_title') || 'توصيل سريع لـ 69 ولاية')}</span>
                </div>
                <div class="trust-pill">
                    <span class="trust-pill-icon">💵</span>
                    <span>${escapeHTML(t('trust_cod_title') || 'دفع عند الاستلام 100%')}</span>
                </div>
            </div>

            <div class="specifications">
                <h2>${escapeHTML(t('product_specs'))}</h2>
                <div class="spec-grid">
                    ${specsHTML}
                </div>
            </div>
        </div>
    `;

    // Interactive thumbnail switcher
    viewContainer.querySelectorAll('.thumb-item').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const fullImg = thumb.getAttribute('data-full-img');
            const mainImg = document.getElementById('main-view-img');
            if (mainImg && fullImg) mainImg.src = decodeURI(fullImg);
            viewContainer.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // Quantity Picker Logic
    let selectedQty = 1;
    const maxStock = (typeof p.stock === 'number' && p.stock > 0) ? p.stock : 99;
    const qtyValEl = document.getElementById('qty-value');
    const decBtn   = document.getElementById('qty-decrease');
    const incBtn   = document.getElementById('qty-increase');
    const addBtn   = document.getElementById('view-add-to-cart');

    if (decBtn && incBtn && qtyValEl) {
        const refreshQty = () => {
            qtyValEl.textContent = selectedQty;
            decBtn.disabled = selectedQty <= 1;
            decBtn.setAttribute('aria-disabled', String(selectedQty <= 1));
            // Keep + clickable at max so the stock-limit toast can still inform the user
            incBtn.setAttribute('aria-disabled', String(selectedQty >= maxStock));
            incBtn.style.opacity = selectedQty >= maxStock ? '0.45' : '';
        };
        decBtn.onclick = () => {
            if (selectedQty > 1) {
                selectedQty--;
                refreshQty();
            }
        };
        incBtn.onclick = () => {
            if (selectedQty < maxStock) {
                selectedQty++;
                refreshQty();
            } else {
                showToast(t('toast_stock_limit'), t('toast_stock_limit_msg').replace('{max}', maxStock), '', '⚠️');
            }
        };
        refreshQty();
    }

    if (addBtn) {
        addBtn.onclick = (e) => {
            e.preventDefault();
            const originalHtml = addBtn.innerHTML;
            addBtn.innerHTML = '✓ ' + escapeHTML(t('toast_added') || 'Added!');
            addBtn.style.transform = 'scale(0.96)';
            setTimeout(() => {
                addBtn.innerHTML = originalHtml;
                addBtn.style.transform = '';
            }, 800);

            const localizedName = localize(p.name);
            CartService.addItem({
                id: p.id,
                name: localizedName,
                price: p.price,
                image: imageSrc
            }, selectedQty);

            toggleCart(true);
            showToast(t('toast_added'), `${selectedQty}x ${localizedName}`, imageSrc);
        };
    }
}

// =============================================================================
// 5. CART DRAWER & UI UPDATES
// =============================================================================

const cartOverlay        = document.getElementById('cart-overlay');
const cartSidebar        = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalElement   = document.getElementById('cart-total');
const cartBadgeElements  = document.querySelectorAll('.cart-badge');

export function toggleCart(show) {
    if (!cartSidebar || !cartOverlay) return;
    if (show) {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const closeBtn = cartSidebar.querySelector('#close-cart');
        if (closeBtn) closeBtn.focus();
    } else {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

export function updateCartUI(cartItems = CartService.getItems()) {
    const totalCount = CartService.getTotalCount();
    const subtotal   = CartService.getSubtotal();

    // Badges with Silk spring bounce
    cartBadgeElements.forEach(badge => {
        const prevCount = parseInt(badge.textContent, 10) || 0;
        badge.textContent = totalCount;
        badge.style.display = totalCount > 0 ? 'inline-flex' : 'none';

        if (totalCount > 0 && totalCount !== prevCount) {
            badge.classList.remove('badge-bump');
            void badge.offsetWidth; // Force reflow to restart CSS animation
            badge.classList.add('badge-bump');
        }
    });

    // Total Display
    if (cartTotalElement) {
        cartTotalElement.textContent = formatPrice(subtotal);
    }

    if (!cartSidebar || !cartItemsContainer) return;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center;padding:60px 10px;color:var(--color-black-60);">
                <div style="font-size:3.5rem;margin-bottom:14px;">🛍️</div>
                <h3 style="margin-bottom:6px;color:var(--color-black);">${escapeHTML(t('cart_empty'))}</h3>
                <p style="font-size:0.9rem;margin-bottom:20px;">${escapeHTML(t('cart_empty_sub'))}</p>
                <a href="products.html" class="btn-black-pill" style="padding:10px 22px;font-size:0.9rem;">${escapeHTML(t('cart_start_shopping'))}</a>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cartItems.map((item, index) => {
            const name = escapeHTML(item.name);
            const image = sanitizeURL(item.image, 'assets/product-image.png');
            const price = escapeHTML(formatPrice(item.price));

            return `
            <div class="cart-item">
                <img src="${image}" alt="${name}" onerror="this.src='assets/product-image.png'">
                <div class="cart-item-details">
                    <h4>${name}</h4>
                    <div class="cart-item-price">${price}</div>
                    <div class="cart-qty-ctrl">
                        <button class="qty-btn" data-action="decrease" data-index="${index}">-</button>
                        <span class="qty-count">${item.quantity}</span>
                        <button class="qty-btn" data-action="increase" data-index="${index}">+</button>
                        <button type="button" class="remove-item" data-index="${index}">${escapeHTML(t('cart_remove'))}</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // Free shipping target progress bar with smooth transition & pulse
    let freeShippingBar = document.querySelector('.free-shipping-bar');
    if (!freeShippingBar && cartSidebar) {
        freeShippingBar = document.createElement('div');
        freeShippingBar.className = 'free-shipping-bar';
        const header = cartSidebar.querySelector('.cart-header');
        if (header) header.after(freeShippingBar);
    }

    if (freeShippingBar) {
        const { isUnlocked, remaining, percentage } = getFreeShippingStatus(subtotal);

        // Pulse only when crossing the free-shipping threshold (not on every update)
        const prevState = freeShippingBar.dataset.unlocked;
        const nextState = isUnlocked ? '1' : '0';
        if (prevState !== undefined && prevState !== nextState) {
            freeShippingBar.classList.remove('bar-pulse');
            void freeShippingBar.offsetWidth;
            freeShippingBar.classList.add('bar-pulse');
        }
        freeShippingBar.dataset.unlocked = nextState;
        freeShippingBar.setAttribute('role', 'status');
        freeShippingBar.setAttribute('aria-live', 'polite');

        let targetTextEl = freeShippingBar.querySelector('.shipping-target-text');
        let progressFillEl = freeShippingBar.querySelector('.shipping-progress-fill');

        if (!targetTextEl || !progressFillEl) {
            freeShippingBar.innerHTML = `
                <div class="shipping-target-text"></div>
                <div class="shipping-progress-bg">
                    <div class="shipping-progress-fill" style="width: 0%;"></div>
                </div>
            `;
            targetTextEl = freeShippingBar.querySelector('.shipping-target-text');
            progressFillEl = freeShippingBar.querySelector('.shipping-progress-fill');
        }

        if (isUnlocked) {
            targetTextEl.innerHTML = `
                <span style="display:inline-flex;align-items:center;gap:6px;">✨ ${escapeHTML(t('free_shipping_unlocked'))}</span>
                <span style="font-weight:700;color:#10b981;">100%</span>
            `;
            progressFillEl.style.width = '100%';
            progressFillEl.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
        } else {
            const formattedDiff = escapeHTML(formatPrice(remaining));
            const addText = escapeHTML(t('free_shipping_add')).replace('{amount}', `<strong>${formattedDiff}</strong>`);
            targetTextEl.innerHTML = `
                <span>${addText}</span>
                <span style="font-weight:700;color:var(--text-secondary);">${percentage}%</span>
            `;
            progressFillEl.style.width = `${percentage}%`;
            progressFillEl.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
        }
    }

    // Event listeners for quantity & removal (defensively bind directly to button)
    cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const action = btn.getAttribute('data-action');
            if (action === 'increase') {
                CartService.increaseQuantity(idx);
            } else if (action === 'decrease') {
                CartService.decreaseQuantity(idx);
            }
        };
    });

    cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            CartService.removeItem(idx);
        };
    });

    if (typeof window.updateCheckoutUI === 'function') {
        window.updateCheckoutUI();
    }
}

// Connect CartService to UI updates via Observer
CartService.subscribe(updateCartUI);

// =============================================================================
// 6. CHECKOUT PAGE CONTROLLER (checkout.html)
// =============================================================================

const checkoutForm         = document.getElementById('checkout-form');
const shippingRadios       = document.querySelectorAll('input[name="shipping"]');
const shippingCostElement  = document.getElementById('shipping-cost');
const checkoutTotalElement = document.getElementById('total-cost');
const checkoutSubtotalEl   = document.getElementById('checkout-subtotal');
const confirmBtn           = document.getElementById('confirmBtn');
const stateSelect          = document.getElementById('state');

let selectedDeliveryType = 'office';
const deskBadgeEl = document.getElementById('desk-price-badge');
const homeBadgeEl = document.getElementById('home-price-badge');

export function updateCheckoutUI() {
    if (!checkoutTotalElement) return;

    const subtotal = CartService.getSubtotal();
    const cartItems = CartService.getItems();

    const wilayaVal = stateSelect ? stateSelect.value : '16';
    const deskCost = calculateShippingCost(wilayaVal || '16', 'office');
    const homeCost = calculateShippingCost(wilayaVal || '16', 'home');
    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;

    // Badges on delivery cards
    if (deskBadgeEl) {
        deskBadgeEl.textContent = isFree ? (t('free_badge') || 'FREE') : formatPrice(deskCost);
    }
    if (homeBadgeEl) {
        homeBadgeEl.textContent = isFree ? (t('free_badge') || 'FREE') : formatPrice(homeCost);
    }

    // Toggle active state classes on delivery choice cards
    const officeLabel = document.getElementById('label-ship-office');
    const homeLabel   = document.getElementById('label-ship-home');
    if (officeLabel) officeLabel.classList.toggle('active', selectedDeliveryType === 'office');
    if (homeLabel)   homeLabel.classList.toggle('active', selectedDeliveryType === 'home');

    // Update dynamic delivery estimate badge
    const wilayaEstimateEl = document.getElementById('wilaya-delivery-estimate');
    if (wilayaEstimateEl) {
        const zone = getWilayaZone(wilayaVal || '16');
        const estimateMsg = zone === 4 ? t('delivery_estimate_south') : t('delivery_estimate_fast');
        wilayaEstimateEl.innerHTML = `<span>${estimateMsg}</span>`;
    }

    let currentShipping = (selectedDeliveryType === 'home') ? homeCost : deskCost;
    if (isFree) {
        currentShipping = 0;
    }

    const total = subtotal + currentShipping;

    if (shippingCostElement) {
        shippingCostElement.textContent = currentShipping === 0 ? (t('free_badge') || 'FREE') : formatPrice(currentShipping);
    }
    if (checkoutSubtotalEl) {
        checkoutSubtotalEl.textContent = formatPrice(subtotal);
    }
    checkoutTotalElement.textContent = formatPrice(total);

    // Mini items preview in checkout
    let previewBox = document.querySelector('.checkout-items-preview');
    const summarySec = document.querySelector('.summary-section');
    if (!previewBox && summarySec) {
        previewBox = document.createElement('div');
        previewBox.className = 'checkout-items-preview';
        const shippingMethods = summarySec.querySelector('.shipping-methods');
        if (shippingMethods) shippingMethods.before(previewBox);
    }

    if (previewBox) {
        if (cartItems.length === 0) {
            previewBox.innerHTML = `<p style="color:var(--color-black-60);font-size:0.88rem;">${escapeHTML(t('cart_empty'))}</p>`;
        } else {
            previewBox.innerHTML = cartItems.map(item => `
                <div class="checkout-mini-item">
                    <img src="${sanitizeURL(item.image, 'assets/product-image.png')}" alt="${escapeHTML(item.name)}" onerror="this.src='assets/product-image.png'">
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.85rem;line-height:1.2;">${escapeHTML(item.name)}</div>
                        <div style="color:var(--color-black-60);font-size:0.8rem;">${escapeHTML(t('checkout_qty'))}: ${item.quantity} × ${escapeHTML(formatPrice(item.price))}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    const arrowHTML = '<span class="arrow-circle">←</span>';
    if (cartItems.length === 0 && confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.innerHTML = `<span>${escapeHTML(t('cart_empty'))}</span>`;
    } else if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.innerHTML = `<span>${escapeHTML(t('confirm_whatsapp'))}</span>${arrowHTML}`;
    }
}

window.updateCheckoutUI = updateCheckoutUI;

function initCheckout() {
    if (!checkoutForm) return;

    const nameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const nameStatus = document.getElementById('name-status');
    const phoneStatus = document.getElementById('phone-status');
    const groupName = document.getElementById('group-fullName');
    const groupPhone = document.getElementById('group-phone');
    const groupState = document.getElementById('group-state');
    const groupAddress = document.getElementById('group-address');

    updateCheckoutUI();

    // 1. Wilaya Selection Change Listener
    if (stateSelect) {
        stateSelect.addEventListener('change', () => {
            groupState?.classList.remove('has-error');
            updateCheckoutUI();
        });
    }

    // 2. Touch Delivery Cards Event Listeners
    document.querySelectorAll('.delivery-card input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedDeliveryType = e.target.value === 'home' ? 'home' : 'office';
            updateCheckoutUI();
        });
    });

    // 3. Real-Time Phone Validation Helper
    function validatePhone(showError = false) {
        const raw = phoneInput ? phoneInput.value.trim() : '';
        let clean = raw.replace(/[\s\-\(\)\.]/g, '');
        if (clean.startsWith('+213')) clean = '0' + clean.slice(4);
        else if (clean.startsWith('213')) clean = '0' + clean.slice(3);
        else if (clean.startsWith('00213')) clean = '0' + clean.slice(5);

        const isValid = /^(0)(5|6|7)[0-9]{8}$/.test(clean);

        if (isValid) {
            groupPhone?.classList.remove('has-error');
            groupPhone?.classList.add('is-valid');
            if (phoneStatus) {
                phoneStatus.textContent = t('phone_valid');
                phoneStatus.classList.add('valid');
            }
            return { isValid: true, cleanPhone: clean };
        } else {
            groupPhone?.classList.remove('is-valid');
            if (phoneStatus) {
                phoneStatus.textContent = '';
                phoneStatus.classList.remove('valid');
            }
            if (showError && raw.length > 0) {
                groupPhone?.classList.add('has-error');
            }
            return { isValid: false, cleanPhone: clean };
        }
    }

    // 4. Real-Time Name Validation Helper
    function validateName(showError = false) {
        const name = nameInput ? nameInput.value.trim() : '';
        const isValid = name.length >= 3;

        if (isValid) {
            groupName?.classList.remove('has-error');
            groupName?.classList.add('is-valid');
            if (nameStatus) {
                nameStatus.textContent = t('name_valid');
                nameStatus.classList.add('valid');
            }
            return true;
        } else {
            groupName?.classList.remove('is-valid');
            if (nameStatus) {
                nameStatus.textContent = '';
                nameStatus.classList.remove('valid');
            }
            if (showError && name.length > 0) {
                groupName?.classList.add('has-error');
            }
            return false;
        }
    }

    // Attach Live Validation Listeners
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            validatePhone(false);
        });
        phoneInput.addEventListener('blur', () => {
            validatePhone(true);
        });
    }

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            validateName(false);
        });
        nameInput.addEventListener('blur', () => {
            validateName(true);
        });
    }

    if (addressInput) {
        addressInput.addEventListener('input', () => {
            if (addressInput.value.trim().length >= 5) {
                groupAddress?.classList.remove('has-error');
            }
        });
        addressInput.addEventListener('blur', () => {
            if (addressInput.value.trim().length < 5 && addressInput.value.trim().length > 0) {
                groupAddress?.classList.add('has-error');
            }
        });
    }

    // 5. Checkout Form Submit Handler
    checkoutForm.onsubmit = (e) => {
        e.preventDefault();
        const cartItems = CartService.getItems();

        if (cartItems.length === 0) {
            showToast(t('toast_cart_empty'), t('cart_empty_sub'), '', '⚠️');
            return;
        }

        const isNameValid = validateName(true);
        const phoneResult = validatePhone(true);
        const address = addressInput ? addressInput.value.trim() : '';
        const stateVal = stateSelect ? stateSelect.value : '';

        let isValid = true;

        if (!isNameValid) {
            groupName?.classList.add('has-error');
            isValid = false;
        }

        if (!phoneResult.isValid) {
            groupPhone?.classList.add('has-error');
            isValid = false;
        }

        if (!stateVal) {
            groupState?.classList.add('has-error');
            isValid = false;
        }

        if (!address || address.length < 5) {
            groupAddress?.classList.add('has-error');
            isValid = false;
        }

        if (!isValid) {
            const firstErr = document.querySelector('.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea');
            if (firstErr) {
                firstErr.focus();
                firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            showToast(t('toast_validation_error'), t('err_form_general'), '', '⚠️');
            return;
        }

        confirmBtn.innerHTML = escapeHTML(t('order_processing') || 'Processing Order...');
        confirmBtn.style.opacity = '0.85';
        confirmBtn.style.pointerEvents = 'none';

        const fullName = nameInput.value.trim();
        const cleanPhone = phoneResult.cleanPhone;
        const stateText = stateSelect.options[stateSelect.selectedIndex].text;
        const deliveryTxt = selectedDeliveryType === 'home' ? t('home_delivery_title') : t('office_pickup_title');
        const totalPrice = checkoutTotalElement.textContent;

        const newOrder = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            customerName: fullName,
            phone: cleanPhone,
            wilaya: stateText,
            address: address,
            deliveryMethod: deliveryTxt,
            items: [...cartItems],
            total: totalPrice,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        StorageService.saveOrder(newOrder);

        let orderItemsStr = '';
        cartItems.forEach(item => {
            orderItemsStr += `▪ ${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}\n`;
        });

        const activeLang = getCurrentLang();
        let message = '';
        if (activeLang === 'ar') {
            message = `*تأكيد طلبية جديدة #${newOrder.id}* 📦
-----------------------------------
👤 *الاسم واللقب:* ${fullName}
📞 *رقم الهاتف:* ${cleanPhone}
📍 *الولاية:* ${stateText}
🏠 *العنوان:* ${address}
🚚 *نوع التوصيل:* ${deliveryTxt}
-----------------------------------
🛍️ *المنتجات المطلوبة:*
${orderItemsStr}
💰 *المبلغ الإجمالي:* ${totalPrice}
-----------------------------------
يرجى تأكيد إرسال الطلبية مع خدمة التوصيل. شكراً لكم!`;
        } else if (activeLang === 'fr') {
            message = `*Confirmation de Commande #${newOrder.id}* 📦
-----------------------------------
👤 *Nom & Prénom :* ${fullName}
📞 *Numéro de Téléphone :* ${cleanPhone}
📍 *Wilaya :* ${stateText}
🏠 *Adresse Complète :* ${address}
🚚 *Mode de Livraison :* ${deliveryTxt}
-----------------------------------
🛍️ *Articles :*
${orderItemsStr}
💰 *Total Commande :* ${totalPrice}
-----------------------------------
Merci de bien vouloir confirmer l'expédition de cette commande.`;
        } else {
            message = `*Order Confirmation #${newOrder.id}* 📦
-----------------------------------
👤 *Name:* ${fullName}
📞 *Phone:* ${cleanPhone}
📍 *Wilaya:* ${stateText}
🏠 *Address:* ${address}
🚚 *Delivery:* ${deliveryTxt}
-----------------------------------
🛍️ *Items:*
${orderItemsStr}
💰 *Total:* ${totalPrice}
-----------------------------------
Please confirm this order for dispatch. Thank you!`;
        }

        const dynamicSettings = StorageService.getSettings();
        const storeWhatsappNumber = dynamicSettings?.whatsappNumber || '213676184805';
        const whatsappUrl = `https://wa.me/${storeWhatsappNumber}?text=${encodeURIComponent(message)}`;

        confirmBtn.innerHTML = escapeHTML(t('order_redirecting') || '✓ Redirecting to WhatsApp...');

        CartService.clearCart();
        updateCheckoutUI();

        setTimeout(() => {
            const newWin = window.open(whatsappUrl, '_blank');
            if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                window.location.href = whatsappUrl;
            } else {
                setTimeout(() => { location.href = 'index.html'; }, 2000);
            }
        }, 600);
    };
}

// =============================================================================
// 7. INITIALIZATION & GLOBAL LISTENERS
// =============================================================================

async function onLanguageChanged() {
    const products = await ProductsService.getAll();
    const count = products ? products.length : 0;

    // Update dynamic view_all counter
    document.querySelectorAll('[data-i18n="view_all"]').forEach(el => {
        const rawText = t('view_all') || 'View All Products ({count})';
        const dynamicText = /\d+/.test(rawText)
            ? rawText.replace(/\d+/, count)
            : `${rawText} (${count})`;
        el.innerHTML = dynamicText;
    });

    // Update catalogCounterBadge
    const catalogBadge = document.getElementById('catalogCounterBadge');
    if (catalogBadge) {
        const template = t('catalog_counter') || '{count} items available';
        catalogBadge.textContent = template.replace('{count}', count);
    }

    await renderFeaturedProducts();
    await renderShopProducts();
    await renderProductView();
    updateCartUI();
    updateCheckoutUI();
    applyDynamicSiteSettings();
}

export function applyDynamicSiteSettings() {
    const settings = StorageService.getSettings();
    if (!settings || typeof settings !== 'object') return;

    // Top Bar
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        if (settings.topBarEnabled === false) {
            topBar.style.display = 'none';
        } else {
            topBar.style.display = '';
            if (settings.topBarBadge) {
                const badge = topBar.querySelector('.top-bar-badge');
                if (badge) badge.textContent = settings.topBarBadge;
            }
            if (settings.topBarText) {
                const textSpan = topBar.querySelector('span:not(.top-bar-badge)');
                if (textSpan) textSpan.textContent = settings.topBarText;
            }
        }
    }

    // Brand
    if (settings.brandName) {
        document.querySelectorAll('.logo-name').forEach(el => el.textContent = settings.brandName);
    }
    if (settings.tagline) {
        document.querySelectorAll('.logo-subtext').forEach(el => el.textContent = settings.tagline);
    }

    // WhatsApp Links across pages
    if (settings.whatsappNumber) {
        const cleanWA = String(settings.whatsappNumber).replace(/\D/g, '');
        document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
            const oldHref = link.getAttribute('href');
            if (oldHref) {
                link.href = oldHref.replace(/wa\.me\/\d+/, `wa.me/${cleanWA}`);
            }
        });
    }

    if (settings.heroProductImg) {
        const heroImg = document.getElementById('heroProductImg');
        if (heroImg) heroImg.src = sanitizeURL(settings.heroProductImg, 'assets/product-image.png');
    }
    if (settings.heroLiveBadge) {
        const liveBadge = document.querySelector('.hero-live-badge span:last-child');
        if (liveBadge) liveBadge.textContent = settings.heroLiveBadge;
    }
    if (settings.heroTicker) {
        const ticker = document.querySelector('.hero-ticker');
        if (ticker) ticker.textContent = settings.heroTicker;
    }

    // 1. Marquee Ticker Toggle
    const marquee = document.querySelector('.marquee-container');
    if (marquee) {
        if (settings.marqueeEnabled === false) {
            marquee.style.display = 'none';
        } else {
            marquee.style.display = 'block';
        }
    }

    // 2. Floating WhatsApp Quick Action Button
    let waFloatBtn = document.getElementById('zirox-wa-float-btn');
    const isWaEnabled = (settings.whatsappFloatEnabled !== false);

    if (isWaEnabled) {
        const rawNum = settings.whatsappNumber || '213676184805';
        const cleanWA = String(rawNum).replace(/\D/g, '');
        const defaultMsg = encodeURIComponent('مرحباً Zirox Store! أرغب في الاستفسار عن المنتجات والطلبات.');
        const waLink = `https://wa.me/${cleanWA}?text=${defaultMsg}`;

        if (!waFloatBtn) {
            waFloatBtn = document.createElement('a');
            waFloatBtn.id = 'zirox-wa-float-btn';
            waFloatBtn.className = 'zirox-wa-float-btn';
            waFloatBtn.target = '_blank';
            waFloatBtn.rel = 'noopener noreferrer';
            waFloatBtn.setAttribute('aria-label', 'Contact us on WhatsApp');
            waFloatBtn.innerHTML = `
                <div class="wa-float-pulse"></div>
                <div class="wa-float-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.905-.424-1.543-.639-2.518-2.222-2.595-2.324-.076-.102-.622-.829-.622-1.583 0-.754.394-1.127.533-1.282.14-.156.305-.195.407-.195.101 0 .203.001.292.006.093.004.218-.035.34.258.128.307.438 1.068.476 1.145.039.077.064.168.013.27-.051.102-.077.167-.153.257-.076.09-.16.2-.23.268-.078.077-.16.16-.068.318.092.158.408.673.876 1.09.602.535 1.11.701 1.268.78.158.078.25.067.344-.041.094-.108.403-.47.511-.631.108-.161.216-.134.364-.08.148.054.939.443 1.101.524.162.081.27.121.31.19.04.068.04.397-.104.802zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.442 5.176L2 22l4.965-1.303C8.423 21.543 10.154 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    </svg>
                </div>
                <div class="wa-float-label">
                    <span>واتساب مباشر</span>
                </div>
            `;
            document.body.appendChild(waFloatBtn);
        }
        waFloatBtn.href = waLink;
        waFloatBtn.style.display = 'flex';
    } else {
        if (waFloatBtn) waFloatBtn.style.display = 'none';
    }

    // Maintenance Mode Banner
    if (settings.maintenanceMode) {
        let banner = document.getElementById('zirox-maint-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'zirox-maint-banner';
            banner.style.cssText = 'background:#dc2626;color:#ffffff;text-align:center;padding:10px 16px;font-size:0.88rem;font-weight:700;position:sticky;top:0;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
            banner.textContent = settings.maintenanceMessage || 'المتجر في وضع الصيانة المؤقتة.';
            document.body.prepend(banner);
        }
    }
}

async function bootStoreApp() {
    // 1. Seed Products if needed
    await ProductsService.seedInitialProducts();

    // 1.1 Apply Dynamic Admin Site Settings (if configured)
    applyDynamicSiteSettings();

    // 2. Theme Initialization
    const themeToggleBtn = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = StorageService.getTheme() || (prefersDarkScheme.matches ? 'dark' : 'light');

    const syncThemeA11y = () => {
        if (!themeToggleBtn) return;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        themeToggleBtn.setAttribute('aria-pressed', String(isDark));
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };

    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '☀️';
    }
    syncThemeA11y();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                themeToggleBtn.innerHTML = '🌙';
                StorageService.setTheme('light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                themeToggleBtn.innerHTML = '☀️';
                StorageService.setTheme('dark');
            }
            syncThemeA11y();
        });
    }

    // 3. Language Button Listeners
    document.addEventListener('click', (e) => {
        const langBtn = e.target.closest('.lang-btn');
        if (langBtn) {
            e.preventDefault();
            const lang = langBtn.getAttribute('data-lang');
            if (lang) {
                setLanguage(lang, onLanguageChanged);
            }
        }
    });

    // 4. Global Delegated Click Listeners (Cart & Add to Cart)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.open-cart-btn')) {
            e.preventDefault();
            toggleCart(true);
        }

        if (e.target.closest('#close-cart') || e.target.closest('#cart-overlay')) {
            toggleCart(false);
        }

        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn && addBtn.id !== 'view-add-to-cart') {
            e.preventDefault();
            const id    = addBtn.getAttribute('data-id');
            const name  = addBtn.getAttribute('data-name');
            const price = addBtn.getAttribute('data-price');
            const image = addBtn.getAttribute('data-image');

            if (name && price) {
                const originalHtml = addBtn.innerHTML;
                addBtn.innerHTML = '✓ ' + escapeHTML(t('toast_added') || 'Added!');
                addBtn.style.transform = 'scale(0.96)';
                setTimeout(() => {
                    addBtn.innerHTML = originalHtml;
                    addBtn.style.transform = '';
                }, 800);

                CartService.addItem({ id, name, price, image }, 1);
                toggleCart(true);
                showToast(t('toast_added'), name, image);
            }
        }
    });

    // 5. Mobile Navigation Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = mainNav.classList.toggle('mobile-open');
            mobileMenuToggle.setAttribute('aria-expanded', isOpen);
            mobileMenuToggle.innerHTML = isOpen ? '✕' : '☰';
        });

        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove('mobile-open');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.innerHTML = '☰';
            }
        });
    }

    // 6. View Initializations
    initCheckout();

    // 7. Initial Language Application (single clean render on boot)
    setLanguage(getCurrentLang(), onLanguageChanged);

    window.__zirox_loaded = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootStoreApp);
} else {
    bootStoreApp();
}
