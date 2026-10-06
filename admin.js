/**
 * ZIROX STORE — ADMIN MASTER CONTROLLER
 * Handles Authentication, Rate Limiting, SPA Hash Routing, Overview Dashboard, Theme, and Notifications.
 */

import { StorageService } from './storage.js';
import { ProductsService } from './products.js';
import { formatPrice, setLanguage, getCurrentLang, localize } from './i18n.js';
import { escapeHTML, sanitizeURL } from './security.js';

import { renderProductsSection, openProductModal } from './admin-products.js';
import { renderOrdersSection, openOrderDetailsModal } from './admin-orders.js';
import { renderShippingSection, renderSettingsSection, renderBackupSection } from './admin-settings.js';

// =============================================================================
// AUTHENTICATION & RATE LIMITING
// =============================================================================
// Obfuscated credential verification (client-side barrier)
const ADMIN_PASSWORD = (typeof atob === 'function') ? atob("emlyb3gtYWRtaW4tMjAyNg==") : "zirox-admin-2026";
const AUTH_SESSION_KEY = "zirox_admin_auth";
const FAILED_ATTEMPTS_KEY = "zirox_admin_failed_attempts";
const LOCKOUT_UNTIL_KEY = "zirox_admin_lockout_until";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

const sessionStore = {
    get(key) {
        try {
            return typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage.getItem(key) : null;
        } catch (e) {
            return null;
        }
    },
    set(key, val) {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) window.sessionStorage.setItem(key, val);
        } catch (e) {}
    },
    remove(key) {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) window.sessionStorage.removeItem(key);
        } catch (e) {}
    }
};

function isAuthenticated() {
    return sessionStore.get(AUTH_SESSION_KEY) === "true";
}

function getFailedAttempts() {
    return parseInt(sessionStore.get(FAILED_ATTEMPTS_KEY) || "0", 10);
}

function getLockoutRemainingMs() {
    const lockoutUntil = parseInt(sessionStore.get(LOCKOUT_UNTIL_KEY) || "0", 10);
    const now = Date.now();
    return lockoutUntil > now ? (lockoutUntil - now) : 0;
}

function recordFailedAttempt() {
    let attempts = getFailedAttempts() + 1;
    sessionStore.set(FAILED_ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_MS;
        sessionStore.set(LOCKOUT_UNTIL_KEY, String(lockoutUntil));
    }
}

function clearAuthFailures() {
    sessionStore.remove(FAILED_ATTEMPTS_KEY);
    sessionStore.remove(LOCKOUT_UNTIL_KEY);
}

// =============================================================================
// ADMIN TOAST SYSTEM
// =============================================================================
export function adminToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <h5>${escapeHTML(type === 'error' ? 'خطأ' : (type === 'success' ? 'نجاح' : 'تنبيه'))}</h5>
            <p>${escapeHTML(message)}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}

window.adminToast = adminToast;

// =============================================================================
// APPLICATION LIFECYCLE & ROUTING
// =============================================================================
let currentRoute = 'overview';

function bootAdminApp() {
    // 1. Theme sync
    initTheme();

    // 2. Language sync
    initLanguage();

    // 3. Check Authentication
    if (!isAuthenticated()) {
        showLoginOverlay();
    } else {
        initAdminDashboard();
    }

    window.__zirox_admin_loaded = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdminApp);
} else {
    bootAdminApp();
}

