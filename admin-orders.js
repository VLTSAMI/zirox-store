/**
 * ZIROX STORE — ADMIN ORDERS CONTROLLER
 * Comprehensive order lifecycle, filtering, invoice printing, and CSV/JSON export.
 */

import { StorageService } from './storage.js';
import { escapeHTML, sanitizeURL } from './security.js';
import { formatPrice } from './i18n.js';

let currentOrderFilter = {
    search: '',
    status: 'all',
    wilaya: '',
    dateFrom: '',
    dateTo: ''
};

/**
 * Render the complete Orders management section
 * @param {HTMLElement} container 
 */
export function renderOrdersSection(container) {
    if (!container) return;

    const allOrders = StorageService.getOrders();
    let filtered = [...allOrders];

    // 1. Text Search Filter (name, phone, id)
    if (currentOrderFilter.search.trim()) {
        const q = currentOrderFilter.search.trim().toLowerCase();
        filtered = filtered.filter(o => {
            const idMatch = (o.id || '').toLowerCase().includes(q);
            const nameMatch = (o.customerName || '').toLowerCase().includes(q);
            const phoneMatch = (o.phone || '').toLowerCase().includes(q);
            return idMatch || nameMatch || phoneMatch;
        });
    }

    // 2. Status Filter
    if (currentOrderFilter.status !== 'all') {
        filtered = filtered.filter(o => (o.status || 'Pending').toLowerCase() === currentOrderFilter.status.toLowerCase());
    }

    // 3. Wilaya Filter
    if (currentOrderFilter.wilaya.trim()) {
        const w = currentOrderFilter.wilaya.trim().toLowerCase();
        filtered = filtered.filter(o => (o.wilaya || '').toLowerCase().includes(w));
    }

    // 4. Date Range Filter
    if (currentOrderFilter.dateFrom) {
        const fromTime = new Date(currentOrderFilter.dateFrom).getTime();
        filtered = filtered.filter(o => o.createdAt && new Date(o.createdAt).getTime() >= fromTime);
    }
    if (currentOrderFilter.dateTo) {
        // End of the day
        const toTime = new Date(currentOrderFilter.dateTo).getTime() + (24 * 60 * 60 * 1000 - 1);
        filtered = filtered.filter(o => o.createdAt && new Date(o.createdAt).getTime() <= toTime);
    }

    container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">📋 إدارة الطلبيات (${allOrders.length})</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">متابعة وتحديث حالات الشحن، طباعة الفواتير، والتواصل مع الزبائن</span>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn-secondary-pill" id="admin-export-orders-csv" style="padding:10px 18px;font-size:0.85rem;">
                        📊 تصدير الطلبيات (CSV)
                    </button>
                    <button class="btn-secondary-pill" id="admin-export-orders-json" style="padding:10px 18px;font-size:0.85rem;">
                        📥 تصدير (JSON)
                    </button>
                </div>
            </div>

            <!-- Filters Toolbar -->
            <div class="admin-toolbar">
                <input type="text" class="admin-search-input" id="admin-order-search" placeholder="🔍 بحث بالاسم، الهاتف، أو معرّف الطلب ORD-..." value="${escapeHTML(currentOrderFilter.search)}">
                
                <select class="admin-select" id="admin-order-status-filter">
                    <option value="all" ${currentOrderFilter.status === 'all' ? 'selected' : ''}>كل الحالات</option>
                    <option value="Pending" ${currentOrderFilter.status === 'Pending' ? 'selected' : ''}>قيد الانتظار (Pending)</option>
                    <option value="Confirmed" ${currentOrderFilter.status === 'Confirmed' ? 'selected' : ''}>مؤكدة (Confirmed)</option>
                    <option value="Shipped" ${currentOrderFilter.status === 'Shipped' ? 'selected' : ''}>تم الشحن (Shipped)</option>
                    <option value="Delivered" ${currentOrderFilter.status === 'Delivered' ? 'selected' : ''}>مستلمة (Delivered)</option>
                    <option value="Cancelled" ${currentOrderFilter.status === 'Cancelled' ? 'selected' : ''}>ملغاة (Cancelled)</option>
                </select>

                <input type="text" class="admin-search-input" id="admin-order-wilaya-filter" placeholder="الولاية..." style="max-width:140px;" value="${escapeHTML(currentOrderFilter.wilaya)}">

                <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-muted);">
                    من: <input type="date" class="admin-input" id="admin-order-date-from" style="padding:7px 10px;width:auto;" value="${currentOrderFilter.dateFrom}">
                    إلى: <input type="date" class="admin-input" id="admin-order-date-to" style="padding:7px 10px;width:auto;" value="${currentOrderFilter.dateTo}">
                </div>
            </div>

            <!-- Orders Table -->
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>التاريخ والوقت</th>
                            <th>الزبون</th>
                            <th>الهاتف</th>
                            <th>الولاية والعنوان</th>
                            <th>المنتجات</th>
                            <th>المبلغ الإجمالي</th>
                            <th>الحالة</th>
                            <th style="text-align:center;">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `
                            <tr>
                                <td colspan="9" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
                                    لا توجد أي طلبيات مطابقة للفلتر المحدد.
                                </td>
                            </tr>
                        ` : filtered.map(order => {
                            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-DZ', { dateStyle: 'short', timeStyle: 'short' }) : '-';
                            const itemsCount = Array.isArray(order.items) ? order.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 0;
                            const status = order.status || 'Pending';
                            const cleanPhone = String(order.phone || '').replace(/\D/g, '');
                            const waPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.slice(1) : (cleanPhone.startsWith('213') ? cleanPhone : '213' + cleanPhone);
                            const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً ${order.customerName}، نتواصل معك بخصوص طلبيتك رقم #${order.id} من متجر Zirox.`)}`;

                            return `
                                <tr data-order-id="${escapeHTML(order.id)}">
                                    <td>
                                        <strong style="font-family:monospace;color:var(--text-primary);">${escapeHTML(order.id)}</strong>
                                    </td>
                                    <td style="font-size:0.8rem;white-space:nowrap;color:var(--text-muted);">
                                        ${escapeHTML(dateStr)}
                                    </td>
                                    <td>
                                        <div style="font-weight:700;">${escapeHTML(order.customerName || 'عميل')}</div>
                                    </td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:6px;">
                                            <a href="tel:${escapeHTML(order.phone)}" style="color:var(--text-primary);text-decoration:none;font-weight:600;direction:ltr;">${escapeHTML(order.phone)}</a>
                                            <a href="${waLink}" target="_blank" rel="noopener" style="text-decoration:none;font-size:0.9rem;" title="محادثة واتساب">💬</a>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="font-weight:600;">${escapeHTML(order.wilaya || '-')}</div>
                                        <div style="font-size:0.75rem;color:var(--text-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(order.address || '')}</div>
                                    </td>
                                    <td>
                                        <span style="font-size:0.82rem;font-weight:700;background:var(--surface-container-low);padding:2px 8px;border-radius:12px;">
                                            ${itemsCount} قطع
                                        </span>
                                    </td>
                                    <td>
                                        <strong style="color:var(--text-primary);">${escapeHTML(order.total || '0 دج')}</strong>
                                    </td>
                                    <td>
                                        <select class="admin-select order-status-select" data-id="${escapeHTML(order.id)}" style="padding:4px 8px;font-size:0.78rem;font-weight:700;border-radius:var(--radius-md);">
                                            <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                                            <option value="Confirmed" ${status === 'Confirmed' ? 'selected' : ''}>✓ مؤكدة</option>
                                            <option value="Shipped" ${status === 'Shipped' ? 'selected' : ''}>🚚 تم الشحن</option>
                                            <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>✅ تم التسليم</option>
                                            <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>✕ ملغاة</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div class="row-actions" style="justify-content:center;">
                                            <button class="admin-action-btn view-order-btn" data-id="${escapeHTML(order.id)}" title="عرض تفاصيل الطلب والفاتورة">👁️</button>
                                            <a href="${waLink}" target="_blank" rel="noopener" class="admin-action-btn" title="تواصل عبر واتساب">💬</a>
                                            <button class="admin-action-btn delete delete-order-btn" data-id="${escapeHTML(order.id)}" title="حذف الطلب">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="order-modal-placeholder"></div>
    `;

    bindOrderSectionEvents(container);
}

/**
 * Bind DOM events for the orders section
 */
function bindOrderSectionEvents(container) {
    // Search
    const searchInp = container.querySelector('#admin-order-search');
    if (searchInp) {
        searchInp.addEventListener('input', (e) => {
            currentOrderFilter.search = e.target.value;
            renderOrdersSection(container);
            const refocused = container.querySelector('#admin-order-search');
            if (refocused) {
                refocused.focus();
                refocused.setSelectionRange(refocused.value.length, refocused.value.length);
            }
        });
    }

    // Status filter
    const statusSelect = container.querySelector('#admin-order-status-filter');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            currentOrderFilter.status = e.target.value;
            renderOrdersSection(container);
        });
    }

    // Wilaya filter
    const wilayaInp = container.querySelector('#admin-order-wilaya-filter');
    if (wilayaInp) {
        wilayaInp.addEventListener('input', (e) => {
            currentOrderFilter.wilaya = e.target.value;
            renderOrdersSection(container);
            const refocused = container.querySelector('#admin-order-wilaya-filter');
            if (refocused) {
                refocused.focus();
                refocused.setSelectionRange(refocused.value.length, refocused.value.length);
            }
        });
    }

    // Date From / To
    const dateFromInp = container.querySelector('#admin-order-date-from');
    if (dateFromInp) {
        dateFromInp.addEventListener('change', (e) => {
            currentOrderFilter.dateFrom = e.target.value;
            renderOrdersSection(container);
        });
    }
    const dateToInp = container.querySelector('#admin-order-date-to');
    if (dateToInp) {
        dateToInp.addEventListener('change', (e) => {
            currentOrderFilter.dateTo = e.target.value;
            renderOrdersSection(container);
        });
    }

    // Status change in table cell
    container.querySelectorAll('.order-status-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const id = sel.getAttribute('data-id');
            const newStatus = sel.value;
            StorageService.updateOrderStatus(id, newStatus);
            window.adminToast?.(`تم تحديث حالة الطلبية #${id} إلى: ${newStatus}`, 'success');
        });
    });

    // View Order Details
    container.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openOrderDetailsModal(id, container);
        });
    });

    // Delete Order
    container.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (confirm(`هل أنت متأكد من رغبتك في حذف الطلبية #${id} نهائياً؟`)) {
                StorageService.deleteOrder(id);
                window.adminToast?.(`تم حذف الطلبية #${id} بنجاح`, 'success');
                renderOrdersSection(container);
            }
        });
    });

    // CSV Export
    const csvBtn = container.querySelector('#admin-export-orders-csv');
    if (csvBtn) csvBtn.onclick = exportOrdersCSV;

    // JSON Export
    const jsonBtn = container.querySelector('#admin-export-orders-json');
    if (jsonBtn) jsonBtn.onclick = exportOrdersJSON;
}

