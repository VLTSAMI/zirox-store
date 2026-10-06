/**
 * ZIROX STORE — ADMIN PRODUCTS CONTROLLER
 * Full CRUD, multilingual tabbed modal, bulk actions, and JSON import/export.
 */

import { ProductsService, INITIAL_SEED_PRODUCTS } from './products.js';
import { escapeHTML, sanitizeURL, isValidProduct, safePrice } from './security.js';
import { localize, formatPrice, getCurrentLang } from './i18n.js';

let currentFilter = {
    search: '',
    category: 'all',
    sort: 'newest'
};

let selectedProductIds = new Set();
let modalState = {
    isOpen: false,
    editingId: null,
    activeTab: 'basic',
    activeLangTab: 'ar',
    activeSpecsLang: 'ar',
    productData: null
};

/**
 * Render the complete Products management section
 * @param {HTMLElement} container 
 */
export async function renderProductsSection(container) {
    if (!container) return;

    const allProducts = await ProductsService.getAll();
    let filtered = [...allProducts];

    // 1. Search Filter
    if (currentFilter.search.trim()) {
        const q = currentFilter.search.trim().toLowerCase();
        filtered = filtered.filter(p => {
            const idMatch = (p.id || '').toLowerCase().includes(q);
            const arName = (p.name?.ar || '').toLowerCase().includes(q);
            const frName = (p.name?.fr || '').toLowerCase().includes(q);
            const enName = (p.name?.en || '').toLowerCase().includes(q);
            const strName = typeof p.name === 'string' ? p.name.toLowerCase().includes(q) : false;
            return idMatch || arName || frName || enName || strName;
        });
    }

    // 2. Category Filter
    if (currentFilter.category !== 'all') {
        filtered = filtered.filter(p => (p.categoryKey || '').toLowerCase() === currentFilter.category.toLowerCase());
    }

    // 3. Sorting
    filtered.sort((a, b) => {
        if (currentFilter.sort === 'price-low') return (a.price || 0) - (b.price || 0);
        if (currentFilter.sort === 'price-high') return (b.price || 0) - (a.price || 0);
        if (currentFilter.sort === 'stock') return (b.stock || 0) - (a.stock || 0);
        if (currentFilter.sort === 'name') {
            const nameA = localize(a.name) || '';
            const nameB = localize(b.name) || '';
            return nameA.localeCompare(nameB);
        }
        // Default newest
        const timeA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const timeB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return timeB - timeA;
    });

    const isAllSelected = filtered.length > 0 && filtered.every(p => selectedProductIds.has(p.id));

    container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">📦 إدارة المنتجات (${allProducts.length})</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">إضافة، تعديل، حذف، واستيراد وتصدير كتالوج المتجر</span>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn-pill" id="admin-add-product-btn" style="padding:10px 20px;font-size:0.85rem;">
                        + إضافة منتج جديد
                    </button>
                    <button class="btn-secondary-pill" id="admin-export-products-btn" style="padding:10px 18px;font-size:0.85rem;">
                        📥 تصدير (JSON)
                    </button>
                    <label class="btn-secondary-pill" style="padding:10px 18px;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;">
                        📤 استيراد (JSON)
                        <input type="file" id="admin-import-products-input" accept=".json" style="display:none;">
                    </label>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="admin-toolbar">
                <input type="text" class="admin-search-input" id="admin-prod-search" placeholder="🔍 بحث بالاسم (عربي / فرنسي / إنجليزي) أو المعرّف ID..." value="${escapeHTML(currentFilter.search)}">
                
                <select class="admin-select" id="admin-prod-category-filter">
                    <option value="all" ${currentFilter.category === 'all' ? 'selected' : ''}>كل الأقسام</option>
                    <option value="electronics" ${currentFilter.category === 'electronics' ? 'selected' : ''}>إلكترونيات (Electronics)</option>
                    <option value="fashion" ${currentFilter.category === 'fashion' ? 'selected' : ''}>أزياء وموضة (Fashion)</option>
                    <option value="home" ${currentFilter.category === 'home' ? 'selected' : ''}>منزل وديكور (Home)</option>
                    <option value="health" ${currentFilter.category === 'health' ? 'selected' : ''}>صحة وعناية (Health)</option>
                </select>

                <select class="admin-select" id="admin-prod-sort">
                    <option value="newest" ${currentFilter.sort === 'newest' ? 'selected' : ''}>الأحدث إضافة</option>
                    <option value="price-low" ${currentFilter.sort === 'price-low' ? 'selected' : ''}>السعر: من الأقل للأعلى</option>
                    <option value="price-high" ${currentFilter.sort === 'price-high' ? 'selected' : ''}>السعر: من الأعلى للأقل</option>
                    <option value="stock" ${currentFilter.sort === 'stock' ? 'selected' : ''}>الأكثر توفراً في المخزون</option>
                    <option value="name" ${currentFilter.sort === 'name' ? 'selected' : ''}>الترتيب الأبجدي</option>
                </select>
            </div>

            <!-- Products Table -->
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="width:40px;text-align:center;">
                                <input type="checkbox" id="admin-select-all-prods" ${isAllSelected ? 'checked' : ''}>
                            </th>
                            <th style="width:60px;">الصورة</th>
                            <th>الاسم (العربية)</th>
                            <th>القسم</th>
                            <th>السعر</th>
                            <th>المخزون</th>
                            <th>الشارة</th>
                            <th>الحالة</th>
                            <th style="text-align:center;">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `
                            <tr>
                                <td colspan="9" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
                                    لم يتم العثور على أي منتجات مطابقة لخيارات البحث.
                                </td>
                            </tr>
                        ` : filtered.map(p => {
                            const isSelected = selectedProductIds.has(p.id);
                            const nameAr = p.name?.ar || (typeof p.name === 'string' ? p.name : p.name?.en || 'بدون اسم');
                            const catKey = p.categoryKey || 'general';
                            const catName = p.category?.ar || (typeof p.category === 'string' ? p.category : catKey);
                            const priceFormatted = formatPrice(p.price || 0);
                            const oldPriceHTML = p.oldPrice ? `<div style="font-size:0.75rem;text-decoration:line-through;color:var(--text-muted);">${formatPrice(p.oldPrice)}</div>` : '';
                            const stock = typeof p.stock === 'number' ? p.stock : 0;
                            const badge = p.badge?.ar || (typeof p.badge === 'string' ? p.badge : '') || '-';
                            const imageSrc = sanitizeURL(p.image, 'assets/product-image.png');

                            // Status logic
                            let statusPill = '';
                            const now = new Date().getTime();
                            const added = p.addedAt ? new Date(p.addedAt).getTime() : 0;
                            const isNew = (now - added) < (7 * 24 * 60 * 60 * 1000);

                            if (stock === 0) {
                                statusPill = `<span class="status-pill out-of-stock">نفد المخزون</span>`;
                            } else if (stock <= 5) {
                                statusPill = `<span class="status-pill low-stock">مخزون منخفض (${stock})</span>`;
                            } else if (isNew) {
                                statusPill = `<span class="status-pill new">جديد ✨</span>`;
                            } else {
                                statusPill = `<span class="status-pill in-stock">متوفر (${stock})</span>`;
                            }

                            return `
                                <tr data-id="${escapeHTML(p.id)}">
                                    <td style="text-align:center;">
                                        <input type="checkbox" class="admin-prod-checkbox" data-id="${escapeHTML(p.id)}" ${isSelected ? 'checked' : ''}>
                                    </td>
                                    <td>
                                        <img src="${imageSrc}" class="admin-table-thumb" alt="${escapeHTML(nameAr)}" onerror="this.src='assets/product-image.png'">
                                    </td>
                                    <td>
                                        <div style="font-weight:700;color:var(--text-primary);">${escapeHTML(nameAr)}</div>
                                        <div style="font-size:0.72rem;color:var(--text-muted);font-family:monospace;">ID: ${escapeHTML(p.id)}</div>
                                    </td>
                                    <td>
                                        <span style="font-size:0.82rem;font-weight:600;">${escapeHTML(catName)}</span>
                                        <span style="display:block;font-size:0.7rem;color:var(--text-muted);">${escapeHTML(catKey)}</span>
                                    </td>
                                    <td>
                                        <div style="font-weight:700;">${escapeHTML(priceFormatted)}</div>
                                        ${oldPriceHTML}
                                    </td>
                                    <td>
                                        <strong style="color:${stock <= 5 ? '#dc2626' : 'inherit'};">${stock}</strong>
                                    </td>
                                    <td>
                                        <span style="font-size:0.75rem;background:var(--surface-container-low);padding:2px 8px;border-radius:12px;">${escapeHTML(badge)}</span>
                                    </td>
                                    <td>${statusPill}</td>
                                    <td>
                                        <div class="row-actions" style="justify-content:center;">
                                            <button class="admin-action-btn edit-prod-btn" data-id="${escapeHTML(p.id)}" title="تعديل المنتج">✏️</button>
                                            <button class="admin-action-btn dup-prod-btn" data-id="${escapeHTML(p.id)}" title="تكرار المنتج">📋</button>
                                            <button class="admin-action-btn delete delete-prod-btn" data-id="${escapeHTML(p.id)}" title="حذف المنتج">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Bulk Floating Bar -->
        <div class="bulk-bar ${selectedProductIds.size > 0 ? 'visible' : ''}" id="admin-bulk-bar">
            <span>تم تحديد <strong>${selectedProductIds.size}</strong> منتج</span>
            <button id="admin-bulk-dup-btn">نسخ المحدد</button>
            <button class="delete-btn" id="admin-bulk-delete-btn">حذف المحدد</button>
        </div>

        <!-- Product Modal Container -->
        <div id="product-modal-placeholder"></div>
    `;

    bindProductSectionEvents(container);
}

/**
 * Bind DOM events for the products section
 */
function bindProductSectionEvents(container) {
    // Search input
    const searchInput = container.querySelector('#admin-prod-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilter.search = e.target.value;
            renderProductsSection(container);
            // restore focus
            const newSearch = container.querySelector('#admin-prod-search');
            if (newSearch) {
                newSearch.focus();
                newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
            }
        });
    }

    // Category filter
    const catFilter = container.querySelector('#admin-prod-category-filter');
    if (catFilter) {
        catFilter.addEventListener('change', (e) => {
            currentFilter.category = e.target.value;
            renderProductsSection(container);
        });
    }

    // Sort filter
    const sortFilter = container.querySelector('#admin-prod-sort');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentFilter.sort = e.target.value;
            renderProductsSection(container);
        });
    }

    // Add Product button
    const addBtn = container.querySelector('#admin-add-product-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openProductModal(null, container));
    }

    // Export button
    const exportBtn = container.querySelector('#admin-export-products-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProductsJSON);
    }

    // Import input
    const importInput = container.querySelector('#admin-import-products-input');
    if (importInput) {
        importInput.addEventListener('change', (e) => importProductsJSON(e, container));
    }

    // Checkbox select all
    const selectAllCheckbox = container.querySelector('#admin-select-all-prods');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', async (e) => {
            const allProducts = await ProductsService.getAll();
            if (e.target.checked) {
                allProducts.forEach(p => selectedProductIds.add(p.id));
            } else {
                selectedProductIds.clear();
            }
            await renderProductsSection(container);
        });
    }

    // Row Checkboxes
    container.querySelectorAll('.admin-prod-checkbox').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const id = cb.getAttribute('data-id');
            if (e.target.checked) selectedProductIds.add(id);
            else selectedProductIds.delete(id);
            await renderProductsSection(container);
        });
    });

    // Row Actions: Edit
    container.querySelectorAll('.edit-prod-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            await openProductModal(id, container);
        });
    });

    // Row Actions: Duplicate
    container.querySelectorAll('.dup-prod-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            await duplicateProduct(id, container);
        });
    });

    // Row Actions: Delete
    container.querySelectorAll('.delete-prod-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm(`هل أنت متأكد من رغبتك في حذف هذا المنتج (${id}) نهائياً؟`)) {
                await deleteProduct(id, container);
            }
        });
    });

    // Bulk Delete
    const bulkDeleteBtn = container.querySelector('#admin-bulk-delete-btn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', async () => {
            if (confirm(`هل أنت متأكد من حذف ${selectedProductIds.size} منتج محدد نهائياً؟`)) {
                const all = (await ProductsService.getAll()).filter(p => !selectedProductIds.has(p.id));
                await ProductsService.saveAll(all);
                selectedProductIds.clear();
                window.adminToast?.('تم حذف المنتجات المحددة بنجاح', 'success');
                await renderProductsSection(container);
            }
        });
    }

    // Bulk Duplicate
    const bulkDupBtn = container.querySelector('#admin-bulk-dup-btn');
    if (bulkDupBtn) {
        bulkDupBtn.addEventListener('click', async () => {
            const all = await ProductsService.getAll();
            const toDup = all.filter(p => selectedProductIds.has(p.id));
            toDup.forEach(original => {
                const copy = JSON.parse(JSON.stringify(original));
                copy.id = 'prod_' + Math.floor(100000 + Math.random() * 900000);
                if (typeof copy.name === 'object') {
                    if (copy.name.ar) copy.name.ar += ' (نسخة)';
                    if (copy.name.fr) copy.name.fr += ' (copie)';
                    if (copy.name.en) copy.name.en += ' (copy)';
                } else {
                    copy.name = String(copy.name) + ' (copy)';
                }
                copy.addedAt = new Date().toISOString();
                all.unshift(copy);
            });
            await ProductsService.saveAll(all);
            selectedProductIds.clear();
            window.adminToast?.('تم استنساخ المنتجات بنجاح', 'success');
            await renderProductsSection(container);
        });
    }
}