function showLoginOverlay() {
    const appRoot = document.getElementById('admin-app');
    if (!appRoot) return;

    const remainingLockout = getLockoutRemainingMs();

    appRoot.innerHTML = `
        <div class="admin-auth-overlay">
            <div class="admin-auth-card">
                <div class="admin-auth-logo">
                    <span class="logo-mark">
                        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="40" rx="20" fill="#000000"/>
                            <path d="M13 14H27L14 26H28" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="26.5" cy="14" r="2.2" fill="#FFFFFF"/>
                        </svg>
                    </span>
                    <span style="font-size:1.25rem;font-weight:800;letter-spacing:-0.03em;">ZIROX ADMIN</span>
                </div>

                <h2>تسجيل الدخول للوحة الإدارة</h2>
                <p>يرجى إدخال كلمة المرور السرية لمتابعة إدارة المتجر</p>

                <div class="auth-lockout" id="auth-lockout-msg" style="${remainingLockout > 0 ? 'display:block;' : 'display:none;'}">
                    ⚠️ تم قفل المحاولات مؤقتاً بسبب تجاوز 5 محاولات خاطئة. يرجى الانتظار <span id="lockout-countdown">${Math.ceil(remainingLockout / 1000)}</span> ثانية.
                </div>

                <form id="admin-login-form">
                    <div class="auth-input-group">
                        <input type="password" class="auth-input" id="admin-password-input" placeholder="كلمة المرور..." autocomplete="current-password" required ${remainingLockout > 0 ? 'disabled' : ''}>
                        <button type="button" class="auth-eye-btn" id="auth-toggle-pwd" title="إظهار/إخفاء">👁️</button>
                    </div>

                    <div class="auth-error" id="auth-error-msg"></div>

                    <button type="submit" class="btn-pill" id="admin-submit-login" style="width:100%;justify-content:center;padding:13px;font-size:0.95rem;" ${remainingLockout > 0 ? 'disabled' : ''}>
                        دخول لوحة التحكم
                    </button>
                </form>

                <div style="margin-top:24px;border-top:1px solid var(--border-light);padding-top:16px;">
                    <a href="index.html" style="color:var(--text-muted);text-decoration:none;font-size:0.82rem;">
                        ← العودة لمتجر Zirox
                    </a>
                </div>
            </div>
        </div>
    `;

    bindLoginEvents();
}

function bindLoginEvents() {
    const form = document.getElementById('admin-login-form');
    const pwdInput = document.getElementById('admin-password-input');
    const eyeBtn = document.getElementById('auth-toggle-pwd');
    const errorMsg = document.getElementById('auth-error-msg');
    const lockoutMsg = document.getElementById('auth-lockout-msg');
    const submitBtn = document.getElementById('admin-submit-login');

    if (eyeBtn && pwdInput) {
        eyeBtn.onclick = () => {
            const isText = pwdInput.type === 'text';
            pwdInput.type = isText ? 'password' : 'text';
        };
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const remaining = getLockoutRemainingMs();
            if (remaining > 0) return;

            const entered = pwdInput.value;
            if (entered === ADMIN_PASSWORD) {
                clearAuthFailures();
                sessionStore.set(AUTH_SESSION_KEY, "true");
                adminToast('تم تسجيل الدخول بنجاح!', 'success');
                initAdminDashboard();
            } else {
                recordFailedAttempt();
                const failed = getFailedAttempts();
                if (failed >= MAX_ATTEMPTS) {
                    lockoutMsg.style.display = 'block';
                    pwdInput.disabled = true;
                    submitBtn.disabled = true;
                    startLockoutTimer();
                } else {
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = `كلمة المرور غير صحيحة! (${MAX_ATTEMPTS - failed} محاولات متبقية قبل الإغلاق)`;
                    pwdInput.value = '';
                    pwdInput.focus();
                }
            }
        };
    }

    if (getLockoutRemainingMs() > 0) {
        startLockoutTimer();
    }
}

function startLockoutTimer() {
    const countdownEl = document.getElementById('lockout-countdown');
    const timer = setInterval(() => {
        const ms = getLockoutRemainingMs();
        if (ms <= 0) {
            clearInterval(timer);
            clearAuthFailures();
            showLoginOverlay();
        } else if (countdownEl) {
            countdownEl.textContent = Math.ceil(ms / 1000);
        }
    }, 1000);
}

