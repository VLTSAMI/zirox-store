/**
 * ZIROX STORE — STORAGE SERVICE
 * Dedicated encapsulation for LocalStorage with error boundaries and type safety.
 */

export const STORAGE_KEYS = Object.freeze({
    LANG: 'zirox_lang',
    PRODUCTS: 'products',
    CART: 'cart',
    ORDERS: 'orders',
    THEME: 'theme',
    SETTINGS: 'zirox_site_settings',
    SHIPPING_RATES: 'zirox_shipping_rates',
    WILAYA_ZONES: 'zirox_wilaya_zones',
    FREE_SHIPPING_THRESHOLD: 'zirox_free_shipping_threshold'
});

export class StorageService {
    /**
     * Check if localStorage is supported and accessible
     * @returns {boolean}
     */
    static isAvailable() {
        try {
            const testKey = '__zirox_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Retrieve and parse JSON item safely
     * @template T
     * @param {string} key
     * @param {T} fallbackValue
     * @returns {T}
     */
    static getItem(key, fallbackValue = null) {
        if (!this.isAvailable()) return fallbackValue;
        try {
            const raw = window.localStorage.getItem(key);
            if (raw === null || raw === undefined) return fallbackValue;
            return JSON.parse(raw);
        } catch {
            return fallbackValue;
        }
    }

    /**
     * Serialize and save item safely
     * @param {string} key
     * @param {any} value
     * @returns {boolean} True if write was successful
     */
    static setItem(key, value) {
        if (!this.isAvailable()) return false;
        try {
            const serialized = JSON.stringify(value);
            window.localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error(`StorageService: Failed to save "${key}"`, error);
            return false;
        }
    }

    /**
     * Remove an item from localStorage
     * @param {string} key
     */
    static removeItem(key) {
        if (!this.isAvailable()) return;
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`StorageService: Failed to remove "${key}"`, error);
        }
    }

    /**
     * Specific domain accessors
     */
    static getLanguage(defaultLang = 'ar') {
        const stored = this.getItem(STORAGE_KEYS.LANG, defaultLang);
        return typeof stored === 'string' ? stored : defaultLang;
    }

    static setLanguage(lang) {
        return this.setItem(STORAGE_KEYS.LANG, lang);
    }

    static getTheme() {
        return this.getItem(STORAGE_KEYS.THEME, null);
    }

    static setTheme(theme) {
        return this.setItem(STORAGE_KEYS.THEME, theme);
    }

    static getProducts() {
        return this.getItem(STORAGE_KEYS.PRODUCTS, []);
    }

    static setProducts(products) {
        return this.setItem(STORAGE_KEYS.PRODUCTS, products);
    }

    static getCart() {
        const raw = this.getItem(STORAGE_KEYS.CART, []);
        return Array.isArray(raw) ? raw : [];
    }

    static setCart(cart) {
        return this.setItem(STORAGE_KEYS.CART, cart);
    }

    static getOrders() {
        const orders = this.getItem(STORAGE_KEYS.ORDERS, []);
        return Array.isArray(orders) ? orders : [];
    }

    static setOrders(orders) {
        return this.setItem(STORAGE_KEYS.ORDERS, Array.isArray(orders) ? orders : []);
    }

    static saveOrder(order) {
        const orders = this.getOrders();
        orders.unshift(order);
        return this.setItem(STORAGE_KEYS.ORDERS, orders);
    }

    static deleteOrder(orderId) {
        const orders = this.getOrders().filter(o => o.id !== orderId);
        return this.setOrders(orders);
    }

    static updateOrderStatus(orderId, newStatus) {
        const orders = this.getOrders();
        const target = orders.find(o => o.id === orderId);
        if (target) {
            target.status = newStatus;
            target.updatedAt = new Date().toISOString();
            return this.setOrders(orders);
        }
        return false;
    }

    /* Dynamic Site Settings */
    static getSettings() {
        return this.getItem(STORAGE_KEYS.SETTINGS, null);
    }

    static setSettings(settings) {
        return this.setItem(STORAGE_KEYS.SETTINGS, settings);
    }

    /* Dynamic Shipping Configurations */
    static getShippingRates() {
        return this.getItem(STORAGE_KEYS.SHIPPING_RATES, null);
    }

    static setShippingRates(rates) {
        return this.setItem(STORAGE_KEYS.SHIPPING_RATES, rates);
    }

    static getWilayaZones() {
        return this.getItem(STORAGE_KEYS.WILAYA_ZONES, null);
    }

    static setWilayaZones(zones) {
        return this.setItem(STORAGE_KEYS.WILAYA_ZONES, zones);
    }

    static getFreeShippingThreshold() {
        const val = this.getItem(STORAGE_KEYS.FREE_SHIPPING_THRESHOLD, null);
        return (typeof val === 'number' && val >= 0) ? val : null;
    }

    static setFreeShippingThreshold(threshold) {
        const num = Math.max(0, parseInt(threshold, 10) || 0);
        return this.setItem(STORAGE_KEYS.FREE_SHIPPING_THRESHOLD, num);
    }

    /**
     * Retrieve all managed Zirox storage keys and values for backup / usage inspection
     * @returns {Record<string, any>}
     */
    static getAllKeys() {
        const data = {};
        Object.values(STORAGE_KEYS).forEach(k => {
            data[k] = this.getItem(k, null);
        });
        return data;
    }
}