/**
 * Open Product Create / Edit Modal
 */
export async function openProductModal(productId = null, container = null) {
    const isEditing = !!productId;
    let product = null;

    if (isEditing) {
        const found = await ProductsService.getById(productId);
        if (found) {
            product = JSON.parse(JSON.stringify(found));
        }
    }

    if (!product) {
        product = {
            id: 'prod_' + Math.floor(100000 + Math.random() * 900000),
            categoryKey: 'electronics',
            name: { ar: '', fr: '', en: '' },
            category: { ar: 'إلكترونيات', fr: 'Électronique', en: 'Electronics' },
            badge: { ar: '', fr: '', en: '' },
            price: 5000,
            oldPrice: null,
            rating: 5.0,
            reviewsCount: 10,
            stock: 15,
            image: 'assets/product-image.png',
            gallery: [],
            shortDesc: { ar: '', fr: '', en: '' },
            description: { ar: '', fr: '', en: '' },
            specs: {
                ar: { 'الضمان': '12 شهراً رسمي' },
                fr: { 'Garantie': '12 mois officiel' },
                en: { 'Warranty': '12 months official' }
            },
            addedAt: new Date().toISOString()
        };
    }

    // Normalize multilingual fields if existing was string
    if (typeof product.name === 'string') product.name = { ar: product.name, fr: product.name, en: product.name };
    if (typeof product.category === 'string') product.category = { ar: product.category, fr: product.category, en: product.category };
    if (typeof product.badge === 'string') product.badge = { ar: product.badge, fr: product.badge, en: product.badge };
    if (typeof product.shortDesc === 'string') product.shortDesc = { ar: product.shortDesc, fr: product.shortDesc, en: product.shortDesc };
    if (typeof product.description === 'string') product.description = { ar: product.description, fr: product.description, en: product.description };
    if (!product.specs || typeof product.specs !== 'object') product.specs = { ar: {}, fr: {}, en: {} };
    if (!product.specs.ar) product.specs.ar = {};
    if (!product.specs.fr) product.specs.fr = {};
    if (!product.specs.en) product.specs.en = {};

    modalState = {
        isOpen: true,
        editingId: productId,
        activeTab: 'basic',
        activeLangTab: 'ar',
        activeSpecsLang: 'ar',
        productData: product
    };

    renderModalDOM(container);
}