// =============================================================================
// DASHBOARD INITIALIZATION & SPA ROUTING
// =============================================================================
function initAdminDashboard() {
    const appRoot = document.getElementById('admin-app');
    if (!appRoot) return;

    appRoot.innerHTML = `
        <div class="admin-wrapper">
            <!-- Sidebar -->
            <aside class="admin-sidebar" id="admin-sidebar">
                <div class="admin-sidebar-header">
                    <a href="#overview" class="admin-brand">
                        <span class="logo-mark">
                            <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="40" height="40" rx="20" fill="#000000"/>
                                <path d="M13 14H27L14 26H28" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="26.5" cy="14" r="2.2" fill="#FFFFFF"/>
                            </svg>
                        </span>
                        <span style="font-weight:800;font-size:1.1rem;letter-spacing:-0.03em;">ZIROX</span>
                    </a>
                    <span class="admin-badge">ADMIN</span>
                </div>

                <nav class="admin-nav">
                    <a href="#overview" class="admin-nav-item" data-route="overview">
                        <span class="nav-icon">📊</span>
                        <span>لوحة الإحصائيات</span>
                    </a>
                    <a href="#products" class="admin-nav-item" data-route="products">
                        <span class="nav-icon">📦</span>
                        <span>إدارة المنتجات</span>
                    </a>
                    <a href="#orders" class="admin-nav-item" data-route="orders">
                        <span class="nav-icon">📋</span>
                        <span>إدارة الطلبيات</span>
                    </a>
                    <a href="#shipping" class="admin-nav-item" data-route="shipping">
                        <span class="nav-icon">🚚</span>
                        <span>الشحن والمناطق</span>
                    </a>
                    <a href="#settings" class="admin-nav-item" data-route="settings">
                        <span class="nav-icon">⚙️</span>
                        <span>إعدادات المتجر</span>
                    </a>
                    <a href="#backup" class="admin-nav-item" data-route="backup">
                        <span class="nav-icon">💾</span>
                        <span>النسخ والاستعادة</span>
                    </a>
                </nav>

                <div class="admin-sidebar-footer">
                    <a href="index.html" class="admin-nav-item" target="_blank" rel="noopener">
                        <span class="nav-icon">🔙</span>
                        <span>عرض المتجر</span>
                    </a>
                    <button class="admin-nav-item logout" id="admin-logout-btn" style="width:100%;border:none;background:none;text-align:right;">
                        <span class="nav-icon">🚪</span>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            <!-- Main Content Area -->
            <div class="admin-main-wrap">
                <!-- Top Header -->
                <header class="admin-header">
                    <div class="admin-header-left">
                        <button class="admin-mobile-toggle" id="admin-mobile-menu-btn" aria-label="Toggle Sidebar">☰</button>
                        <div class="admin-title-group">
                            <h1 id="admin-section-title">لوحة الإحصائيات</h1>
                            <div class="admin-breadcrumb" id="admin-section-breadcrumb">الرئيسية / الإحصائيات العامة</div>
                        </div>
                    </div>

                    <div class="admin-header-actions">
                        <div class="lang-switcher" aria-label="Language">
                            <button class="lang-btn ${getCurrentLang() === 'ar' ? 'active' : ''}" data-lang="ar">AR</button>
                            <button class="lang-btn ${getCurrentLang() === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
                            <button class="lang-btn ${getCurrentLang() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
                        </div>
                        <button id="admin-theme-toggle" class="icon-btn" title="تبديل النمط">🌙</button>
                    </div>
                </header>

                <!-- Dynamic Content Container -->
                <main class="admin-content" id="admin-main-view">
                    <!-- Loaded dynamically via router -->
                </main>
            </div>
        </div>
    `;

    bindDashboardEvents();

    // Listen to hash changes
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

function bindDashboardEvents() {
    // Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                sessionStore.remove(AUTH_SESSION_KEY);
                adminToast('تم تسجيل الخروج بنجاح.', 'info');
                showLoginOverlay();
            }
        };
    }

    // Mobile sidebar toggle
    const mobileBtn = document.getElementById('admin-mobile-menu-btn');
    const sidebar = document.getElementById('admin-sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.onclick = (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        };
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && e.target !== mobileBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('admin-theme-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                themeBtn.innerHTML = '🌙';
                StorageService.setTheme('light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                themeBtn.innerHTML = '☀️';
                StorageService.setTheme('dark');
            }
        };
    }

    // Language switcher
    document.querySelectorAll('.lang-switcher .lang-btn').forEach(btn => {
        btn.onclick = () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            document.querySelectorAll('.lang-switcher .lang-btn').forEach(b => b.classList.toggle('active', b === btn));
            // Trigger route re-render
            handleRoute();
        };
    });
}