/**
 * Open Order Details & Invoice Printable Modal
 */
export function openOrderDetailsModal(orderId, container) {
    const orders = StorageService.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let modalWrapper = document.getElementById('admin-order-modal-root');
    if (!modalWrapper) {
        modalWrapper = document.createElement('div');
        modalWrapper.id = 'admin-order-modal-root';
        document.body.appendChild(modalWrapper);
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-DZ', { dateStyle: 'full', timeStyle: 'short' }) : '-';
    const cleanPhone = String(order.phone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.slice(1) : (cleanPhone.startsWith('213') ? cleanPhone : '213' + cleanPhone);
    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً ${order.customerName}، نتواصل معك بخصوص طلبيتك رقم #${order.id} من متجر Zirox.`)}`;

    modalWrapper.innerHTML = `
        <div class="admin-modal-overlay open">
            <div class="admin-modal print-invoice-area" style="max-width:760px;">
                <div class="admin-modal-header no-print">
                    <h3>📦 تفاصيل الطلبية #${escapeHTML(order.id)}</h3>
                    <button class="modal-close-btn" id="order-modal-close">✕</button>
                </div>

                <div class="admin-modal-body" style="padding:28px;">
                    <!-- Invoice Header (Printed) -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid var(--color-black);padding-bottom:16px;">
                        <div>
                            <h2 style="margin:0;font-size:1.6rem;font-weight:800;letter-spacing:-0.03em;">ZIROX STORE</h2>
                            <p style="margin:4px 0 0 0;font-size:0.82rem;color:var(--text-muted);">منصة النخبة الفاخرة للتقنية والأجهزة الأصلية • الجزائر</p>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:800;font-size:1.1rem;font-family:monospace;">${escapeHTML(order.id)}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHTML(dateFormatted)}</div>
                        </div>
                    </div>

                    <!-- Customer & Shipping Block -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;background:var(--surface-subtle);padding:16px;border-radius:var(--radius-md);">
                        <div>
                            <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">معلومات الزبون</span>
                            <div style="font-weight:700;font-size:1rem;margin-top:4px;">${escapeHTML(order.customerName)}</div>
                            <div style="font-size:0.9rem;margin-top:2px;">
                                📞 <a href="tel:${escapeHTML(order.phone)}" style="color:inherit;text-decoration:none;">${escapeHTML(order.phone)}</a>
                            </div>
                        </div>
                        <div>
                            <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">بيانات التوصيل والشحن</span>
                            <div style="font-weight:700;font-size:0.95rem;margin-top:4px;">📍 ${escapeHTML(order.wilaya)}</div>
                            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">🏠 ${escapeHTML(order.address || 'العنوان غير محدد')}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">🚚 ${escapeHTML(order.deliveryMethod || 'توصيل للمكتب أو المنزل')}</div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div style="margin-bottom:24px;">
                        <span style="font-size:0.82rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:10px;">عناصر الطلبية</span>
                        <table style="width:100%;border-collapse:collapse;text-align:right;font-size:0.88rem;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--border-light);color:var(--text-muted);font-size:0.78rem;">
                                    <th style="padding:8px 0;">المنتج</th>
                                    <th style="padding:8px;text-align:center;">الكمية</th>
                                    <th style="padding:8px;text-align:left;">السعر الفردي</th>
                                    <th style="padding:8px 0;text-align:left;">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(it => `
                                    <tr style="border-bottom:1px solid var(--border-light);">
                                        <td style="padding:10px 0;display:flex;align-items:center;gap:10px;">
                                            <img src="${sanitizeURL(it.image, 'assets/product-image.png')}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" onerror="this.src='assets/product-image.png'">
                                            <span style="font-weight:600;">${escapeHTML(it.name)}</span>
                                        </td>
                                        <td style="padding:10px;text-align:center;font-weight:700;">x${it.quantity || 1}</td>
                                        <td style="padding:10px;text-align:left;">${formatPrice(it.price || 0)}</td>
                                        <td style="padding:10px 0;text-align:left;font-weight:700;">${formatPrice((it.price || 0) * (it.quantity || 1))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Total Block -->
                    <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
                        <div style="width:260px;background:var(--surface-container-low);padding:14px;border-radius:var(--radius-md);">
                            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem;color:var(--text-muted);">
                                <span>طريقة الدفع:</span>
                                <strong>دفع عند الاستلام (COD)</strong>
                            </div>
                            <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border-light);padding-top:8px;font-size:1.1rem;font-weight:800;color:var(--text-primary);">
                                <span>المبلغ الكلي:</span>
                                <span>${escapeHTML(order.total || '0 دج')}</span>
                            </div>
                        </div>
                    </div>

                    <div style="font-size:0.76rem;color:var(--text-muted);text-align:center;margin-top:20px;">
                        حق المعاينة والفحص الكامل للطرد مكفول ومضمون قبل دفع أي دينار للموزع.
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="admin-modal-footer no-print">
                    <button type="button" class="btn-secondary-pill" id="order-copy-summary-btn">📋 نسخ الملخص</button>
                    <a href="${waLink}" target="_blank" rel="noopener" class="btn-secondary-pill" style="text-decoration:none;">💬 واتساب</a>
                    <button type="button" class="btn-pill" id="order-print-btn">🖨️ طباعة الفاتورة</button>
                </div>
            </div>
        </div>
    `;

    // Bind Close
    const closeBtn = modalWrapper.querySelector('#order-modal-close');
    const overlay = modalWrapper.querySelector('.admin-modal-overlay');
    const closeModal = () => { modalWrapper.innerHTML = ''; };
    if (closeBtn) closeBtn.onclick = closeModal;
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // Print Button
    const printBtn = modalWrapper.querySelector('#order-print-btn');
    if (printBtn) {
        printBtn.onclick = () => window.print();
    }

    // Copy Summary Button
    const copyBtn = modalWrapper.querySelector('#order-copy-summary-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            let summary = `*تفاصيل الطلبية #${order.id}*\n`;
            summary += `الزبون: ${order.customerName}\nالهاتف: ${order.phone}\nالولاية: ${order.wilaya}\nالعنوان: ${order.address}\n`;
            summary += `-----------------------\nالمنتجات:\n`;
            items.forEach(it => {
                summary += `▪ ${it.name} (x${it.quantity || 1}) - ${formatPrice((it.price || 0) * (it.quantity || 1))}\n`;
            });
            summary += `-----------------------\nالمجموع النهائي: ${order.total}`;
            navigator.clipboard.writeText(summary).then(() => {
                window.adminToast?.('تم نسخ ملخص الطلب إلى الحافظة!', 'success');
            });
        };
    }
}