/**
 * Render the modal HTML and manage internal tab state
 */
function renderModalDOM(container) {
    let modalWrapper = document.getElementById('admin-product-modal-root');
    if (!modalWrapper) {
        modalWrapper = document.createElement('div');
        modalWrapper.id = 'admin-product-modal-root';
        document.body.appendChild(modalWrapper);
    }

    const p = modalState.productData;
    const isEdit = !!modalState.editingId;

    modalWrapper.innerHTML = `
        <div class="admin-modal-overlay open">
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <h3>${isEdit ? `✏️ تعديل المنتج (${escapeHTML(p.id)})` : '✨ إضافة منتج جديد'}</h3>
                    <button class="modal-close-btn" id="modal-close-x">✕</button>
                </div>

                <!-- Main Tabs -->
                <div class="admin-modal-tabs">
                    <button class="admin-tab-btn ${modalState.activeTab === 'basic' ? 'active' : ''}" data-tab="basic">⚙️ الأساسيات</button>
                    <button class="admin-tab-btn ${modalState.activeTab === 'multi' ? 'active' : ''}" data-tab="multi">🌐 النصوص واللغات</button>
                    <button class="admin-tab-btn ${modalState.activeTab === 'specs' ? 'active' : ''}" data-tab="specs">📋 المواصفات التقنية</button>
                    <button class="admin-tab-btn ${modalState.activeTab === 'gallery' ? 'active' : ''}" data-tab="gallery">🖼️ معرض الصور (${(p.gallery || []).length})</button>
                    <button class="admin-tab-btn ${modalState.activeTab === 'advanced' ? 'active' : ''}" data-tab="advanced">⚡ خيارات متقدمة</button>
                </div>

                <!-- Tab Contents -->
                <div class="admin-modal-body">
                    <!-- 1. Basic Tab -->
                    <div id="tab-pane-basic" style="display:${modalState.activeTab === 'basic' ? 'block' : 'none'};">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">معرّف المنتج (ID) *</label>
                                <input type="text" class="admin-input" id="inp-id" value="${escapeHTML(p.id)}" ${isEdit ? 'readonly style="background:var(--surface-container-low);"' : ''}>
                                <span class="error-inline" id="err-id"></span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">مفتاح القسم (Category Key) *</label>
                                <select class="admin-select" id="inp-catkey" style="border-radius:var(--radius-md);">
                                    <option value="electronics" ${p.categoryKey === 'electronics' ? 'selected' : ''}>إلكترونيات (electronics)</option>
                                    <option value="fashion" ${p.categoryKey === 'fashion' ? 'selected' : ''}>أزياء (fashion)</option>
                                    <option value="home" ${p.categoryKey === 'home' ? 'selected' : ''}>منزل وديكور (home)</option>
                                    <option value="health" ${p.categoryKey === 'health' ? 'selected' : ''}>صحة وعناية (health)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">السعر الحالي (دج) *</label>
                                <input type="number" class="admin-input" id="inp-price" min="0" max="10000000" value="${p.price}">
                                <span class="error-inline" id="err-price"></span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">السعر السابق قبل التخفيض (دج - اختياري)</label>
                                <input type="number" class="admin-input" id="inp-oldprice" min="0" max="10000000" value="${p.oldPrice || ''}" placeholder="اتركه فارغاً إن لم يكن هناك تخفيض">
                            </div>
                            <div class="form-group">
                                <label class="form-label">المخزون المتوفر *</label>
                                <input type="number" class="admin-input" id="inp-stock" min="0" max="999" value="${p.stock}">
                                <span class="error-inline" id="err-stock"></span>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">التقييم (0 - 5 نجوم)</label>
                                <input type="number" step="0.1" min="1" max="5" class="admin-input" id="inp-rating" value="${p.rating || 4.9}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">عدد التقييمات</label>
                                <input type="number" min="0" class="admin-input" id="inp-reviews" value="${p.reviewsCount || 24}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">نوع الشارة (Badge Class)</label>
                                <select class="admin-select" id="inp-badge-class" style="border-radius:var(--radius-md);">
                                    <option value="">بدون شارة خاصة</option>
                                    <option value="bestseller" ${String(p.badge?.en || '').toUpperCase().includes('BEST') ? 'selected' : ''}>الأكثر مبيعاً (Bestseller)</option>
                                    <option value="sale" ${String(p.badge?.en || '').toUpperCase().includes('SALE') ? 'selected' : ''}>تخفيض خاص (Sale)</option>
                                    <option value="new" ${String(p.badge?.en || '').toUpperCase().includes('NEW') ? 'selected' : ''}>جديد (New)</option>
                                    <option value="hot">رائج (Hot)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">رابط الصورة الرئيسية *</label>
                            <div style="display:flex;gap:12px;align-items:center;">
                                <input type="text" class="admin-input" id="inp-image" value="${escapeHTML(p.image)}" placeholder="assets/product-image.png أو رابط https://">
                                <img src="${sanitizeURL(p.image, 'assets/product-image.png')}" id="img-live-preview" style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid var(--border-light);" onerror="this.src='assets/product-image.png'">
                            </div>
                            <span class="error-inline" id="err-image"></span>
                        </div>
                    </div>

                    <!-- 2. Multilingual Tab -->
                    <div id="tab-pane-multi" style="display:${modalState.activeTab === 'multi' ? 'block' : 'none'};">
                        <div style="display:flex;gap:8px;margin-bottom:18px;border-bottom:1px solid var(--border-light);padding-bottom:10px;">
                            <button class="btn-pill sub-lang-btn ${modalState.activeLangTab === 'ar' ? '' : 'btn-secondary-pill'}" data-lang="ar" style="padding:6px 14px;font-size:0.8rem;">العربية (الأساسية) 🇩🇿</button>
                            <button class="btn-pill sub-lang-btn ${modalState.activeLangTab === 'fr' ? '' : 'btn-secondary-pill'}" data-lang="fr" style="padding:6px 14px;font-size:0.8rem;">Français 🇫🇷</button>
                            <button class="btn-pill sub-lang-btn ${modalState.activeLangTab === 'en' ? '' : 'btn-secondary-pill'}" data-lang="en" style="padding:6px 14px;font-size:0.8rem;">English 🇬🇧</button>
                        </div>

                        <!-- AR Sub -->
                        <div class="lang-sub-pane" style="display:${modalState.activeLangTab === 'ar' ? 'block' : 'none'};">
                            <div class="form-group">
                                <label class="form-label">اسم المنتج بالعربية *</label>
                                <input type="text" class="admin-input" id="inp-name-ar" value="${escapeHTML(p.name?.ar || '')}" placeholder="مثال: سماعات سوني WH-1000XM5 اللاسلكية">
                                <span class="error-inline" id="err-name-ar"></span>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">اسم القسم المعروض (عربي)</label>
                                    <input type="text" class="admin-input" id="inp-cat-ar" value="${escapeHTML(p.category?.ar || '')}" placeholder="مثال: إلكترونيات وصوتيات">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">نص الشارة (عربي)</label>
                                    <input type="text" class="admin-input" id="inp-badge-ar" value="${escapeHTML(p.badge?.ar || '')}" placeholder="مثال: الأكثر مبيعاً">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">وصف قصير للبطاقة (عربي)</label>
                                <input type="text" class="admin-input" id="inp-short-ar" value="${escapeHTML(p.shortDesc?.ar || '')}" placeholder="يظهر في بطاقة المنتج بالكتالوج">
                            </div>
                            <div class="form-group">
                                <label class="form-label">الوصف الكامل والمفصّل (عربي)</label>
                                <textarea class="admin-textarea" id="inp-desc-ar">${escapeHTML(p.description?.ar || '')}</textarea>
                            </div>
                        </div>

                        <!-- FR Sub -->
                        <div class="lang-sub-pane" style="display:${modalState.activeLangTab === 'fr' ? 'block' : 'none'};">
                            <div class="form-group">
                                <label class="form-label">Nom du produit (Français)</label>
                                <input type="text" class="admin-input" id="inp-name-fr" value="${escapeHTML(p.name?.fr || '')}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Catégorie affichée (FR)</label>
                                    <input type="text" class="admin-input" id="inp-cat-fr" value="${escapeHTML(p.category?.fr || '')}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Texte du badge (FR)</label>
                                    <input type="text" class="admin-input" id="inp-badge-fr" value="${escapeHTML(p.badge?.fr || '')}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description courte (FR)</label>
                                <input type="text" class="admin-input" id="inp-short-fr" value="${escapeHTML(p.shortDesc?.fr || '')}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description détaillée (FR)</label>
                                <textarea class="admin-textarea" id="inp-desc-fr">${escapeHTML(p.description?.fr || '')}</textarea>
                            </div>
                        </div>

                        <!-- EN Sub -->
                        <div class="lang-sub-pane" style="display:${modalState.activeLangTab === 'en' ? 'block' : 'none'};">
                            <div class="form-group">
                                <label class="form-label">Product Name (English)</label>
                                <input type="text" class="admin-input" id="inp-name-en" value="${escapeHTML(p.name?.en || '')}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Display Category (EN)</label>
                                    <input type="text" class="admin-input" id="inp-cat-en" value="${escapeHTML(p.category?.en || '')}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Badge Text (EN)</label>
                                    <input type="text" class="admin-input" id="inp-badge-en" value="${escapeHTML(p.badge?.en || '')}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Short Description (EN)</label>
                                <input type="text" class="admin-input" id="inp-short-en" value="${escapeHTML(p.shortDesc?.en || '')}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Detailed Description (EN)</label>
                                <textarea class="admin-textarea" id="inp-desc-en">${escapeHTML(p.description?.en || '')}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Specs Tab -->
                    <div id="tab-pane-specs" style="display:${modalState.activeTab === 'specs' ? 'block' : 'none'};">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
                            <div style="display:flex;gap:8px;">
                                <button type="button" class="btn-pill spec-lang-btn ${modalState.activeSpecsLang === 'ar' ? '' : 'btn-secondary-pill'}" data-speclang="ar" style="padding:6px 14px;font-size:0.8rem;">العربية 🇩🇿</button>
                                <button type="button" class="btn-pill spec-lang-btn ${modalState.activeSpecsLang === 'fr' ? '' : 'btn-secondary-pill'}" data-speclang="fr" style="padding:6px 14px;font-size:0.8rem;">Français 🇫🇷</button>
                                <button type="button" class="btn-pill spec-lang-btn ${modalState.activeSpecsLang === 'en' ? '' : 'btn-secondary-pill'}" data-speclang="en" style="padding:6px 14px;font-size:0.8rem;">English 🇬🇧</button>
                            </div>
                            <button type="button" class="btn-secondary-pill" id="btn-add-spec-row" style="padding:6px 14px;font-size:0.8rem;">+ إضافة مواصفة</button>
                        </div>
                        <div id="specs-rows-container">
                            ${renderSpecsEditorRows(p.specs?.[modalState.activeSpecsLang || 'ar'] || {}, modalState.activeSpecsLang || 'ar')}
                        </div>
                    </div>

                    <!-- 4. Gallery Tab -->
                    <div id="tab-pane-gallery" style="display:${modalState.activeTab === 'gallery' ? 'block' : 'none'};">
                        <div style="margin-bottom:16px;">
                            <label class="form-label">إضافة صورة إضافية للمعرض</label>
                            <div style="display:flex;gap:10px;">
                                <input type="text" class="admin-input" id="new-gallery-url" placeholder="https://... أو assets/...">
                                <button type="button" class="btn-pill" id="btn-add-gallery-item" style="padding:10px 18px;white-space:nowrap;">+ إضافة</button>
                            </div>
                        </div>
                        <div id="gallery-items-container" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:12px;">
                            ${(p.gallery || []).map((img, idx) => `
                                <div style="position:relative;border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;background:var(--surface-container-low);padding:6px;text-align:center;">
                                    <img src="${sanitizeURL(img, 'assets/product-image.png')}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;" onerror="this.src='assets/product-image.png'">
                                    <div style="margin-top:6px;display:flex;justify-content:center;gap:6px;">
                                        <button type="button" class="admin-action-btn del-gal-btn" data-idx="${idx}" title="حذف">🗑️</button>
                                        <button type="button" class="admin-action-btn set-primary-gal-btn" data-url="${escapeHTML(img)}" title="تعيين كصورة رئيسية">⭐</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 5. Advanced Tab -->
                    <div id="tab-pane-advanced" style="display:${modalState.activeTab === 'advanced' ? 'block' : 'none'};">
                        <div class="form-group">
                            <label class="form-label">تاريخ ووقت الإضافة (addedAt)</label>
                            <input type="text" class="admin-input" id="inp-added-at" value="${escapeHTML(p.addedAt || new Date().toISOString())}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">بيانات وصفية مخصصة (JSON Metadata)</label>
                            <textarea class="admin-textarea" id="inp-custom-meta" style="font-family:monospace;font-size:0.8rem;">${escapeHTML(JSON.stringify(p.metadata || {}, null, 2))}</textarea>
                            <span class="error-inline" id="err-meta"></span>
                        </div>
                    </div>
                </div>

                <div class="admin-modal-footer">
                    <button type="button" class="btn-secondary-pill" id="modal-cancel-btn">إلغاء</button>
                    <button type="button" class="btn-pill" id="modal-save-product-btn">حفظ المنتج</button>
                </div>
            </div>
        </div>
    `;

    bindModalEvents(modalWrapper, container);
}

function renderSpecsEditorRows(specsObj, lang = 'ar') {
    const entries = Object.entries(specsObj || {});
    if (entries.length === 0) {
        const hintText = lang === 'ar' 
            ? 'لا توجد مواصفات مدخلة لهذه اللغة حالياً. اضغط على "+ إضافة مواصفة" لإضافة خصائص مثل البطارية، الوزن، اللون.'
            : (lang === 'fr' ? 'Aucune spécification saisie pour cette langue. Cliquez sur "+ Ajouter" pour insérer des propriétés.' : 'No specifications entered for this language yet. Click "+ Add" to insert specs.');
        return `<div class="empty-specs-hint" style="color:var(--text-muted);font-size:0.85rem;padding:12px;text-align:center;">${escapeHTML(hintText)}</div>`;
    }

    const keyPlaceholder = lang === 'ar' ? 'الخاصية (مثال: البطارية)' : (lang === 'fr' ? 'Propriété (ex: Batterie)' : 'Feature (e.g. Battery)');
    const valPlaceholder = lang === 'ar' ? 'القيمة (مثال: 30 ساعة)' : (lang === 'fr' ? 'Valeur (ex: 30 heures)' : 'Value (e.g. 30 hours)');

    return entries.map(([k, v], idx) => `
        <div class="spec-edit-row" style="display:flex;gap:10px;margin-bottom:10px;align-items:center;">
            <input type="text" class="admin-input spec-key-inp" value="${escapeHTML(k)}" placeholder="${escapeHTML(keyPlaceholder)}" style="flex:1;">
            <input type="text" class="admin-input spec-val-inp" value="${escapeHTML(v)}" placeholder="${escapeHTML(valPlaceholder)}" style="flex:2;">
            <button type="button" class="admin-action-btn delete remove-spec-row-btn" data-idx="${idx}" title="حذف">✕</button>
        </div>
    `).join('');
}

function bindModalEvents(modalWrapper, container) {
    // Close modal
    const closeBtn = modalWrapper.querySelector('#modal-close-x');
    const cancelBtn = modalWrapper.querySelector('#modal-cancel-btn');
    const overlay = modalWrapper.querySelector('.admin-modal-overlay');

    const closeModal = () => {
        modalState.isOpen = false;
        modalWrapper.innerHTML = '';
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // Tabs Switcher
    modalWrapper.querySelectorAll('.admin-modal-tabs .admin-tab-btn').forEach(btn => {
        btn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            modalState.activeTab = btn.getAttribute('data-tab');
            renderModalDOM(container);
        };
    });

    // Sub-lang tabs switcher
    modalWrapper.querySelectorAll('.sub-lang-btn').forEach(btn => {
        btn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            modalState.activeLangTab = btn.getAttribute('data-lang');
            renderModalDOM(container);
        };
    });

    // Live image preview
    const imageInput = modalWrapper.querySelector('#inp-image');
    const imgPreview = modalWrapper.querySelector('#img-live-preview');
    if (imageInput && imgPreview) {
        imageInput.addEventListener('input', () => {
            imgPreview.src = sanitizeURL(imageInput.value, 'assets/product-image.png');
        });
    }

    // Add Spec Row
    // Specs Lang Switcher
    modalWrapper.querySelectorAll('.spec-lang-btn').forEach(btn => {
        btn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            modalState.activeSpecsLang = btn.getAttribute('data-speclang') || 'ar';
            renderModalDOM(container);
        };
    });

    // Add Spec Row
    const addSpecBtn = modalWrapper.querySelector('#btn-add-spec-row');
    if (addSpecBtn) {
        addSpecBtn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            const specLang = modalState.activeSpecsLang || 'ar';
            if (!modalState.productData.specs) modalState.productData.specs = { ar: {}, fr: {}, en: {} };
            if (!modalState.productData.specs[specLang]) modalState.productData.specs[specLang] = {};

            const defaultLabel = specLang === 'ar' ? 'خاصية' : (specLang === 'fr' ? 'Caractéristique' : 'Feature');
            const count = Object.keys(modalState.productData.specs[specLang]).length + 1;
            const uniqueKey = `${defaultLabel} ${count}`;
            const defaultValue = specLang === 'ar' ? 'القيمة' : (specLang === 'fr' ? 'Valeur' : 'Value');
            modalState.productData.specs[specLang][uniqueKey] = defaultValue;

            renderModalDOM(container);
        };
    }

    // Remove Spec Row
    modalWrapper.querySelectorAll('.remove-spec-row-btn').forEach(btn => {
        btn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            const specLang = modalState.activeSpecsLang || 'ar';
            const row = btn.closest('.spec-edit-row');
            if (row) {
                const k = row.querySelector('.spec-key-inp')?.value;
                if (k && modalState.productData.specs?.[specLang]) {
                    delete modalState.productData.specs[specLang][k];
                }
            }
            renderModalDOM(container);
        };
    });

    // Add Gallery Item
    const addGalBtn = modalWrapper.querySelector('#btn-add-gallery-item');
    const galUrlInp = modalWrapper.querySelector('#new-gallery-url');
    if (addGalBtn && galUrlInp) {
        addGalBtn.onclick = () => {
            const url = galUrlInp.value.trim();
            if (url) {
                collectCurrentModalInputs(modalWrapper);
                if (!Array.isArray(modalState.productData.gallery)) modalState.productData.gallery = [];
                modalState.productData.gallery.push(url);
                renderModalDOM(container);
            }
        };
    }

    // Delete Gallery item
    modalWrapper.querySelectorAll('.del-gal-btn').forEach(btn => {
        btn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!isNaN(idx) && Array.isArray(modalState.productData.gallery)) {
                modalState.productData.gallery.splice(idx, 1);
                renderModalDOM(container);
            }
        };
    });

    // Set Primary Gallery Item
    modalWrapper.querySelectorAll('.set-primary-gal-btn').forEach(btn => {
        btn.onclick = () => {
            collectCurrentModalInputs(modalWrapper);
            const url = btn.getAttribute('data-url');
            if (url) {
                modalState.productData.image = url;
                renderModalDOM(container);
            }
        };
    });

    // Save Product Button
    const saveBtn = modalWrapper.querySelector('#modal-save-product-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            collectCurrentModalInputs(modalWrapper);
            if (await validateAndSaveProduct(modalWrapper, container)) {
                closeModal();
            }
        };
    }
}

/**
 * Sync values from the active form controls back into modalState.productData
 */
function collectCurrentModalInputs(modalWrapper = null) {
    const root = modalWrapper || document.getElementById('admin-product-modal-root') || document;
    const p = modalState.productData;
    if (!p) return;

    const getVal = (id) => root.querySelector('#' + id)?.value;

    const id = getVal('inp-id');
    if (id) p.id = id.trim();

    const catKey = getVal('inp-catkey');
    if (catKey) p.categoryKey = catKey;

    const price = getVal('inp-price');
    if (price !== undefined) p.price = safePrice(price);

    const oldPrice = getVal('inp-oldprice');
    p.oldPrice = oldPrice ? safePrice(oldPrice) : null;

    const stock = getVal('inp-stock');
    if (stock !== undefined) p.stock = Math.max(0, parseInt(stock, 10) || 0);

    const rating = getVal('inp-rating');
    if (rating !== undefined) p.rating = parseFloat(rating) || 4.9;

    const reviews = getVal('inp-reviews');
    if (reviews !== undefined) p.reviewsCount = parseInt(reviews, 10) || 0;

    const img = getVal('inp-image');
    if (img) p.image = img.trim();

    // Multilingual names
    const nameAr = getVal('inp-name-ar');
    if (nameAr !== undefined) p.name.ar = nameAr.trim();
    const nameFr = getVal('inp-name-fr');
    if (nameFr !== undefined) p.name.fr = nameFr.trim();
    const nameEn = getVal('inp-name-en');
    if (nameEn !== undefined) p.name.en = nameEn.trim();

    // Categories
    const catAr = getVal('inp-cat-ar');
    if (catAr !== undefined) p.category.ar = catAr.trim();
    const catFr = getVal('inp-cat-fr');
    if (catFr !== undefined) p.category.fr = catFr.trim();
    const catEn = getVal('inp-cat-en');
    if (catEn !== undefined) p.category.en = catEn.trim();

    // Badges
    const badgeAr = getVal('inp-badge-ar');
    if (badgeAr !== undefined) p.badge.ar = badgeAr.trim();
    const badgeFr = getVal('inp-badge-fr');
    if (badgeFr !== undefined) p.badge.fr = badgeFr.trim();
    const badgeEn = getVal('inp-badge-en');
    if (badgeEn !== undefined) p.badge.en = badgeEn.trim();

    // Short Descs
    const shortAr = getVal('inp-short-ar');
    if (shortAr !== undefined) p.shortDesc.ar = shortAr.trim();
    const shortFr = getVal('inp-short-fr');
    if (shortFr !== undefined) p.shortDesc.fr = shortFr.trim();
    const shortEn = getVal('inp-short-en');
    if (shortEn !== undefined) p.shortDesc.en = shortEn.trim();

    // Detailed Descs
    const descAr = getVal('inp-desc-ar');
    if (descAr !== undefined) p.description.ar = descAr.trim();
    const descFr = getVal('inp-desc-fr');
    if (descFr !== undefined) p.description.fr = descFr.trim();
    const descEn = getVal('inp-desc-en');
    if (descEn !== undefined) p.description.en = descEn.trim();

    // Specs scoped to root and current activeSpecsLang
    const specsContainer = root.querySelector('#specs-rows-container');
    if (specsContainer) {
        const specRows = root.querySelectorAll('.spec-edit-row');
        const specLang = modalState.activeSpecsLang || 'ar';
        if (!p.specs) p.specs = { ar: {}, fr: {}, en: {} };
        if (!p.specs[specLang]) p.specs[specLang] = {};

        const specsMap = {};
        specRows.forEach(row => {
            const k = row.querySelector('.spec-key-inp')?.value?.trim();
            const v = row.querySelector('.spec-val-inp')?.value?.trim();
            if (k) specsMap[k] = v || '';
        });
        p.specs[specLang] = specsMap;
    }

    const addedAt = getVal('inp-added-at');
    if (addedAt) p.addedAt = addedAt.trim();

    const customMetaStr = getVal('inp-custom-meta');
    if (customMetaStr) {
        try {
            p.metadata = JSON.parse(customMetaStr);
        } catch {
            // Keep existing if invalid json
        }
    }
}

/**
 * Validate and Persist Product
 */
async function validateAndSaveProduct(modalWrapper, container) {
    const p = modalState.productData;
    let isValid = true;

    const setErr = (id, msg) => {
        const el = modalWrapper.querySelector('#' + id);
        if (el) el.textContent = msg;
        if (msg) isValid = false;
    };

    setErr('err-id', '');
    setErr('err-price', '');
    setErr('err-stock', '');
    setErr('err-name-ar', '');
    setErr('err-image', '');

    // 1. ID Check
    if (!p.id || !/^[a-zA-Z0-9_\-]{1,64}$/.test(p.id)) {
        setErr('err-id', 'المعرّف يجب أن يحتوي على أحرف وأرقام وشرطات فقط بدون مسافات (1-64 حرف).');
    }

    // 2. Price Check
    if (typeof p.price !== 'number' || isNaN(p.price) || p.price < 0 || p.price > 10000000) {
        setErr('err-price', 'يرجى إدخال سعر صحيح بين 0 و 10,000,000 دج.');
    }

    // 3. Stock Check
    if (typeof p.stock !== 'number' || isNaN(p.stock) || p.stock < 0 || p.stock > 999) {
        setErr('err-stock', 'يرجى إدخال مخزون بين 0 و 999.');
    }

    // 4. Name Arabic Check
    if (!p.name?.ar && typeof p.name !== 'string') {
        setErr('err-name-ar', 'اسم المنتج باللغة العربية مطلوب.');
    }

    // 5. Image Check
    if (!p.image) {
        p.image = 'assets/product-image.png';
    }

    if (!isValid) {
        window.adminToast?.('يرجى تصحيح الأخطاء الموجودة في النموذج قبل الحفظ', 'error');
        return false;
    }

    // Fallbacks for empty FR and EN names
    if (!p.name.fr) p.name.fr = p.name.ar;
    if (!p.name.en) p.name.en = p.name.ar;
    if (!p.category.fr) p.category.fr = p.category.ar;
    if (!p.category.en) p.category.en = p.category.ar;

    // Save via ProductsService Repository
    await ProductsService.save(p);
    window.adminToast?.('تم حفظ المنتج بنجاح!', 'success');

    if (container) {
        await renderProductsSection(container);
    }

    return true;
}

/**
 * Duplicate a single product
 */
async function duplicateProduct(productId, container) {
    const target = await ProductsService.getById(productId);
    if (!target) return;

    const copy = JSON.parse(JSON.stringify(target));
    copy.id = 'prod_' + Math.floor(100000 + Math.random() * 900000);
    if (typeof copy.name === 'object') {
        if (copy.name.ar) copy.name.ar += ' (نسخة)';
        if (copy.name.fr) copy.name.fr += ' (copie)';
        if (copy.name.en) copy.name.en += ' (copy)';
    } else {
        copy.name = String(copy.name) + ' (copy)';
    }
    copy.addedAt = new Date().toISOString();

    await ProductsService.save(copy);
    window.adminToast?.('تم استنساخ المنتج بنجاح!', 'success');
    await renderProductsSection(container);
}

/**
 * Delete a single product
 */
async function deleteProduct(productId, container) {
    await ProductsService.delete(productId);
    selectedProductIds.delete(productId);
    window.adminToast?.('تم حذف المنتج بنجاح!', 'success');
    await renderProductsSection(container);
}

/**
 * Export products catalog as JSON file
 */
async function exportProductsJSON() {
    const products = await ProductsService.getAll();
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zirox-products-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.adminToast?.('تم تنزيل كتالوج المنتجات بتنسيق JSON بنجاح', 'success');
}

/**
 * Import products from a JSON file
 */
function importProductsJSON(e, container) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data)) {
                throw new Error('الملف يجب أن يحتوي على مصفوفة منتجات (Array).');
            }

            const validItems = data.filter(isValidProduct);
            if (validItems.length === 0) {
                throw new Error('لم يتم العثور على أي منتجات صالحة في الملف المختار.');
            }

            if (confirm(`تم العثور على ${validItems.length} منتج صالح. هل تريد استبدال/دمج المنتجات في المتجر؟`)) {
                await ProductsService.saveAll(validItems);
                window.adminToast?.(`تم استيراد ${validItems.length} منتج بنجاح!`, 'success');
                await renderProductsSection(container);
            }
        } catch (err) {
            console.error('Import error', err);
            window.adminToast?.('فشل الاستيراد: ' + (err.message || 'ملف غير صالح'), 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