async function handleRoute() {
    const hash = window.location.hash.slice(1) || 'overview';
    currentRoute = hash;

    // Close mobile sidebar on route switch
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Update active nav link
    document.querySelectorAll('.admin-nav-item').forEach(link => {
        const route = link.getAttribute('data-route');
        link.classList.toggle('active', route === currentRoute);
    });

    const titleEl = document.getElementById('admin-section-title');
    const breadcrumbEl = document.getElementById('admin-section-breadcrumb');
    const mainView = document.getElementById('admin-main-view');
    if (!mainView) return;

    if (currentRoute === 'overview') {
        if (titleEl) titleEl.textContent = '📊 لوحة الإحصائيات العامة';
        if (breadcrumbEl) breadcrumbEl.textContent = 'لوحة التحكم / النظرة العامة';
        await renderOverviewSection(mainView);
    } else if (currentRoute === 'products') {
        if (titleEl) titleEl.textContent = '📦 إدارة المنتجات';
        if (breadcrumbEl) breadcrumbEl.textContent = 'لوحة التحكم / المنتجات';
        await renderProductsSection(mainView);
    } else if (currentRoute === 'orders') {
        if (titleEl) titleEl.textContent = '📋 إدارة الطلبيات';
        if (breadcrumbEl) breadcrumbEl.textContent = 'لوحة التحكم / الطلبيات';
        renderOrdersSection(mainView);
    } else if (currentRoute === 'shipping') {
        if (titleEl) titleEl.textContent = '🚚 إدارة الشحن والمناطق';
        if (breadcrumbEl) breadcrumbEl.textContent = 'لوحة التحكم / الشحن والتوصيل';
        renderShippingSection(mainView);
    } else if (currentRoute === 'settings') {
        if (titleEl) titleEl.textContent = '⚙️ إعدادات المتجر';
        if (breadcrumbEl) breadcrumbEl.textContent = 'لوحة التحكم / الإعدادات';
        renderSettingsSection(mainView);
    } else if (currentRoute === 'backup') {
        if (titleEl) titleEl.textContent = '💾 النسخ الاحتياطي والاستعادة';
        if (breadcrumbEl) breadcrumbEl.textContent = 'لوحة التحكم / التخزين والنسخ الاحتياطي';
        renderBackupSection(mainView);
    } else {
        window.location.hash = '#overview';
    }
}