/**
 * Export orders as CSV with UTF-8 BOM
 */
function exportOrdersCSV() {
    const orders = StorageService.getOrders();
    if (orders.length === 0) {
        window.adminToast?.('لا توجد أي طلبيات لتصديرها.', 'warning');
        return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Wilaya', 'Address', 'Delivery Method', 'Items Count', 'Total', 'Status'];
    const rows = orders.map(o => {
        const count = Array.isArray(o.items) ? o.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 0;
        return [
            `"${o.id || ''}"`,
            `"${o.createdAt || ''}"`,
            `"${(o.customerName || '').replace(/"/g, '""')}"`,
            `"${(o.phone || '').replace(/"/g, '""')}"`,
            `"${(o.wilaya || '').replace(/"/g, '""')}"`,
            `"${(o.address || '').replace(/"/g, '""')}"`,
            `"${(o.deliveryMethod || '').replace(/"/g, '""')}"`,
            count,
            `"${(o.total || '').replace(/"/g, '""')}"`,
            `"${o.status || 'Pending'}"`
        ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zirox-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.adminToast?.('تم تصدير ملف الطلبيات (CSV) بنجاح!', 'success');
}

/**
 * Export orders as JSON file
 */
function exportOrdersJSON() {
    const orders = StorageService.getOrders();
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zirox-orders-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.adminToast?.('تم تنزيل ملف الطلبيات (JSON) بنجاح!', 'success');
}
