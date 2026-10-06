/**
 * ZIROX STORE — SECURITY & SANITIZATION UTILITIES
 * Protects against Cross-Site Scripting (XSS) and unsafe input injection.
 */

const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
};

/**
 * Escapes unsafe HTML characters to prevent XSS vulnerabilities.
 * @param {any} input
 * @returns {string}
 */
export function escapeHTML(input) {
    if (input === null || input === undefined) return '';
    return String(input).replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Validates and sanitizes URLs to prevent javascript: and data: pseudo-protocols.
 * @param {string} url
 * @param {string} fallback
 * @returns {string}
 */
export function sanitizeURL(url, fallback = 'assets/product-image.png') {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    
    // Allowed URL protocols/paths: https, relative assets, root-relative, mailto, wa.me
    if (
        trimmed.startsWith('https://') ||
        trimmed.startsWith('assets/') ||
        trimmed.startsWith('./assets/') ||
        trimmed.startsWith('/assets/') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('https://wa.me/')
    ) {
        return escapeHTML(trimmed);
    }

    return fallback;
}

/**
 * يتحقق من بنية كائن منتج قادم من مصدر غير موثوق
 */
export function isValidProduct(p) {
    if (!p || typeof p !== 'object') return false;
    if (typeof p.id !== 'string' || !/^[a-zA-Z0-9_\-]{1,64}$/.test(p.id)) return false;
    const nameStr = typeof p.name === 'object' && p.name !== null
        ? (p.name.ar || p.name.en || p.name.fr || '')
        : (typeof p.name === 'string' ? p.name : '');
    if (typeof nameStr !== 'string' || nameStr.length < 2 || nameStr.length > 300) return false;
    const price = Number(p.price);
    if (!Number.isFinite(price) || price < 0 || price > 10_000_000) return false;
    return true;
}

/**
 * يطبّع سعر قادم من DOM/Storage إلى عدد صحيح آمن
 */
export function safePrice(value, { min = 0, max = 10_000_000 } = {}) {
    const n = Math.trunc(Number(value));
    if (!Number.isFinite(n)) return 0;
    return Math.min(max, Math.max(min, n));
}

/**
 * يتحقق من عناصر السلة المسترجَعة من localStorage
 */
export function sanitizeCartItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter(it => it && typeof it === 'object')
        .map(it => ({
            id: typeof it.id === 'string' ? it.id.slice(0, 64) : 'item_' + Math.random().toString(36).slice(2),
            name: typeof it.name === 'string' ? it.name.slice(0, 200) : '',
            price: safePrice(it.price),
            image: typeof it.image === 'string' ? it.image.slice(0, 500) : 'assets/product-image.png',
            quantity: Math.min(99, Math.max(1, Math.trunc(Number(it.quantity)) || 1))
        }))
        .filter(it => it.name.length > 0);
}