// =============================================================================
// SECTION 1: OVERVIEW DASHBOARD
// =============================================================================
async function renderOverviewSection(container) {
    const products = await ProductsService.getAll();
    const orders = StorageService.getOrders();

    // Calculations
    const totalProducts = products.length;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    products.forEach(p => {
        const stock = typeof p.stock === 'number' ? p.stock : 0;
        const price = typeof p.price === 'number' ? p.price : 0;
        if (stock === 0) outOfStockCount++;
        else if (stock <= 5) lowStockCount++;
        totalInventoryValue += (price * stock);
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => (o.status || 'Pending') === 'Pending').length;
    
    // Revenue: delivered or confirmed
    let totalRevenue = 0;
    orders.forEach(o => {
        if (o.status === 'Delivered' || o.status === 'Confirmed') {
            const rawPrice = parseInt(String(o.total || '').replace(/\D/g, ''), 10) || 0;
            totalRevenue += rawPrice;
        }
    });

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const recentOrders = orders.slice(0, 5);
    const lowStockProducts = products.filter(p => (typeof p.stock === 'number' && p.stock <= 5));

    container.innerHTML = `
        <!-- 4x2 Stats Grid -->
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">إجمالي المنتجات</span>
                    <span class="admin-stat-icon">📦</span>
                </div>
                <div class="admin-stat-value">${totalProducts}</div>
                <div class="admin-stat-sub">منتج نشط في الكتالوج</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">منتجات نفدت</span>
                    <span class="admin-stat-icon" style="background:rgba(220,38,38,0.1);color:#dc2626;">⚠️</span>
                </div>
                <div class="admin-stat-value" style="color:${outOfStockCount > 0 ? '#dc2626' : 'inherit'};">${outOfStockCount}</div>
                <div class="admin-stat-sub ${outOfStockCount > 0 ? 'danger' : ''}">بحاجة لتجديد المخزون فوراً</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">مخزون منخفض (≤ 5)</span>
                    <span class="admin-stat-icon" style="background:rgba(234,88,12,0.1);color:#ea580c;">⏳</span>
                </div>
                <div class="admin-stat-value" style="color:${lowStockCount > 0 ? '#ea580c' : 'inherit'};">${lowStockCount}</div>
                <div class="admin-stat-sub ${lowStockCount > 0 ? 'warning' : ''}">قطع أوشكت على النفاد</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">قيمة المخزون الكلية</span>
                    <span class="admin-stat-icon">💰</span>
                </div>
                <div class="admin-stat-value">${formatPrice(totalInventoryValue)}</div>
                <div class="admin-stat-sub">سعر البيع الإجمالي</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">إجمالي الطلبيات</span>
                    <span class="admin-stat-icon">📋</span>
                </div>
                <div class="admin-stat-value">${totalOrders}</div>
                <div class="admin-stat-sub">طلبية مسجلة في النظام</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">طلبيات قيد الانتظار</span>
                    <span class="admin-stat-icon" style="background:rgba(234,88,12,0.1);color:#ea580c;">🕒</span>
                </div>
                <div class="admin-stat-value" style="color:${pendingOrders > 0 ? '#ea580c' : 'inherit'};">${pendingOrders}</div>
                <div class="admin-stat-sub ${pendingOrders > 0 ? 'warning' : ''}">بحاجة للتأكيد عبر الهاتف/واتساب</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">إجمالي المبيعات المؤكدة</span>
                    <span class="admin-stat-icon" style="background:rgba(22,163,74,0.1);color:#16a34a;">📈</span>
                </div>
                <div class="admin-stat-value" style="color:#16a34a;">${formatPrice(totalRevenue)}</div>
                <div class="admin-stat-sub positive">طلبيات مؤكدة ومستلمة</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">متوسط قيمة الطلب</span>
                    <span class="admin-stat-icon">🏷️</span>
                </div>
                <div class="admin-stat-value">${formatPrice(avgOrderValue)}</div>
                <div class="admin-stat-sub">معدل سلة الشراء</div>
            </div>
        </div>

        <!-- Quick Actions Row -->
        <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
            <a href="#products" class="btn-pill" id="quick-add-prod-btn" style="text-decoration:none;padding:12px 24px;">
                + إضافة منتج جديد
            </a>
            <a href="#orders" class="btn-secondary-pill" style="text-decoration:none;padding:12px 24px;">
                📋 استعراض الطلبيات
            </a>
            <a href="#backup" class="btn-secondary-pill" style="text-decoration:none;padding:12px 24px;">
                💾 أخذ نسخة احتياطية
            </a>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;">
            <!-- Recent Orders -->
            <div class="admin-card" style="margin-bottom:0;">
                <div class="admin-card-header">
                    <h3 class="admin-card-title">🕒 أحدث الطلبيات المستلمة</h3>
                    <a href="#orders" style="font-size:0.8rem;color:var(--text-muted);text-decoration:none;">عرض الكل ←</a>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>الزبون</th>
                                <th>الولاية</th>
                                <th>المبلغ</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentOrders.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">
                                        لا توجد طلبيات مسجلة حتى الآن.
                                    </td>
                                </tr>
                            ` : recentOrders.map(o => `
                                <tr>
                                    <td><strong>${escapeHTML(o.id)}</strong></td>
                                    <td>${escapeHTML(o.customerName)}</td>
                                    <td>${escapeHTML(o.wilaya)}</td>
                                    <td><strong>${escapeHTML(o.total)}</strong></td>
                                    <td>
                                        <span class="status-pill status-${(o.status || 'pending').toLowerCase()}">
                                            ${escapeHTML(o.status || 'Pending')}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Low Stock Warnings -->
            <div class="admin-card" style="margin-bottom:0;">
                <div class="admin-card-header">
                    <h3 class="admin-card-title" style="color:#dc2626;">⚠️ تنبيهات المخزون</h3>
                    <a href="#products" style="font-size:0.8rem;color:var(--text-muted);text-decoration:none;">إدارة ←</a>
                </div>
                <div>
                    ${lowStockProducts.length === 0 ? `
                        <div style="padding:28px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
                            ✨ جميع المنتجات متوفرة بمخزون كافٍ.
                        </div>
                    ` : lowStockProducts.map(p => `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light);">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <img src="${sanitizeURL(p.image, 'assets/product-image.png')}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;" onerror="this.src='assets/product-image.png'">
                                <div>
                                    <div style="font-weight:700;font-size:0.85rem;">${escapeHTML(p.name?.ar || (typeof p.name === 'string' ? p.name : p.id))}</div>
                                    <div style="font-size:0.75rem;color:var(--text-muted);">${formatPrice(p.price || 0)}</div>
                                </div>
                            </div>
                            <span class="status-pill ${p.stock === 0 ? 'out-of-stock' : 'low-stock'}">
                                ${p.stock === 0 ? 'نفد' : `${p.stock} فقط`}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// =============================================================================
// GLOBAL HELPERS
// =============================================================================
function initTheme() {
    const stored = StorageService.getTheme();
    if (stored === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        const themeBtn = document.getElementById('admin-theme-toggle');
        if (themeBtn) themeBtn.innerHTML = '☀️';
    }
}

function initLanguage() {
    const lang = StorageService.getLanguage('ar');
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}
