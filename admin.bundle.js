(() => {
  // storage.js
  var STORAGE_KEYS = Object.freeze({
    LANG: "zirox_lang",
    PRODUCTS: "products",
    CART: "cart",
    ORDERS: "orders",
    THEME: "theme",
    SETTINGS: "zirox_site_settings",
    SHIPPING_RATES: "zirox_shipping_rates",
    WILAYA_ZONES: "zirox_wilaya_zones",
    FREE_SHIPPING_THRESHOLD: "zirox_free_shipping_threshold"
  });
  var StorageService = class {
    /**
     * Check if localStorage is supported and accessible
     * @returns {boolean}
     */
    static isAvailable() {
      try {
        const testKey = "__zirox_test__";
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
        if (raw === null || raw === void 0) return fallbackValue;
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
    static getLanguage(defaultLang = "ar") {
      const stored = this.getItem(STORAGE_KEYS.LANG, defaultLang);
      return typeof stored === "string" ? stored : defaultLang;
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
      const orders = this.getOrders().filter((o) => o.id !== orderId);
      return this.setOrders(orders);
    }
    static updateOrderStatus(orderId, newStatus) {
      const orders = this.getOrders();
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        target.status = newStatus;
        target.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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
      return typeof val === "number" && val >= 0 ? val : null;
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
      Object.values(STORAGE_KEYS).forEach((k) => {
        data[k] = this.getItem(k, null);
      });
      return data;
    }
  };

  // security.js
  var HTML_ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
  };
  function escapeHTML(input) {
    if (input === null || input === void 0) return "";
    return String(input).replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match] || match);
  }
  function sanitizeURL(url, fallback = "assets/product-image.png") {
    if (!url || typeof url !== "string") return fallback;
    const trimmed = url.trim();
    if (trimmed.startsWith("https://") || trimmed.startsWith("assets/") || trimmed.startsWith("./assets/") || trimmed.startsWith("/assets/") || trimmed.startsWith("mailto:") || trimmed.startsWith("https://wa.me/")) {
      return escapeHTML(trimmed);
    }
    return fallback;
  }
  function isValidProduct(p) {
    if (!p || typeof p !== "object") return false;
    if (typeof p.id !== "string" || !/^[a-zA-Z0-9_\-]{1,64}$/.test(p.id)) return false;
    const nameStr = typeof p.name === "object" && p.name !== null ? p.name.ar || p.name.en || p.name.fr || "" : typeof p.name === "string" ? p.name : "";
    if (typeof nameStr !== "string" || nameStr.length < 2 || nameStr.length > 300) return false;
    const price = Number(p.price);
    if (!Number.isFinite(price) || price < 0 || price > 1e7) return false;
    return true;
  }
  function safePrice(value, { min = 0, max = 1e7 } = {}) {
    const n = Math.trunc(Number(value));
    if (!Number.isFinite(n)) return 0;
    return Math.min(max, Math.max(min, n));
  }

  // products.js
  var INITIAL_SEED_PRODUCTS = Object.freeze([
    {
      id: "prod_1",
      categoryKey: "electronics",
      name: {
        ar: "\u0633\u0645\u0627\u0639\u0627\u062A \u0633\u0648\u0646\u064A WH-1000XM5 \u0627\u0644\u0644\u0627\u0633\u0644\u0643\u064A\u0629 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629",
        fr: "Casque sans fil Sony WH-1000XM5 Premium",
        en: "Sony WH-1000XM5 Wireless Headphones"
      },
      category: {
        ar: "\u0635\u0648\u062A\u064A\u0627\u062A \u0648\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
        fr: "\xC9lectronique & Audio",
        en: "Electronics"
      },
      price: 36e3,
      oldPrice: 42e3,
      badge: {
        ar: "\u0627\u0644\u0623\u0643\u062B\u0631 \u0645\u0628\u064A\u0639\u0627\u064B",
        fr: "Best-seller",
        en: "BESTSELLER"
      },
      rating: 4.9,
      reviewsCount: 68,
      stock: 12,
      image: "assets/sony-wh1000xm5.png",
      gallery: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u0639\u0632\u0644 \u0636\u0648\u0636\u0627\u0621 \u0631\u0627\u0626\u062F \u0645\u0639 8 \u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646\u0627\u062A \u0648\u0645\u062D\u0633\u0646 \u062A\u0644\u0642\u0627\u0626\u064A \u0648\u0645\u0639\u0627\u0644\u062C\u064A\u0646 \u0645\u062E\u0635\u0635\u064A\u0646.",
        fr: "R\xE9duction de bruit exceptionnelle avec 8 microphones et optimisation automatique.",
        en: "Industry-leading noise canceling with 8 microphones & Auto NC Optimizer."
      },
      description: {
        ar: "\u0639\u0634 \u062A\u062C\u0631\u0628\u0629 \u063A\u064A\u0631 \u0645\u0633\u0628\u0648\u0642\u0629 \u0645\u0646 \u0627\u0644\u0646\u0642\u0627\u0621 \u0648\u0627\u0644\u0647\u062F\u0648\u0621 \u0627\u0644\u0645\u0637\u0644\u0642. \u064A\u062A\u062D\u0643\u0645 \u0645\u0639\u0627\u0644\u062C\u0627\u0646 \u0645\u062A\u062E\u0635\u0635\u0627\u0646 \u0641\u064A 8 \u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646\u0627\u062A \u0644\u0639\u0632\u0644 \u0636\u0648\u0636\u0627\u0626\u064A \u0644\u0627 \u0645\u062B\u064A\u0644 \u0644\u0647. \u0628\u0637\u0627\u0631\u064A\u0629 \u062A\u062F\u0648\u0645 30 \u0633\u0627\u0639\u0629 \u0645\u0639 \u0634\u062D\u0646 \u0641\u0627\u0626\u0642 \u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u0645\u0639\u0627\u064A\u0646\u0629 \u0645\u0636\u0645\u0648\u0646\u0629 \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639.",
        fr: "D\xE9couvrez un nouveau niveau de silence et de puret\xE9 sonore. Deux processeurs contr\xF4lent 8 microphones pour une r\xE9duction de bruit sans pr\xE9c\xE9dent. Autonomie de 30 heures avec charge ultra-rapide.",
        en: "Experience a new level of silence and sound quality. Two processors control 8 microphones for unprecedented noise cancellation. 30-hour battery life with quick charging."
      },
      specs: {
        ar: {
          "\u0639\u0645\u0631 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629": "30 \u0633\u0627\u0639\u0629 (\u0645\u0639 \u0627\u0644\u0639\u0632\u0644)",
          "\u0627\u0644\u0627\u062A\u0635\u0627\u0644": "\u0628\u0644\u0648\u062A\u0648\u062B 5.2 / LDAC",
          "\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646\u0627\u062A": "8 \u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646\u0627\u062A \u0645\u062F\u0645\u062C\u0629",
          "\u0627\u0644\u0636\u0645\u0627\u0646": "12 \u0634\u0647\u0631\u0627\u064B \u0631\u0633\u0645\u064A \u0645\u0639\u062A\u0645\u062F"
        },
        fr: {
          "Autonomie": "30 Heures (ANC activ\xE9)",
          "Connectivit\xE9": "Bluetooth 5.2 / LDAC",
          "Microphones": "8 micros int\xE9gr\xE9s",
          "Garantie": "12 Mois Officielle"
        },
        en: {
          "Battery Life": "30 Hours (ANC On)",
          "Connectivity": "Bluetooth 5.2 / LDAC",
          "Microphones": "8 Built-in beamforming mics",
          "Warranty": "12 Months Official"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 2).toISOString()
    },
    {
      id: "prod_2",
      categoryKey: "electronics",
      name: {
        ar: "\u0633\u0627\u0639\u0629 \u0622\u0628\u0644 \u0627\u0644\u062A\u0631\u0627 2 \u0647\u064A\u0643\u0644 \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 \u0641\u0627\u062E\u0631",
        fr: "Apple Watch Ultra 2 Bo\xEEtier Titane",
        en: "Apple Watch Ultra 2 Titanium Case"
      },
      category: {
        ar: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0648\u0633\u0627\u0639\u0627\u062A \u0630\u0643\u064A\u0629",
        fr: "\xC9lectronique & Montres",
        en: "Electronics"
      },
      price: 84e3,
      oldPrice: 94e3,
      badge: {
        ar: "\u0625\u0635\u062F\u0627\u0631 \u062C\u062F\u064A\u062F",
        fr: "Nouveaut\xE9",
        en: "NEW"
      },
      rating: 5,
      reviewsCount: 42,
      stock: 4,
      image: "assets/apple-watch-ultra.png",
      gallery: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u0647\u064A\u0643\u0644 \u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 49 \u0645\u0645 \u0645\u062A\u064A\u0646\u060C \u0646\u0638\u0627\u0645 GPS \u062F\u0642\u064A\u0642 \u0645\u0632\u062F\u0648\u062C \u0627\u0644\u062A\u0631\u062F\u062F \u0648\u0628\u0637\u0627\u0631\u064A\u0629 \u062A\u062F\u0648\u0645 \u062D\u062A\u0649 72 \u0633\u0627\u0639\u0629.",
        fr: "Bo\xEEtier en titane de 49 mm, GPS double fr\xE9quence haute pr\xE9cision et autonomie jusqu'\xE0 72h.",
        en: "Rugged 49mm titanium case, precision dual-frequency GPS & 36h battery."
      },
      description: {
        ar: "\u0623\u0642\u0648\u0649 \u0633\u0627\u0639\u0627\u062A \u0622\u0628\u0644 \u0648\u0623\u0643\u062B\u0631\u0647\u0627 \u0642\u062F\u0631\u0629 \u0644\u0644\u0645\u063A\u0627\u0645\u0631\u0627\u062A \u0648\u0627\u0644\u0631\u064A\u0627\u0636\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629. \u0645\u0632\u0648\u062F\u0629 \u0628\u0634\u0631\u064A\u062D\u0629 S9 SiP \u0648\u0634\u0627\u0634\u0629 \u0631\u064A\u062A\u064A\u0646\u0627 \u0627\u0644\u0623\u0643\u062B\u0631 \u0633\u0637\u0648\u0639\u0627\u064B \u0648\u0645\u0642\u0627\u0648\u0645\u0629 \u0644\u0644\u0645\u0627\u0621 \u062D\u062A\u0649 \u0639\u0645\u0642 100 \u0645\u062A\u0631.",
        fr: "La montre Apple la plus robuste repousse les limites. Dot\xE9e de la puce S9 SiP, du nouvel \xE9cran Retina ultra-lumineux et d'une \xE9tanch\xE9it\xE9 jusqu'\xE0 100 m.",
        en: "The most rugged and capable Apple Watch pushes the limits again. Featuring the all-new S9 SiP, the brightest Apple display ever, and precision dual-frequency GPS."
      },
      specs: {
        ar: {
          "\u0645\u0627\u062F\u0629 \u0627\u0644\u0647\u064A\u0643\u0644": "\u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645 \u0641\u0626\u0629 \u0627\u0644\u0637\u064A\u0631\u0627\u0646 \u0648\u0627\u0644\u0641\u0636\u0627\u0621",
          "\u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0645\u0627\u0621": "100 \u0645\u062A\u0631 (\u063A\u0648\u0635 \u0648\u0633\u0628\u0627\u062D\u0629)",
          "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629": "36 \u0633\u0627\u0639\u0629 \u0642\u064A\u0627\u0633\u064A / 72 \u0633\u0627\u0639\u0629 \u062A\u0648\u0641\u064A\u0631",
          "\u0627\u0644\u0634\u0627\u0634\u0629": "\u0634\u0627\u0634\u0629 \u0631\u064A\u062A\u064A\u0646\u0627 3000 \u0634\u0645\u0639\u0629"
        },
        fr: {
          "Bo\xEEtier": "Titane de qualit\xE9 a\xE9rospatiale",
          "\xC9tanch\xE9it\xE9": "100 m (Plong\xE9e & Natation)",
          "Autonomie": "Jusqu'\xE0 36h standard / 72h \xE9co",
          "\xC9cran": "Retina Always-On 3000 nits"
        },
        en: {
          "Case Material": "Aerospace-Grade Titanium",
          "Water Resistance": "100m (Swim & Dive ready)",
          "Battery": "Up to 36 Hours standard / 72h low power",
          "Display": "3000 nits Always-On Retina"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 4).toISOString()
    },
    {
      id: "prod_3",
      categoryKey: "fashion",
      name: {
        ar: "\u062D\u0630\u0627\u0621 \u0646\u0627\u064A\u0643\u064A \u0627\u064A\u0631 \u0641\u0648\u0631\u0633 1 \u201807 \u0623\u0628\u064A\u0636 \u0646\u0627\u0635\u0639",
        fr: "Nike Air Force 1 \u201807 Triple White",
        en: "Nike Air Force 1 \u201807 Triple White"
      },
      category: {
        ar: "\u0623\u0632\u064A\u0627\u0621 \u0648\u0623\u062D\u0630\u064A\u0629",
        fr: "Mode & Chaussures",
        en: "Fashion"
      },
      price: 16500,
      oldPrice: 19800,
      badge: {
        ar: "\u062A\u062E\u0641\u064A\u0636 20%",
        fr: "-20%",
        en: "-20%"
      },
      rating: 4.8,
      reviewsCount: 115,
      stock: 18,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u062A\u0635\u0645\u064A\u0645 \u0623\u064A\u0642\u0648\u0646\u064A \u0643\u0644\u0627\u0633\u064A\u0643\u064A \u0645\u0646 \u0627\u0644\u062C\u0644\u062F \u0627\u0644\u0637\u0628\u064A\u0639\u064A \u0627\u0644\u0645\u062E\u064A\u0637 \u0648\u0648\u0633\u0627\u062F\u0629 \u0646\u0627\u064A\u0643\u064A \u0627\u0644\u0647\u0648\u0627\u0626\u064A\u0629 \u0627\u0644\u0645\u0631\u064A\u062D\u0629.",
        fr: "Silhouette embl\xE9matique en cuir cousu et amorti l\xE9gendaire Nike Air.",
        en: "Timeless silhouette crafted from crisp stitched leather and Nike Air cushioning."
      },
      description: {
        ar: "\u064A\u0648\u0627\u0635\u0644 \u062D\u0630\u0627\u0621 \u0646\u0627\u064A\u0643\u064A \u0625\u064A\u0631 \u0641\u0648\u0631\u0633 1 \u062A\u0623\u0644\u0642\u0647 \u0628\u0623\u0633\u0644\u0648\u0628\u0647 \u0627\u0644\u062E\u0627\u0644\u062F\u060C \u062E\u0627\u0645\u0627\u062A \u062C\u0644\u062F\u064A\u0629 \u0623\u0635\u0644\u064A\u0629 \u0648\u0644\u0645\u0633\u0627\u062A \u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0646\u0642\u064A\u0629 \u0645\u0639 \u0645\u062A\u0627\u0646\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0637\u0644\u0627\u0644\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629.",
        fr: "Le classique ind\xE9modable du streetwear : cuir pleine fleur impeccable, finitions soign\xE9es et amorti Nike Air pour un confort absolu tout au long de la journ\xE9e.",
        en: "The radiance lives on in the Nike Air Force 1 \u201907, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold details and the perfect amount of flash."
      },
      specs: {
        ar: {
          "\u0627\u0644\u062E\u0627\u0645\u0629 \u0627\u0644\u0639\u0644\u0648\u064A\u0629": "\u062C\u0644\u062F \u0637\u0628\u064A\u0639\u064A \u0646\u0642\u064A 100% \u0645\u062E\u064A\u0637",
          "\u0627\u0644\u0646\u0639\u0644": "\u0645\u0637\u0627\u0637 \u0645\u062A\u064A\u0646 \u0645\u0627\u0646\u0639 \u0644\u0644\u0627\u0646\u0632\u0644\u0627\u0642",
          "\u0648\u0633\u0627\u062F\u0629 \u0627\u0644\u0642\u062F\u0645": "\u0648\u062D\u062F\u0629 Nike Air \u0627\u0644\u0645\u062F\u0645\u062C\u0629",
          "\u0627\u0644\u0645\u0642\u0627\u0633": "\u0645\u0637\u0627\u0628\u0642 \u0644\u0644\u0642\u064A\u0627\u0633 \u0627\u0644\u0642\u064A\u0627\u0633\u064A"
        },
        fr: {
          "Tige": "100% Cuir v\xE9ritable cousu",
          "Semelle": "Caoutchouc anti-trace r\xE9sistant",
          "Amorti": "Unit\xE9 Nike Air encapsul\xE9e",
          "Pointure": "Fid\xE8le \xE0 la taille"
        },
        en: {
          "Upper Material": "100% Genuine Stitched Leather",
          "Sole": "Non-marking rubber outsole",
          "Cushioning": "Nike Air Encapsulated Unit",
          "Fit": "True to size"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 6).toISOString()
    },
    {
      id: "prod_4",
      categoryKey: "fashion",
      name: {
        ar: "\u0639\u0637\u0631 \u062F\u064A\u0648\u0631 \u0633\u0648\u0641\u0627\u062C \u0625\u0643\u0633\u064A\u0631 \u0627\u0644\u0641\u0627\u062E\u0631 (60 \u0645\u0644)",
        fr: "Parfum de Luxe Dior Sauvage Elixir (60ml)",
        en: "Dior Sauvage Elixir Luxury Perfume (60ml)"
      },
      category: {
        ar: "\u0623\u0632\u064A\u0627\u0621 \u0648\u0639\u0637\u0648\u0631 \u0641\u0627\u062E\u0631\u0629",
        fr: "Mode & Parfumerie",
        en: "Fashion"
      },
      price: 21500,
      oldPrice: 25e3,
      badge: {
        ar: "\u0627\u0644\u0623\u0643\u062B\u0631 \u0637\u0644\u0628\u0627\u064B",
        fr: "Tendance",
        en: "HOT"
      },
      rating: 4.9,
      reviewsCount: 89,
      stock: 3,
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u0639\u0637\u0631 \u0630\u0648 \u062A\u0631\u0643\u064A\u0632 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A \u063A\u0646\u064A \u0628\u0627\u0646\u062A\u0639\u0627\u0634 \u0633\u0648\u0641\u0627\u062C \u0627\u0644\u0623\u064A\u0642\u0648\u0646\u064A \u0648\u062A\u0648\u0627\u0628\u0644 \u062F\u0627\u0641\u0626\u0629 \u0622\u0633\u0631\u0629.",
        fr: "Une fragrance d'une concentration extraordinaire impr\xE9gn\xE9e de la fra\xEEcheur iconique de Sauvage.",
        en: "An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage."
      },
      description: {
        ar: "\u0633\u0648\u0641\u0627\u062C \u0625\u0643\u0633\u064A\u0631 \u0647\u0648 \u0639\u0637\u0631 \u0628\u062A\u0631\u0643\u064A\u0632 \u063A\u064A\u0631 \u0645\u0633\u0628\u0648\u0642 \u064A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0646\u062A\u0639\u0627\u0634 \u0633\u0648\u0641\u0627\u062C \u0627\u0644\u0634\u0647\u064A\u0631 \u0648\u0642\u0644\u0628 \u0622\u0633\u0631 \u0645\u0646 \u0627\u0644\u062A\u0648\u0627\u0628\u0644 \u0627\u0644\u0641\u0627\u062E\u0631\u0629\u060C \u0648\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u0644\u0627\u0641\u0646\u062F\u0631 \u0627\u0644\u062D\u0635\u0631\u064A\u0629\u060C \u0645\u0639 \u062E\u0634\u0628 \u0627\u0644\u0635\u0646\u062F\u0644 \u0627\u0644\u062F\u0627\u0641\u0626. \u062B\u0628\u0627\u062A \u064A\u062F\u0648\u0645 \u0637\u0648\u064A\u0644\u0627\u064B.",
        fr: "Sauvage Elixir est un parfum d'une concentration unique o\xF9 la fra\xEEcheur embl\xE9matique rencontre un c\u0153ur d'\xE9pices enivrantes, une essence de lavande sur mesure et des bois riches.",
        en: "Sauvage Elixir is an extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage with an intoxicating heart of spices and rich woods."
      },
      specs: {
        ar: {
          "\u0627\u0644\u062A\u0631\u0643\u064A\u0632": "\u0625\u0643\u0633\u064A\u0631 / \u0639\u0637\u0631 \u062E\u0627\u0644\u0635 (Pure Parfum)",
          "\u0627\u0644\u062D\u062C\u0645": "60 \u0645\u0644 \u0623\u0635\u0644\u064A \u0645\u0639\u062A\u0645\u062F",
          "\u062F\u0631\u062C\u0629 \u0627\u0644\u062B\u0628\u0627\u062A": "\u0623\u0643\u062B\u0631 \u0645\u0646 16 \u0633\u0627\u0639\u0629 \u0645\u062A\u0648\u0627\u0635\u0644\u0629",
          "\u0627\u0644\u0645\u0646\u0634\u0623": "\u0635\u0646\u0639 \u0641\u064A \u0641\u0631\u0646\u0633\u0627 (Made in France)"
        },
        fr: {
          "Concentration": "\xC9lixir / Pur Parfum",
          "Volume": "60 ml officiel scell\xE9",
          "Tenue": "Sup\xE9rieure \xE0 16 heures",
          "Origine": "Fabriqu\xE9 en France"
        },
        en: {
          "Concentration": "Elixir / Pure Parfum",
          "Volume": "60 ml / 2.0 fl.oz",
          "Longevity": "Over 16+ Hours",
          "Origin": "Made in France"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 8).toISOString()
    },
    {
      id: "prod_5",
      categoryKey: "electronics",
      name: {
        ar: "\u0644\u0648\u062D\u0629 \u0645\u0641\u0627\u062A\u064A\u062D \u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0643\u064A\u062A\u0634\u0631\u0648\u0646 Q1 Pro \u0627\u0644\u0644\u0627\u0633\u0644\u0643\u064A\u0629",
        fr: "Clavier M\xE9canique Sans Fil Keychron Q1 Pro",
        en: "Keychron Q1 Pro Wireless Mechanical Keyboard"
      },
      category: {
        ar: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0648\u0627\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u062D\u0627\u0633\u0648\u0628",
        fr: "\xC9lectronique & Informatique",
        en: "Electronics"
      },
      price: 24500,
      oldPrice: 28e3,
      badge: {
        ar: "\u0631\u0627\u0626\u062C",
        fr: "Populaire",
        en: "POPULAR"
      },
      rating: 4.9,
      reviewsCount: 34,
      stock: 7,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u0647\u064A\u0643\u0644 \u0623\u0644\u0648\u0645\u0646\u064A\u0648\u0645 CNC \u0643\u0627\u0645\u0644\u060C \u0645\u0641\u0627\u062A\u064A\u062D \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0648\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0628\u0631\u0645\u062C\u0629 \u0628\u0640 QMK/VIA.",
        fr: "Ch\xE2ssis en aluminium CNC, commutateurs rempla\xE7ables \xE0 chaud et enti\xE8rement programmable via QMK/VIA.",
        en: "Full CNC aluminum body, hot-swappable switches and QMK/VIA programmable."
      },
      description: {
        ar: "\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0627\u0644\u0645\u0635\u0646\u0648\u0639\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0646 \u0627\u0644\u0623\u0644\u0645\u0646\u064A\u0648\u0645 \u0627\u0644\u0645\u0635\u0642\u0648\u0644 \u0648\u0627\u0644\u0645\u0632\u0648\u062F\u0629 \u0628\u0628\u0644\u0648\u062A\u0648\u062B 5.1 \u0648\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u062D\u0634\u064A\u0629 \u0627\u0644\u0645\u0632\u062F\u0648\u062C\u0629 \u0627\u0644\u0639\u0627\u0632\u0644\u0629 \u0644\u0644\u0635\u0648\u062A \u0644\u062A\u062C\u0631\u0628\u0629 \u0643\u062A\u0627\u0628\u0629 \u0646\u0627\u0639\u0645\u0629 \u0648\u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0631\u0642\u064A.",
        fr: "Le Keychron Q1 Pro est un clavier m\xE9canique sans fil d'exception enti\xE8rement en aluminium CNC avec Bluetooth 5.1, conception \xE0 double joint et r\xE9tro\xE9clairage RVB orient\xE9 sud.",
        en: "Meet the Keychron Q1 Pro, an all-metal wireless custom mechanical keyboard upgraded with Bluetooth 5.1, double-gasket design, and South-facing RGB lighting."
      },
      specs: {
        ar: {
          "\u0627\u0644\u0647\u064A\u0643\u0644": "\u0623\u0644\u0648\u0645\u0646\u064A\u0648\u0645 6063 CNC \u0628\u0627\u0644\u0643\u0627\u0645\u0644",
          "\u0627\u0644\u0627\u062A\u0635\u0627\u0644": "\u0628\u0644\u0648\u062A\u0648\u062B 5.1 \u0648\u0633\u0644\u0643\u064A Type-C",
          "\u0646\u0648\u0639 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D": "Gateron Jupiter Brown (\u062A\u0628\u062F\u064A\u0644 \u0633\u0631\u064A\u0639)",
          "\u0627\u0644\u062A\u0648\u0627\u0641\u0642": "macOS / Windows / Linux"
        },
        fr: {
          "Ch\xE2ssis": "100% Aluminium 6063 CNC",
          "Connectivit\xE9": "Bluetooth 5.1 & C\xE2ble Type-C",
          "Switches": "Gateron Jupiter Brown (Hot-swap)",
          "Compatibilit\xE9": "macOS / Windows / Linux"
        },
        en: {
          "Body": "Full CNC 6063 Aluminum",
          "Connectivity": "Bluetooth 5.1 & Type-C Wired",
          "Switch Type": "Gateron Jupiter Brown (Hot-swappable)",
          "Compatibility": "macOS / Windows / Linux"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 10).toISOString()
    },
    {
      id: "prod_6",
      categoryKey: "fashion",
      name: {
        ar: "\u0646\u0638\u0627\u0631\u0627\u062A \u0631\u064A\u0628\u0627\u0646 \u0623\u0641\u064A\u0627\u062A\u0648\u0631 \u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0637\u0628\u0629",
        fr: "Lunettes de Soleil Ray-Ban Aviator Classic Polaris\xE9es",
        en: "Ray-Ban Aviator Classic Polarized"
      },
      category: {
        ar: "\u0623\u0632\u064A\u0627\u0621 \u0648\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
        fr: "Mode & Accessoires",
        en: "Fashion"
      },
      price: 15500,
      oldPrice: 18e3,
      badge: {
        ar: "\u0643\u0644\u0627\u0633\u064A\u0643\u064A",
        fr: "Classique",
        en: "CLASSIC"
      },
      rating: 4.8,
      reviewsCount: 57,
      stock: 5,
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u0625\u0637\u0627\u0631 \u062F\u0645\u0639\u064A \u0645\u0639\u062F\u0646\u064A \u0645\u0630\u0647\u0628 \u0643\u0644\u0627\u0633\u064A\u0643\u064A \u0645\u0639 \u0639\u062F\u0633\u0627\u062A \u0643\u0631\u064A\u0633\u062A\u0627\u0644 \u062E\u0636\u0631\u0627\u0621 G-15 \u0645\u0627\u0646\u0639\u0629 \u0644\u0644\u062A\u0648\u0647\u062C.",
        fr: "Monture m\xE9tallique dor\xE9e embl\xE9matique avec verres min\xE9raux verts G-15 polaris\xE9s.",
        en: "Timeless teardrop frame with crystal green G-15 polarized anti-glare lenses."
      },
      description: {
        ar: "\u062A\u0639\u062F \u0646\u0638\u0627\u0631\u0627\u062A \u0631\u064A\u0628\u0627\u0646 \u0623\u0641\u064A\u0627\u062A\u0648\u0631 \u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0623\u0643\u062B\u0631 \u0634\u0647\u0631\u0629 \u0641\u064A \u0627\u0644\u0639\u0627\u0644\u0645\u060C \u0635\u064F\u0645\u0645\u062A \u0623\u0635\u0644\u0627\u064B \u0644\u0644\u0637\u064A\u0627\u0631\u064A\u0646 \u0641\u064A \u0639\u0627\u0645 1937 \u0648\u062A\u062C\u0645\u0639 \u0627\u0644\u064A\u0648\u0645 \u0628\u064A\u0646 \u0627\u0644\u0623\u0646\u0627\u0642\u0629 \u0627\u0644\u0631\u0641\u064A\u0639\u0629 \u0648\u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0628\u0635\u0631\u064A \u0627\u0644\u0645\u0631\u064A\u062D \u0648\u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0645\u0646 \u0627\u0644\u0623\u0634\u0639\u0629 \u0641\u0648\u0642 \u0627\u0644\u0628\u0646\u0641\u0633\u062C\u064A\u0629.",
        fr: "Mod\xE8le le plus embl\xE9matique au monde, la Ray-Ban Aviator combine allure intemporelle, verres polaris\xE9s haute performance et protection 100% UV400 pour un confort visuel exceptionnel.",
        en: "Currently one of the most iconic sunglass models in the world, Ray-Ban Aviator Classic combines great styling with exceptional quality and comfort."
      },
      specs: {
        ar: {
          "\u0627\u0644\u0625\u0637\u0627\u0631": "\u0645\u0639\u062F\u0646 \u0630\u0647\u0628\u064A \u0645\u0635\u0642\u0648\u0644 \u0645\u062A\u064A\u0646",
          "\u0627\u0644\u0639\u062F\u0633\u0627\u062A": "\u0643\u0631\u064A\u0633\u062A\u0627\u0644 \u0623\u062E\u0636\u0631 G-15 \u0645\u0633\u062A\u0642\u0637\u0628",
          "\u0627\u0644\u062D\u0645\u0627\u064A\u0629": "\u062D\u0645\u0627\u064A\u0629 \u0643\u0627\u0645\u0644\u0629 100% UV400",
          "\u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A": "\u062D\u0627\u0641\u0638\u0629 \u062C\u0644\u062F\u064A\u0629 \u0623\u0635\u0644\u064A\u0629 \u0648\u0642\u0637\u0639\u0629 \u062A\u0646\u0638\u064A\u0641"
        },
        fr: {
          "Monture": "M\xE9tal dor\xE9 poli haute qualit\xE9",
          "Verres": "Verts classiques G-15 polaris\xE9s",
          "Protection": "100% Protection UV400",
          "Packaging": "\xC9tui cuir d'origine et chiffonnette"
        },
        en: {
          "Frame": "Polished Gold Metal",
          "Lens": "Green Classic G-15 Polarized",
          "UV Protection": "100% UV400 Protection",
          "Package": "Original Leather Case & Cloth"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 12).toISOString()
    },
    {
      id: "prod_7",
      categoryKey: "home",
      name: {
        ar: "\u0645\u0627\u0643\u064A\u0646\u0629 \u0642\u0647\u0648\u0629 \u0646\u0633\u0628\u0631\u064A\u0633\u0648 \u0641\u064A\u0631\u062A\u0648 \u0646\u064A\u0643\u0633\u062A \u0627\u0644\u0623\u0648\u062A\u0648\u0645\u0627\u062A\u064A\u0643\u064A\u0629",
        fr: "Machine \xE0 Caf\xE9 Nespresso Vertuo Next",
        en: "Nespresso Vertuo Next Coffee Machine"
      },
      category: {
        ar: "\u0627\u0644\u0645\u0646\u0632\u0644 \u0627\u0644\u0631\u0627\u0642\u064A \u0648\u0627\u0644\u0645\u0637\u0628\u062E",
        fr: "Maison & Cuisine",
        en: "Home"
      },
      price: 27500,
      oldPrice: 32e3,
      badge: {
        ar: "\u0639\u0631\u0636 \u062E\u0627\u0635",
        fr: "En Promo",
        en: "SALE"
      },
      rating: 4.7,
      reviewsCount: 46,
      stock: 9,
      image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u062A\u0642\u0646\u064A\u0629 \u0627\u0644\u0627\u0633\u062A\u062E\u0644\u0627\u0635 \u0627\u0644\u062F\u0648\u0631\u0627\u0646\u064A Centrifusion \u0645\u0639 \u062A\u062D\u0636\u064A\u0631 \u0628\u0632\u0631 \u0648\u0627\u062D\u062F \u0644\u0640 5 \u0623\u062D\u062C\u0627\u0645 \u0623\u0643\u0648\u0627\u0628 \u0645\u062E\u062A\u0644\u0641\u0629.",
        fr: "Technologie d'extraction Centrifusion avec pr\xE9paration en une touche pour 5 tailles de tasses.",
        en: "Centrifusion extraction technology with one-touch brewing for 5 cup sizes."
      },
      description: {
        ar: "\u0645\u0627\u0643\u064A\u0646\u0629 \u0641\u064A\u0631\u062A\u0648 \u0646\u064A\u0643\u0633\u062A \u062A\u0631\u062A\u0642\u064A \u0628\u062A\u062C\u0631\u0628\u0629 \u0642\u0647\u0648\u0629 \u0646\u0633\u0628\u0631\u064A\u0633\u0648 \u0625\u0644\u0649 \u0623\u0641\u0642 \u062C\u062F\u064A\u062F. \u062A\u0642\u0631\u0623 \u0627\u0644\u0645\u0627\u0643\u064A\u0646\u0629 \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0634\u0631\u064A\u0637\u064A \u0644\u0644\u0643\u0628\u0633\u0648\u0644\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0644\u0636\u0628\u0637 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0645\u062B\u0627\u0644\u064A\u0629 \u0648\u062A\u0642\u062F\u064A\u0645 \u0642\u0648\u0627\u0645 \u0643\u0631\u064A\u0645\u064A \u063A\u0646\u064A \u0628\u0646\u0642\u0631\u0629 \u0632\u0631 \u0648\u0627\u062D\u062F\u0629.",
        fr: "Vertuo Next r\xE9invente la d\xE9gustation du caf\xE9 Nespresso. Elle lit le code-barres de chaque capsule pour adapter automatiquement la temp\xE9rature et l'infusion afin de r\xE9v\xE9ler tous les ar\xF4mes.",
        en: "Vertuo Next takes the full range of Nespresso coffee styles even further. The machine reads the barcode integrated in each capsule to offer you its hidden treasures at the touch of a button."
      },
      specs: {
        ar: {
          "\u062E\u0632\u0627\u0646 \u0627\u0644\u0645\u064A\u0627\u0647": "1.1 \u0644\u062A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u0641\u0643",
          "\u0632\u0645\u0646 \u0627\u0644\u062A\u0633\u062E\u064A\u0646": "30 \u062B\u0627\u0646\u064A\u0629 \u0641\u0642\u0637",
          "\u0623\u062D\u062C\u0627\u0645 \u0627\u0644\u0642\u0647\u0648\u0629": "\u0625\u0633\u0628\u0631\u064A\u0633\u0648\u060C \u062F\u0628\u0644\u060C \u063A\u0631\u0627\u0646 \u0644\u0648\u0646\u063A\u0648\u060C \u0645\u0648\u063A\u060C \u0623\u0644\u062A\u0648",
          "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644": "\u0623\u0648\u062A\u0648\u0645\u0627\u062A\u064A\u0643\u064A \u0628\u0639\u062F \u062F\u0642\u064A\u0642\u062A\u064A\u0646"
        },
        fr: {
          "R\xE9servoir d'eau": "1,1 Litre amovible",
          "Temps de chauffe": "30 Secondes",
          "Tailles de tasse": "Espresso, Double, Gran Lungo, Mug, Alto",
          "Arr\xEAt automatique": "Apr\xE8s 2 minutes"
        },
        en: {
          "Water Tank": "1.1 Liters",
          "Heat-up Time": "30 Seconds",
          "Cup Sizes": "Espresso, Double, Gran Lungo, Mug, Alto",
          "Auto-off": "After 2 Minutes of non-use"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 14).toISOString()
    },
    {
      id: "prod_8",
      categoryKey: "health",
      name: {
        ar: "\u0645\u062C\u0641\u0641 \u0634\u0639\u0631 \u062F\u0627\u064A\u0633\u0648\u0646 \u0633\u0648\u0628\u0631\u0633\u0648\u0646\u064A\u0643 \u0627\u0644\u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A",
        fr: "S\xE8che-Cheveux Dyson Supersonic \xC9dition Pro",
        en: "Dyson Supersonic Hair Dryer Pro Edition"
      },
      category: {
        ar: "\u0627\u0644\u0635\u062D\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629",
        fr: "Beaut\xE9 & Soins",
        en: "Health"
      },
      price: 48e3,
      oldPrice: 55e3,
      badge: {
        ar: "\u0627\u0644\u0623\u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645\u0627\u064B",
        fr: "Mieux Not\xE9",
        en: "TOP RATED"
      },
      rating: 4.9,
      reviewsCount: 78,
      stock: 2,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80"
      ],
      shortDesc: {
        ar: "\u062A\u062D\u0643\u0645 \u0630\u0643\u064A \u0641\u064A \u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0644\u062D\u0645\u0627\u064A\u0629 \u0644\u0645\u0639\u0627\u0646 \u0627\u0644\u0634\u0639\u0631 \u0645\u0639 \u0645\u062D\u0631\u0643 \u0631\u0642\u0645\u064A \u0633\u0631\u064A\u0639 V9 \u0648\u062A\u062C\u0641\u064A\u0641 \u0641\u0627\u0626\u0642.",
        fr: "Contr\xF4le intelligent de la chaleur pour pr\xE9server la brillance avec moteur num\xE9rique Dyson V9.",
        en: "Intelligent heat control to protect hair shine with fast drying digital motor V9."
      },
      description: {
        ar: "\u0635\u064F\u0645\u0645 \u0644\u062C\u0645\u064A\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0634\u0639\u0631. \u0628\u0645\u062D\u0631\u0643 \u0631\u0642\u0645\u064A \u0641\u0627\u0626\u0642 \u0627\u0644\u0642\u0648\u0629 \u0648\u0645\u0633\u062A\u0634\u0639\u0631 \u062D\u0631\u0627\u0631\u064A \u064A\u0642\u064A\u0633 \u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0623\u0643\u062B\u0631 \u0645\u0646 40 \u0645\u0631\u0629 \u0641\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0644\u0645\u0646\u0639 \u0623\u0636\u0631\u0627\u0631 \u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0645\u0641\u0631\u0637\u0629 \u0648\u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0644\u0645\u0639\u0627\u0646 \u0627\u0644\u0637\u0628\u064A\u0639\u064A.",
        fr: "Con\xE7u pour tous les types de cheveux. Moteur num\xE9rique puissant pour un s\xE9chage rapide et contr\xF4le intelligent de la chaleur pour pr\xE9server l'\xE9clat naturel de la chevelure.",
        en: "Engineered for different hair types. With a powerful digital motor for fast drying, and intelligent heat control to help protect your shine."
      },
      specs: {
        ar: {
          "\u0627\u0644\u0645\u062D\u0631\u0643": "\u0645\u062D\u0631\u0643 Dyson V9 \u0627\u0644\u0631\u0642\u0645\u064A (110,000 \u062F\u0648\u0631\u0629/\u062F)",
          "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062D\u0631\u0627\u0631\u0629": "4 \u062F\u0631\u062C\u0627\u062A \u062D\u0631\u0627\u0631\u0629 \u062F\u0642\u064A\u0642\u0629 (\u0645\u0646 28\xB0\u0645 \u0625\u0644\u0649 100\xB0\u0645)",
          "\u062A\u062F\u0641\u0642 \u0627\u0644\u0647\u0648\u0627\u0621": "41 \u0644\u062A\u0631 \u0641\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629",
          "\u0627\u0644\u0645\u0644\u062D\u0642\u0627\u062A": "5 \u0631\u0624\u0648\u0633 \u062A\u0635\u0641\u064A\u0641 \u0645\u063A\u0646\u0627\u0637\u064A\u0633\u064A\u0629 \u0645\u062A\u0637\u0648\u0631\u0629"
        },
        fr: {
          "Moteur": "Moteur num\xE9rique Dyson V9 (110 000 tr/min)",
          "R\xE9glages temp\xE9rature": "4 r\xE9glages pr\xE9cis (de 28\xB0C \xE0 100\xB0C)",
          "D\xE9bit d'air": "41 Litres par seconde",
          "Accessoires": "5 embouts de coiffage magn\xE9tiques"
        },
        en: {
          "Motor": "Dyson Digital Motor V9 (110,000 RPM)",
          "Heat Settings": "4 Precise Heat Settings (28\xB0C to 100\xB0C)",
          "Airflow": "41 Liters per second",
          "Attachments": "5 Magnetic styling attachments"
        }
      },
      addedAt: new Date(Date.now() - 864e5 * 16).toISOString()
    }
  ]);
  var ProductAdapter = class {
    /**
     * Get all products
     * @returns {Array<object>|Promise<Array<object>>}
     */
    getAll() {
      throw new Error("getAll() must be implemented by adapter");
    }
    /**
     * Get single product by ID
     * @param {string} id
     * @returns {object|null|Promise<object|null>}
     */
    getById(id) {
      throw new Error("getById(id) must be implemented by adapter");
    }
    /**
     * Save (create or update) a single product
     * @param {object} product
     * @returns {object|Promise<object>}
     */
    save(product) {
      throw new Error("save(product) must be implemented by adapter");
    }
    /**
     * Save an entire collection of products
     * @param {Array<object>} products
     * @returns {Array<object>|Promise<Array<object>>}
     */
    saveAll(products) {
      throw new Error("saveAll(products) must be implemented by adapter");
    }
    /**
     * Delete product by unique ID
     * @param {string} id
     * @returns {boolean|Promise<boolean>}
     */
    delete(id) {
      throw new Error("delete(id) must be implemented by adapter");
    }
    /**
     * Seed catalog initial data
     * @param {Array<object>} initialProducts
     * @returns {Array<object>|Promise<Array<object>>}
     */
    seed(initialProducts) {
      throw new Error("seed(initialProducts) must be implemented by adapter");
    }
  };
  var LocalStorageProductAdapter = class extends ProductAdapter {
    constructor(storageService = StorageService) {
      super();
      this.storage = storageService;
    }
    getAll() {
      const products = this.storage.getProducts();
      if (!Array.isArray(products) || products.length === 0) {
        return this.seed(INITIAL_SEED_PRODUCTS);
      }
      const valid = products.filter(isValidProduct);
      if (valid.length === 0) {
        this.storage.setProducts(INITIAL_SEED_PRODUCTS);
        return [...INITIAL_SEED_PRODUCTS];
      }
      return valid;
    }
    getById(id) {
      if (!id) return null;
      const all = this.getAll();
      return all.find((p) => p.id === id) || null;
    }
    save(product) {
      if (!isValidProduct(product)) {
        throw new Error("Invalid product schema");
      }
      const all = this.getAll();
      const index = all.findIndex((p) => p.id === product.id);
      if (index >= 0) {
        all[index] = product;
      } else {
        all.unshift(product);
      }
      this.storage.setProducts(all);
      return product;
    }
    saveAll(products) {
      const valid = Array.isArray(products) ? products.filter(isValidProduct) : [];
      this.storage.setProducts(valid);
      return valid;
    }
    delete(id) {
      if (!id) return false;
      const all = this.getAll();
      const filtered = all.filter((p) => p.id !== id);
      this.storage.setProducts(filtered);
      return filtered.length < all.length;
    }
    seed(initialProducts) {
      const stored = this.storage.getProducts();
      if (!Array.isArray(stored) || stored.length === 0 || !stored[0]?.stock || !stored[0]?.categoryKey || typeof stored[0]?.name !== "object") {
        this.storage.setProducts(initialProducts);
        return [...initialProducts];
      }
      let hasUpdated = false;
      stored.forEach((p) => {
        if (p.id === "prod_1" && (p.image?.includes("unsplash") || !p.image)) {
          p.image = "assets/sony-wh1000xm5.png";
          p.gallery = ["assets/sony-wh1000xm5.png", ...(p.gallery || []).slice(1)];
          hasUpdated = true;
        }
        if (p.id === "prod_2" && (p.image?.includes("unsplash") || !p.image)) {
          p.image = "assets/apple-watch-ultra.png";
          p.gallery = ["assets/apple-watch-ultra.png", ...(p.gallery || []).slice(1)];
          hasUpdated = true;
        }
      });
      if (hasUpdated) {
        this.storage.setProducts(stored);
      }
      return stored;
    }
  };
  var currentProductAdapter = new LocalStorageProductAdapter();
  var ProductsRepository = {
    /**
     * Switch the storage adapter with a single line of code
     * @param {ProductAdapter} adapter
     */
    setAdapter(adapter) {
      if (!adapter || typeof adapter.getAll !== "function") {
        throw new Error("[ProductsRepository] Invalid adapter provided.");
      }
      currentProductAdapter = adapter;
    },
    /**
     * Get the current active adapter instance
     * @returns {ProductAdapter}
     */
    getAdapter() {
      return currentProductAdapter;
    },
    async getAll() {
      return await currentProductAdapter.getAll();
    },
    async getById(id) {
      return await currentProductAdapter.getById(id);
    },
    async save(product) {
      return await currentProductAdapter.save(product);
    },
    async saveAll(products) {
      return await currentProductAdapter.saveAll(products);
    },
    async delete(id) {
      return await currentProductAdapter.delete(id);
    },
    async seed(initialProducts = INITIAL_SEED_PRODUCTS) {
      return await currentProductAdapter.seed(initialProducts);
    }
  };
  var ProductsService = class {
    /**
     * Configure or switch data adapter
     * @param {ProductAdapter} adapter
     */
    static setAdapter(adapter) {
      ProductsRepository.setAdapter(adapter);
    }
    /**
     * Seeds initial catalog if not present or outdated
     * @returns {Promise<Array<object>>} Current active product catalog
     */
    static async seedInitialProducts() {
      return await ProductsRepository.seed(INITIAL_SEED_PRODUCTS);
    }
    /**
     * Get all active products
     * @returns {Promise<Array<object>>}
     */
    static async getAll() {
      return await ProductsRepository.getAll();
    }
    /**
     * Find a product by its unique ID
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    static async getById(id) {
      return await ProductsRepository.getById(id);
    }
    /**
     * Save (insert or update) a product
     * @param {object} product
     * @returns {Promise<object>}
     */
    static async save(product) {
      return await ProductsRepository.save(product);
    }
    /**
     * Save an entire collection of products
     * @param {Array<object>} products
     * @returns {Promise<Array<object>>}
     */
    static async saveAll(products) {
      return await ProductsRepository.saveAll(products);
    }
    /**
     * Delete a product by its ID
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
      return await ProductsRepository.delete(id);
    }
    /**
     * Pure function to filter and sort products across multiple languages and fixed categoryKey
     * @param {Array<object>} products
     * @param {object} criteria
     * @param {string} criteria.category
     * @param {string} criteria.searchQuery
     * @param {string} criteria.sortOrder
     * @returns {Array<object>}
     */
    static filterAndSort(products, { category = "all", searchQuery = "", sortOrder = "featured" } = {}) {
      const catKey = (category || "all").toLowerCase();
      let result = catKey === "all" ? [...products] : products.filter((p) => {
        const k = (p.categoryKey || "").toLowerCase();
        if (k && k === catKey) return true;
        const c = p.category;
        if (typeof c === "string") return c.toLowerCase() === catKey;
        if (typeof c === "object" && c !== null) {
          return Object.values(c).some((v) => String(v).toLowerCase() === catKey);
        }
        return false;
      });
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        result = result.filter((p) => {
          const matchVal = (val) => {
            if (!val) return false;
            if (typeof val === "string") return val.toLowerCase().includes(query);
            if (typeof val === "object" && val !== null) {
              return Object.values(val).some((v) => matchVal(v));
            }
            return false;
          };
          return matchVal(p.name) || matchVal(p.category) || matchVal(p.categoryKey) || matchVal(p.shortDesc) || matchVal(p.description) || matchVal(p.badge);
        });
      }
      if (sortOrder === "low") {
        result.sort((a, b) => a.price - b.price);
      } else if (sortOrder === "high") {
        result.sort((a, b) => b.price - a.price);
      } else if (sortOrder === "newest") {
        result.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
      }
      return result;
    }
  };

  // i18n.js
  var TRANSLATIONS = {
    en: {
      // Sovereign Aesthetic Keys
      logo_sub: "Luxury Tech Platform \u2022 DZ",
      hero_ticker: "ALGIERS / ORAN / CONSTANTINE / 69 WILAYAS",
      hero_live_badge: "\u{1F1E9}\u{1F1FF} Algeria's #1 Sovereign Luxury Tech Platform \u2022 2026",
      hero_title_sovereign: "Acquire Global Luxury Tech<br>with Sovereign Trust.",
      hero_desc_sovereign: "Algeria's premier destination for 100% genuine electronics. Full physical inspection before payment and guaranteed nationwide delivery.",
      hero_cta_vip: "VIP WhatsApp Concierge",
      trust_eyebrow: "ENGINEERED TRUST ARCHITECTURE",
      trust_heading: "Elevating Life Through Precision & Authority",
      trust_sub: "Engineered from the ground up: complete physical verification before paying a single dinar.",
      bento_1_title: "Full Unbox & Inspection Rights",
      bento_1_desc: "Open the box and test your device thoroughly before paying the courier. Zero risk, absolute confidence.",
      bento_2_title: "Sovereign 69-Wilaya Logistics",
      bento_2_desc: "Integrated delivery network reaching your door in 24-48 hours with live tracking.",
      bento_3_title: "100% Genuine & Serial-Tracked",
      bento_3_desc: "Sealed authentic devices with verifiable serial numbers and 12-month official warranty.",
      bento_4_title: "Dedicated 24/7 VIP Concierge",
      bento_4_desc: "Personalized assistance and live order coordination via WhatsApp.",
      drops_eyebrow: "LIMITED INVENTORY DROPS",
      drops_heading: "Exclusive Drops In Stock",
      logistics_tag: "OFFICIAL LOGISTICS PROTOCOL",
      logistics_title: "Sovereign Delivery Across Every Municipality in Algeria",
      logistics_desc: "High-precision logistics ensuring your luxury items arrive in pristine factory condition.",
      stat_wilayas: "69 Wilayas",
      stat_wilayas_label: "Complete Nationwide Coverage",
      stat_58: "69 Wilayas",
      stat_58_label: "Complete Nationwide Coverage",
      stat_time: "24-48 Hours",
      stat_time_label: "Average Delivery Speed",
      stat_zero: "0 DZD",
      stat_zero_label: "Zero Return Fee On Inspection",
      reviews_eyebrow: "EXPERIENCES & TESTIMONIALS",
      reviews_heading: "Voices of Zirox Elite Clients",
      custom_order_title: "Looking for a device not in the catalog?",
      custom_order_desc: "We provide bespoke concierge procurement for high-end tech directly to your doorstep.",
      custom_order_cta: "Contact Concierge on WhatsApp",
      top_bar: "Nationwide Fast Shipping \u2022 Cash on Delivery \u2022 Free Shipping over 20,000 DA",
      nav_home: "Home",
      nav_catalog: "Catalog",
      nav_about: "Ecosystem",
      cart_btn: "Cart",
      hero_eyebrow: "Premium Algerian Retail \u2022 Edition 2026",
      hero_title: "Your Quality<br>Living Starts Here.",
      hero_desc: "A curated, reliable shopping experience built for effortless discovery, authentic tech, and doorstep cash-on-delivery across all 69 Wilayas in Algeria.",
      hero_cta_explore: "Explore Store",
      hero_cta_more: "Learn More",
      marquee_wilayas: "All 69 Wilayas Covered",
      marquee_58: "All 69 Wilayas Covered",
      marquee_cod: "Cash On Delivery Inspection Guaranteed",
      marquee_dispatch: "24-48 Hours Express Dispatch",
      marquee_authentic: "100% Authentic Guaranteed Products",
      marquee_partner: "Yalidine Express Official Partner",
      marquee_whatsapp: "WhatsApp Direct Order Confirmation",
      hero_chip_top: "MASTER SOUND 2026",
      hero_chip_acoustics: "360\xB0 PRECISION ACOUSTICS",
      hero_chip_cod: "COD VERIFIED \u2022 36 000 DZD",
      info_title: "Meet Zirox Store.",
      info_cta: "Discover it",
      info_desc: "Zirox Store is a customer-first Algerian marketplace that lets you elevate your lifestyle with premium tech, timeless fashion, and home essentials tied directly to reliable local delivery.",
      bento_card1_title: "Living that blooms with perfection",
      bento_card1_desc: "Experience curated selections tested for performance, durability, and true everyday comfort.",
      bento_card2_title: "Always fluid,\nalways verified.",
      bento_card2_desc: "Inspect your package with your own hands before paying a single dinar. Zero stress, full confidence.",
      bento_card3_title: "Fully\nautomated.",
      bento_card3_desc: "Order via web, confirm through WhatsApp in seconds, and track your package directly to your doorstep.",
      curated_title: "Curated Collection",
      curated_desc: "Explore what's popular in our store right now.",
      view_all: "View All Products (8) \u2192",
      catalog_eyebrow: "Curated Catalog",
      catalog_title: "All Products.",
      catalog_desc: "Hand-picked selection of high-grade gadgets, luxury accessories, and home items with reliable nationwide delivery.",
      all_filter: "All",
      search_placeholder: "Search by name, category, brand...",
      sort_featured: "Featured Collection",
      sort_low: "Price: Low to High",
      sort_high: "Price: High to Low",
      sort_newest: "Newest Arrivals",
      cart_title: "Your Cart",
      cart_empty: "Your cart is empty",
      cart_empty_sub: "Explore our catalog and find great deals!",
      cart_start_shopping: "Start Shopping",
      cart_total: "Total",
      cart_checkout: "Proceed to Checkout \u2192",
      free_shipping_unlocked: "\u{1F389} You unlocked FREE SHIPPING!",
      free_shipping_add: "Add {amount} for Free Shipping \u{1F69A}",
      shipping_details: "Shipping & Delivery Details",
      full_name: "Full Name",
      phone_number: "Phone Number",
      wilaya: "Wilaya",
      select_wilaya: "\u2014 Select your Wilaya (69 Wilayas) \u2014",
      address: "Full Address (Street & Commune)",
      delivery_mode: "Delivery Mode",
      office_pickup: "\u{1F4E6} Office Pickup (Stop Desk)",
      home_delivery: "\u{1F3E0} Home Delivery",
      order_summary: "Order Summary",
      items_subtotal: "Items Subtotal:",
      shipping_fee: "Shipping Fee:",
      confirm_whatsapp: "Confirm Order via WhatsApp",
      catalog_counter: "{count} items available",
      inspection_note: "Open and verify items before paying.",
      instant_note: "Order will be confirmed with our team via WhatsApp immediately.",
      add_to_cart: "+ Add",
      view_details: "View Details \u2197",
      in_stock: "\u2713 In Stock & Ready to Ship",
      product_specs: "Product Specifications",
      order_whatsapp_direct: "\u{1F4AC} Order Directly on WhatsApp",
      toast_added: "Added to Cart! \u{1F6D2}",
      currency: "DA",
      // Footer
      footer_desc: "Your premier destination for quality goods in Algeria.",
      footer_network: "Network",
      footer_care: "Customer Care",
      footer_logistics: "Logistics",
      footer_assurance: "Assurance",
      footer_rights: "\xA9 2026 Zirox Store. All rights reserved.",
      footer_contact_phone: "Phone: 0676 18 48 05",
      footer_contact_email: "Email: contact@ziroxstore.dz",
      footer_contact_city: "Algiers, Algeria",
      footer_coverage: "69 Wilayas Coverage \u2022 Yalidine Express",
      footer_inspect_note: "\u{1F4B5} Cash on Delivery upon inspection.",
      footer_replace_note: "\u{1F504} Free 7-day replacement guarantee.",
      // About Page
      about_eyebrow: "Identity & Purpose",
      about_title: "About Zirox Store.",
      about_desc: "A modern e-commerce ecosystem built from the ground up to bring world-class retail standards to Algerian shoppers.",
      about_vision_title: "Our Vision",
      about_vision_desc: "At Zirox Store, we believe that authentic quality and transparent service should be accessible everywhere in Algeria. Founded in Algiers in 2026, our platform curates high-performance electronics, genuine lifestyle goods, and smart home appliances with guaranteed nationwide delivery.",
      about_trust_title: "Why Shoppers Trust Us",
      about_trust_desc: "\u2022 <strong>Strict Product Curation:</strong> We only list products that pass our durability and performance benchmarks.<br>\u2022 <strong>Package Inspection:</strong> You inspect the product in your hands before paying the courier.<br>\u2022 <strong>All 69 Wilayas:</strong> Fast dispatch with trusted logistics networks (Yalidine, Kazi Tour).<br>\u2022 <strong>WhatsApp Support:</strong> Real-time human assistance before and after your order.",
      about_contact_title: "Headquarters & Contact",
      about_contact_desc: "\u{1F4CD} Algiers, Algeria<br>\u{1F4DE} Phone: <strong>0676 18 48 05</strong><br>\u2709\uFE0F Email: <strong>contact@ziroxstore.dz</strong><br>\u{1F4AC} WhatsApp: Instant chat available 7 days a week.",
      // Product View Bento Trust
      pv_warranty_title: "Official 12-Month<br>Warranty.",
      pv_warranty_desc: "All tech and gadgets are backed by manufacturer warranty against defects.",
      pv_inspection_title: "Package Inspection<br>Guaranteed.",
      pv_inspection_desc: "Open and verify your item before delivering cash to the courier.",
      pv_chat_title: "Direct WhatsApp Support",
      pv_chat_desc: "Have questions about sizes, compatibility, or dispatch? Our team is live on WhatsApp.",
      pv_chat_cta: "Chat Live",
      // Category Filters
      filter_all: "All",
      filter_electronics: "Electronics",
      filter_fashion: "Fashion & Lifestyle",
      filter_home: "Home & Living",
      filter_health: "Health & Beauty",
      // Delivery Modes & Estimates
      office_pickup_title: "\u{1F4E6} Office Pickup (Stop Desk)",
      office_pickup_desc: "Flexible pickup at your nearest Yalidine agency",
      home_delivery_title: "\u{1F3E0} Home Delivery",
      home_delivery_desc: "Hand-delivered directly to your doorstep",
      delivery_estimate_fast: "\u26A1 Express Dispatch: Arrives in <strong>24 to 48 Hours</strong> via Yalidine",
      delivery_estimate_south: "\u26A1 Standard Dispatch: Arrives in <strong>3 to 5 Business Days</strong>",
      // Trust Pillars
      trust_inspect_title: "Full Inspection Before Payment",
      trust_inspect_desc: "Open and thoroughly test your device before paying the courier.",
      trust_cod_title: "100% Cash On Delivery",
      trust_cod_desc: "Zero advance payment, zero risk. Inspect first, pay second.",
      trust_shipping_title: "Insured 69-Wilaya Logistics",
      trust_shipping_desc: "Official nationwide distribution with real-time tracking.",
      trust_warranty_title: "Official 7-Day Replacement",
      trust_warranty_desc: "Direct free exchange in case of any manufacturing defect.",
      // Validation & Hints
      phone_hint: "10 digits starting with 05, 06, or 07",
      phone_valid: "\u2713 Valid Algerian phone number",
      name_hint: "First and last name",
      name_valid: "\u2713 Full name entered",
      address_hint: "Commune, neighborhood, street",
      // Validation & Messages
      err_name: "Please enter your full name (at least 3 characters).",
      err_phone: "Enter a valid 10-digit Algerian phone number (05, 06, or 07).",
      err_state: "Please select your Wilaya to calculate shipping.",
      err_address: "Please enter a detailed street/commune address.",
      err_form_general: "Please correct the highlighted fields before proceeding.",
      order_processing: "Processing Order...",
      order_redirecting: "\u2713 Opening WhatsApp...",
      free_badge: "FREE",
      stock_low_badge: "\u{1F525} Only {stock} left!",
      cart_remove: "Remove",
      sold_out: "\u2715 Sold Out",
      product_not_found: "Product Not Found",
      browse_all: "Browse All Products",
      catalog_empty: "Catalog is currently empty.",
      toast_stock_limit: "Stock Limit",
      toast_stock_limit_msg: "Maximum available quantity is {max}",
      toast_cart_empty: "Cart is Empty",
      toast_validation_error: "Validation Error",
      checkout_qty: "Qty"
    },
    fr: {
      // Sovereign Aesthetic Keys
      logo_sub: "Plateforme de Luxe \u2022 DZ",
      hero_ticker: "ALGER / ORAN / CONSTANTINE / 69 WILAYAS",
      hero_live_badge: "\u{1F1E9}\u{1F1FF} 1\xE8re Plateforme Officielle de Tech Luxe \u2022 Alg\xE9rie 2026",
      hero_title_sovereign: "Acqu\xE9rez la Haute Technologie<br>avec Confiance Souveraine.",
      hero_desc_sovereign: "Premi\xE8re plateforme en Alg\xE9rie pour la tech 100% originale. Inspection physique avant paiement et garantie de remplacement dans 69 wilayas.",
      hero_cta_vip: "Conciergerie VIP WhatsApp",
      trust_eyebrow: "ARCHITECTURE DE CONFIANCE // ENGINEERED TRUST",
      trust_heading: "Une vie sublim\xE9e par la pr\xE9cision et la rigueur",
      trust_sub: "Con\xE7ue pour d\xE9passer les d\xE9fis habituels : inspection physique compl\xE8te avant tout paiement.",
      bento_1_title: "Droit d'Inspection Imm\xE9diate",
      bento_1_desc: "Ouvrez le colis et v\xE9rifiez votre produit avant de payer le livreur. S\xE9r\xE9nit\xE9 absolue et risque z\xE9ro.",
      bento_2_title: "Livraison Souveraine 69 Wilayas",
      bento_2_desc: "Exp\xE9dition express 24-48h partout en Alg\xE9rie avec num\xE9ro de suivi instantan\xE9.",
      bento_3_title: "100% Authentique Certifi\xE9",
      bento_3_desc: "Produits officiels scell\xE9s avec num\xE9ro de s\xE9rie v\xE9rifiable et garantie 12 mois.",
      bento_4_title: "Service Conciergerie D\xE9di\xE9 24/7",
      bento_4_desc: "Assistance personnalis\xE9e et suivi en temps r\xE9el via WhatsApp.",
      drops_eyebrow: "ARRIVAGES LIMIT\xC9S // LIMITED DROPS",
      drops_heading: "\xC9ditions Exclusives Disponibles",
      logistics_tag: "PROTOCOLE LOGISTIQUE OFFICIEL",
      logistics_title: "Livraison souveraine dans toutes les communes d'Alg\xE9rie",
      logistics_desc: "Gr\xE2ce \xE0 un r\xE9seau logistique de haute pr\xE9cision, vos articles arrivent intacts \xE0 votre porte.",
      stat_wilayas: "69 Wilayas",
      stat_wilayas_label: "Couverture totale nationale",
      stat_58: "69 Wilayas",
      stat_58_label: "Couverture totale nationale",
      stat_time: "24-48 Heures",
      stat_time_label: "D\xE9lai moyen de livraison",
      stat_zero: "0 DZD",
      stat_zero_label: "Frais nuls en cas de refus",
      reviews_eyebrow: "AVIS CLIENTS // TESTIMONIALS",
      reviews_heading: "T\xE9moignages de nos Clients Privil\xE9gi\xE9s",
      custom_order_title: "Vous cherchez un mod\xE8le non list\xE9 ?",
      custom_order_desc: "Service de commande sur mesure directement depuis l'Europe jusqu'\xE0 votre domicile.",
      custom_order_cta: "Contacter le Concierge sur WhatsApp",
      top_bar: "Livraison rapide dans 69 wilayas \u2022 Paiement \xE0 la livraison \u2022 Livraison gratuite d\xE8s 20 000 DA",
      nav_home: "Accueil",
      nav_catalog: "Catalogue",
      nav_about: "\xC9cosyst\xE8me",
      cart_btn: "Panier",
      hero_eyebrow: "Commerce haut de gamme en Alg\xE9rie \u2022 \xC9dition 2026",
      hero_title: "Votre qualit\xE9<br>de vie commence ici.",
      hero_desc: "Une exp\xE9rience d'achat soign\xE9e et fiable, con\xE7ue pour la d\xE9couverte sans effort, des produits authentiques et le paiement \xE0 la livraison dans les 69 wilayas.",
      hero_cta_explore: "Explorer la boutique",
      hero_cta_more: "En savoir plus",
      marquee_wilayas: "69 Wilayas couvertes",
      marquee_58: "69 Wilayas couvertes",
      marquee_cod: "Paiement \xE0 la livraison apr\xE8s inspection",
      marquee_dispatch: "Exp\xE9dition express 24-48h",
      marquee_authentic: "100% Produits Authentiques Garantis",
      marquee_partner: "Partenaire officiel Yalidine Express",
      marquee_whatsapp: "Confirmation directe sur WhatsApp",
      hero_chip_top: "AUDIO MASTER 2026",
      hero_chip_acoustics: "ACOUSTIQUE DE PR\xC9CISION 360\xB0",
      hero_chip_cod: "V\xC9RIFI\xC9 LIVRAISON \u2022 36 000 DA",
      info_title: "D\xE9couvrez Zirox Store.",
      info_cta: "D\xE9couvrir",
      info_desc: "Zirox Store est une marketplace alg\xE9rienne ax\xE9e sur le client, vous permettant d'\xE9lever votre style de vie avec des technologies haut de gamme et une livraison locale fiable.",
      bento_card1_title: "Un quotidien qui s'\xE9panouit avec perfection",
      bento_card1_desc: "D\xE9couvrez des s\xE9lections test\xE9es pour leur performance, leur durabilit\xE9 et leur confort au quotidien.",
      bento_card2_title: "Toujours fluide,\ntoujours v\xE9rifi\xE9.",
      bento_card2_desc: "Inspectez votre colis de vos propres mains avant de payer le moindre dinar. Z\xE9ro stress, confiance totale.",
      bento_card3_title: "Totalement\nautomatis\xE9.",
      bento_card3_desc: "Commandez en ligne, confirmez par WhatsApp en quelques secondes et suivez votre colis jusqu'\xE0 votre porte.",
      curated_title: "Collection S\xE9lectionn\xE9e",
      curated_desc: "Explorez les produits les plus populaires actuellement.",
      view_all: "Voir tous les produits (8) \u2192",
      catalog_eyebrow: "Catalogue Soign\xE9",
      catalog_title: "Tous les Produits.",
      catalog_desc: "S\xE9lection rigoureuse d'appareils haut de gamme, d'accessoires de luxe et d'articles pour la maison avec livraison nationale fiable.",
      all_filter: "Tous",
      search_placeholder: "Rechercher par nom, cat\xE9gorie, marque...",
      sort_featured: "Collection Vedette",
      sort_low: "Prix : Croissant",
      sort_high: "Prix : D\xE9croissant",
      sort_newest: "Nouveaut\xE9s",
      cart_title: "Votre Panier",
      cart_empty: "Votre panier est vide",
      cart_empty_sub: "Explorez notre catalogue et trouvez de superbes offres !",
      cart_start_shopping: "Commencer les achats",
      cart_total: "Total",
      cart_checkout: "Passer la commande \u2192",
      free_shipping_unlocked: "\u{1F389} Vous b\xE9n\xE9ficiez de la LIVRAISON GRATUITE !",
      free_shipping_add: "Ajoutez {amount} pour la livraison gratuite \u{1F69A}",
      shipping_details: "D\xE9tails de Livraison & Exp\xE9dition",
      full_name: "Nom et Pr\xE9nom",
      phone_number: "Num\xE9ro de T\xE9l\xE9phone",
      wilaya: "Wilaya",
      select_wilaya: "\u2014 Choisissez votre Wilaya (69 wilayas) \u2014",
      address: "Adresse compl\xE8te (Rue, Commune)",
      delivery_mode: "Mode de livraison",
      office_pickup: "\u{1F4E6} Point Relais (Bureau Stop Desk)",
      home_delivery: "\u{1F3E0} Livraison \xE0 Domicile",
      order_summary: "R\xE9sum\xE9 de la commande",
      items_subtotal: "Sous-total articles :",
      shipping_fee: "Frais de livraison :",
      confirm_whatsapp: "Confirmer la commande sur WhatsApp",
      catalog_counter: "{count} pi\xE8ces disponibles",
      inspection_note: "Ouvrez et v\xE9rifiez vos articles avant de payer.",
      instant_note: "La commande sera confirm\xE9e imm\xE9diatement avec notre \xE9quipe sur WhatsApp.",
      add_to_cart: "+ Ajouter",
      view_details: "Voir D\xE9tails \u2197",
      in_stock: "\u2713 En stock & Pr\xEAt \xE0 \xEAtre exp\xE9di\xE9",
      product_specs: "Caract\xE9ristiques du produit",
      order_whatsapp_direct: "\u{1F4AC} Commander directement sur WhatsApp",
      toast_added: "Ajout\xE9 au panier ! \u{1F6D2}",
      currency: "DA",
      // Footer
      footer_desc: "Votre destination privil\xE9gi\xE9e pour des produits de qualit\xE9 en Alg\xE9rie.",
      footer_network: "Navigation",
      footer_care: "Service Client",
      footer_logistics: "Logistique",
      footer_assurance: "Garanties",
      footer_rights: "\xA9 2026 Zirox Store. Tous droits r\xE9serv\xE9s.",
      footer_contact_phone: "T\xE9l : 0676 18 48 05",
      footer_contact_email: "Email : contact@ziroxstore.dz",
      footer_contact_city: "Alger, Alg\xE9rie",
      footer_coverage: "Couverture 69 Wilayas \u2022 Yalidine Express",
      footer_inspect_note: "\u{1F4B5} Paiement \xE0 la livraison apr\xE8s inspection.",
      footer_replace_note: "\u{1F504} Garantie de remplacement sous 7 jours.",
      // About Page
      about_eyebrow: "Identit\xE9 & Mission",
      about_title: "\xC0 propos de Zirox Store.",
      about_desc: "Un \xE9cosyst\xE8me e-commerce moderne con\xE7u pour offrir les meilleurs standards de vente aux acheteurs alg\xE9riens.",
      about_vision_title: "Notre Vision",
      about_vision_desc: "Chez Zirox Store, nous croyons qu'une qualit\xE9 authentique et un service transparent doivent \xEAtre accessibles partout en Alg\xE9rie. Fond\xE9e \xE0 Alger en 2026, notre plateforme s\xE9lectionne des produits \xE9lectroniques performants, des articles de mode et des appareils connect\xE9s avec livraison garantie dans tout le pays.",
      about_trust_title: "Pourquoi nos clients nous font confiance",
      about_trust_desc: "\u2022 <strong>S\xE9lection rigoureuse :</strong> Seuls les produits test\xE9s et valid\xE9s pour leur durabilit\xE9 sont propos\xE9s.<br>\u2022 <strong>Inspection du colis :</strong> Vous v\xE9rifiez le produit de vos propres mains avant de r\xE9gler le livreur.<br>\u2022 <strong>69 Wilayas couvertes :</strong> Exp\xE9dition rapide avec nos partenaires logistiques fiables (Yalidine, Kazi Tour).<br>\u2022 <strong>Support WhatsApp :</strong> Assistance humaine continue en direct avant et apr\xE8s votre commande.",
      about_contact_title: "Si\xE8ge & Contact",
      about_contact_desc: "\u{1F4CD} Alger, Alg\xE9rie<br>\u{1F4DE} T\xE9l\xE9phone : <strong>0676 18 48 05</strong><br>\u2709\uFE0F Email : <strong>contact@ziroxstore.dz</strong><br>\u{1F4AC} WhatsApp : Assistance disponible 7j/7.",
      // Product View Bento Trust
      pv_warranty_title: "Garantie Officielle<br>12 Mois.",
      pv_warranty_desc: "Tous nos \xE9quipements sont couverts par une garantie constructeur contre les d\xE9fauts.",
      pv_inspection_title: "Inspection du Colis<br>Garantie.",
      pv_inspection_desc: "Ouvrez et v\xE9rifiez votre article avant de remettre l'argent au livreur.",
      pv_chat_title: "Support WhatsApp Direct",
      pv_chat_desc: "Une question sur les caract\xE9ristiques ou l'exp\xE9dition ? Notre \xE9quipe vous r\xE9pond sur WhatsApp.",
      pv_chat_cta: "Discuter en Direct",
      // Category Filters
      filter_all: "Tous",
      filter_electronics: "\xC9lectronique",
      filter_fashion: "Mode & Accessoires",
      filter_home: "Maison",
      filter_health: "Sant\xE9 & Beaut\xE9",
      // Delivery Modes & Estimates
      office_pickup_title: "\u{1F4E6} Point Relais (Stop Desk)",
      office_pickup_desc: "Retrait flexible au bureau Yalidine de votre commune",
      home_delivery_title: "\u{1F3E0} Livraison \xE0 Domicile",
      home_delivery_desc: "Remise en main propre directement \xE0 votre porte",
      delivery_estimate_fast: "\u26A1 Exp\xE9dition Express : Arriv\xE9e en <strong>24h \xE0 48h</strong> via Yalidine",
      delivery_estimate_south: "\u26A1 Exp\xE9dition : Arriv\xE9e en <strong>3 \xE0 5 jours ouvrables</strong>",
      // Trust Pillars
      trust_inspect_title: "Inspection Compl\xE8te Avant Paiement",
      trust_inspect_desc: "Ouvrez le colis et v\xE9rifiez votre produit avant de payer le livreur.",
      trust_cod_title: "Paiement \xE0 la Livraison 100%",
      trust_cod_desc: "Z\xE9ro paiement \xE0 l'avance, z\xE9ro risque. Inspectez d'abord, r\xE9glez ensuite.",
      trust_shipping_title: "Logistique 69 Wilayas Express",
      trust_shipping_desc: "Distribution nationale officielle avec suivi en temps r\xE9el.",
      trust_warranty_title: "Garantie Remplacement 7 Jours",
      trust_warranty_desc: "\xC9change imm\xE9diat en cas de d\xE9faut de fabrication.",
      // Validation & Hints
      phone_hint: "10 chiffres d\xE9butant par 05, 06 ou 07",
      phone_valid: "\u2713 Num\xE9ro alg\xE9rien valide",
      name_hint: "Nom et pr\xE9nom complets",
      name_valid: "\u2713 Nom complet valide",
      address_hint: "Commune, quartier, rue",
      // Validation & Messages
      err_name: "Veuillez entrer votre nom complet (au moins 3 caract\xE8res).",
      err_phone: "Num\xE9ro alg\xE9rien invalide \xE0 10 chiffres (05, 06 ou 07).",
      err_state: "Veuillez s\xE9lectionner votre Wilaya pour le calcul de livraison.",
      err_address: "Veuillez pr\xE9ciser votre adresse compl\xE8te.",
      err_form_general: "Veuillez corriger les champs indiqu\xE9s.",
      order_processing: "Traitement de la commande...",
      order_redirecting: "\u2713 Ouverture de WhatsApp...",
      free_badge: "GRATUIT",
      stock_low_badge: "\u{1F525} Plus que {stock} en stock !",
      cart_remove: "Supprimer",
      sold_out: "\u2715 \xC9puis\xE9",
      product_not_found: "Produit introuvable",
      browse_all: "Voir tous les produits",
      catalog_empty: "Le catalogue est actuellement vide.",
      toast_stock_limit: "Limite de stock",
      toast_stock_limit_msg: "Quantit\xE9 maximale disponible : {max}",
      toast_cart_empty: "Panier vide",
      toast_validation_error: "Erreur de validation",
      checkout_qty: "Qt\xE9"
    },
    ar: {
      // Sovereign Aesthetic Keys
      logo_sub: "\u0645\u062A\u062C\u0631 \u0627\u0644\u0646\u062E\u0628\u0629 \u0627\u0644\u0641\u0627\u062E\u0631 \u2022 DZ",
      hero_ticker: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 / \u0648\u0647\u0631\u0627\u0646 / \u0642\u0633\u0646\u0637\u064A\u0646\u0629 / 69 \u0648\u0644\u0627\u064A\u0629",
      hero_live_badge: "\u{1F1E9}\u{1F1FF} \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0644\u062A\u0642\u0646\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u2022 \u0627\u0644\u062C\u0632\u0627\u0626\u0631 2026",
      hero_title_sovereign: "\u0627\u0642\u062A\u0646\u0650 \u0642\u0645\u0629 \u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629<br>\u0628\u0623\u0645\u0627\u0646 \u0633\u064A\u0627\u062F\u064A \u0645\u0637\u0644\u0642.",
      hero_desc_sovereign: "\u0645\u0646\u0635\u0629 \u0627\u0644\u062A\u0633\u0648\u0651\u0642 \u0627\u0644\u0623\u0648\u0644\u0649 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 100%. \u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u0627\u062E\u062A\u0628\u0627\u0631 \u0641\u0648\u0631\u064A \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0645\u0628\u0627\u0634\u0631 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629.",
      hero_cta_vip: "\u0637\u0644\u0628 \u0645\u062E\u0635\u0635 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628",
      trust_eyebrow: "\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u062B\u0642\u0629 \u0648\u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629 // ENGINEERED TRUST",
      trust_heading: "\u062D\u064A\u0627\u0629 \u062A\u0631\u062A\u0642\u064A \u0628\u0627\u0644\u0625\u062A\u0642\u0627\u0646 \u0648\u0627\u0644\u0645\u0648\u062B\u0648\u0642\u064A\u0629",
      trust_sub: "\u0635\u0645\u0645\u0646\u0627 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631 \u0644\u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629\u061B \u0641\u062D\u0635 \u0643\u0627\u0645\u0644 \u0648\u0645\u0628\u0627\u0634\u0631 \u0642\u0628\u0644 \u062A\u0633\u0644\u064A\u0645 \u0623\u064A \u0645\u0628\u0644\u063A.",
      bento_1_title: "\u062D\u0642 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629",
      bento_1_desc: "\u0627\u0641\u062A\u062D \u0627\u0644\u0637\u0631\u062F \u0648\u0627\u0641\u062D\u0635 \u0645\u0646\u062A\u062C\u0643 \u0628\u0639\u0646\u0627\u064A\u0629 \u0642\u0628\u0644 \u062F\u0641\u0639 \u0623\u064A \u062F\u064A\u0646\u0627\u0631 \u0644\u0644\u0645\u0646\u062F\u0648\u0628. \u062B\u0642\u0629 \u0645\u0637\u0644\u0642\u0629 \u0648\u062A\u062C\u0631\u0628\u0629 \u062A\u0633\u0648\u0642 \u0628\u0644\u0627 \u0645\u062E\u0627\u0637\u0631\u0629.",
      bento_2_title: "\u062A\u0648\u0635\u064A\u0644 \u0633\u064A\u0627\u062F\u064A \u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629",
      bento_2_desc: "\u0634\u0628\u0643\u0629 \u0634\u062D\u0646 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u062A\u0635\u0644\u0643 \u0623\u064A\u0646\u0645\u0627 \u0643\u0646\u062A \u062E\u0644\u0627\u0644 24 \u0625\u0644\u0649 48 \u0633\u0627\u0639\u0629 \u0645\u0639 \u0631\u0642\u0645 \u062A\u062A\u0628\u0639 \u0641\u0648\u0631\u064A \u062D\u062A\u0649 \u0628\u0627\u0628 \u0645\u0646\u0632\u0644\u0643.",
      bento_3_title: "\u0623\u0635\u0627\u0644\u0629 \u0645\u0637\u0644\u0642\u0629 100% \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062A\u0633\u0644\u0633\u0644\u064A",
      bento_3_desc: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0623\u0635\u0644\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629 \u0648\u0645\u0641\u062D\u0648\u0635\u0629 \u0645\u0639 \u0636\u0645\u0627\u0646 \u0631\u0633\u0645\u064A \u0645\u0639\u062A\u0645\u062F \u0644\u0645\u062F\u0629 12 \u0634\u0647\u0631\u0627\u064B.",
      bento_4_title: "\u062E\u062F\u0645\u0629 \u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0648\u0645\u0633\u0627\u0639\u062F\u0629 \u0634\u062E\u0635\u064A\u0629 24/7",
      bento_4_desc: "\u0641\u0631\u064A\u0642 \u0645\u062A\u062E\u0635\u0635 \u0644\u0645\u0631\u0627\u0641\u0642\u062A\u0643 \u0648\u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0639\u0646 \u0643\u0627\u0641\u0629 \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A\u0643 \u0648\u062A\u0646\u0633\u064A\u0642 \u0634\u062D\u0646\u062A\u0643 \u0644\u062D\u0638\u0629 \u0628\u0644\u062D\u0638\u0629 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628.",
      drops_eyebrow: "\u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0645\u062A\u0648\u0641\u0631\u0629 \u062D\u0627\u0644\u064A\u0627\u064B // LIMITED DROPS",
      drops_heading: "\u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0641\u0627\u062E\u0631\u0629 \u0645\u062A\u0648\u0641\u0631\u0629 \u062D\u0627\u0644\u064A\u0627\u064B",
      logistics_tag: "\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0633\u064A\u0627\u062F\u064A",
      logistics_title: "\u062A\u0648\u0635\u064A\u0644 \u0633\u064A\u0627\u062F\u064A \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u062F\u0648\u0627\u0626\u0631 \u0648\u0627\u0644\u0628\u0644\u062F\u064A\u0627\u062A \u0639\u0628\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631",
      logistics_desc: "\u0639\u0628\u0631 \u0623\u0633\u0637\u0648\u0644 \u0644\u0648\u062C\u0633\u062A\u064A \u0639\u0627\u0644\u064A \u0627\u0644\u062F\u0642\u0629\u060C \u0646\u0636\u0645\u0646 \u0648\u0635\u0648\u0644 \u0623\u062C\u0647\u0632\u062A\u0643 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0628\u062D\u0627\u0644\u062A\u0647\u0627 \u0627\u0644\u0645\u0635\u0646\u0639\u064A\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u062D\u062A\u0649 \u0639\u062A\u0628\u0629 \u0645\u0646\u0632\u0644\u0643.",
      stat_wilayas: "69 \u0648\u0644\u0627\u064A\u0629",
      stat_wilayas_label: "\u062A\u063A\u0637\u064A\u0629 \u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0634\u0627\u0645\u0644\u0629",
      stat_58: "69 \u0648\u0644\u0627\u064A\u0629",
      stat_58_label: "\u062A\u063A\u0637\u064A\u0629 \u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0634\u0627\u0645\u0644\u0629",
      stat_time: "24-48 \u0633\u0627\u0639\u0629",
      stat_time_label: "\u0645\u062A\u0648\u0633\u0637 \u0632\u0645\u0646 \u0627\u0644\u062A\u0633\u0644\u064A\u0645",
      stat_zero: "0 \u062F\u062C",
      stat_zero_label: "\u0631\u0633\u0648\u0645 \u0627\u0644\u0625\u0631\u062C\u0627\u0639 \u0639\u0646\u062F \u0627\u0644\u0631\u0641\u0636",
      reviews_eyebrow: "\u062A\u062C\u0627\u0631\u0628 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 // TESTIMONIALS",
      reviews_heading: "\u0634\u0647\u0627\u062F\u0627\u062A \u0646\u062E\u0628\u0629 \u0639\u0645\u0644\u0627\u0621 \u0632\u064A\u0631\u0648\u0643\u0633",
      custom_order_title: "\u0647\u0644 \u062A\u0628\u062D\u062B \u0639\u0646 \u062C\u0647\u0627\u0632 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C\u061F",
      custom_order_desc: "\u0646\u0648\u0641\u0631 \u062E\u062F\u0645\u0629 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0645\u062E\u0635\u0635 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0645\u0646 \u0627\u0644\u0645\u062A\u0627\u062C\u0631 \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0628\u0627\u0628 \u062F\u0627\u0631\u0643.",
      custom_order_cta: "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628",
      top_bar: "\u062A\u0648\u0635\u064A\u0644 \u0633\u0631\u064A\u0639 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629 \u2022 \u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0628\u0639\u062F \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u2022 \u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A \u0644\u0644\u0637\u0644\u0628\u0627\u062A \u0641\u0648\u0642 20,000 \u062F\u062C",
      nav_home: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
      nav_catalog: "\u0627\u0644\u0645\u062A\u062C\u0631",
      nav_about: "\u0639\u0646 \u0627\u0644\u0645\u062A\u062C\u0631",
      cart_btn: "\u0627\u0644\u0633\u0644\u0629",
      hero_eyebrow: "\u062A\u062C\u0627\u0631\u0629 \u0627\u0644\u062A\u062C\u0632\u0626\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u2022 \u0625\u0635\u062F\u0627\u0631 2026",
      hero_title: "\u062D\u064A\u0627\u062A\u0643 \u0627\u0644\u064A\u0648\u0645\u064A\u0629<br>\u0628\u062C\u0648\u062F\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u062A\u0628\u062F\u0623 \u0647\u0646\u0627.",
      hero_desc: "\u062A\u062C\u0631\u0628\u0629 \u062A\u0633\u0648\u0642 \u0631\u0627\u0642\u064A\u0629 \u0648\u0645\u0648\u062B\u0648\u0642\u0629 \u0635\u064F\u0645\u0645\u062A \u0644\u062A\u0633\u0647\u064A\u0644 \u0627\u0643\u062A\u0634\u0627\u0641 \u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0645\u0639 \u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631.",
      hero_cta_explore: "\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0645\u062A\u062C\u0631",
      hero_cta_more: "\u062A\u0639\u0631\u0641 \u0639\u0644\u064A\u0646\u0627",
      marquee_wilayas: "\u062A\u0648\u0635\u064A\u0644 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629",
      marquee_58: "\u062A\u0648\u0635\u064A\u0644 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629",
      marquee_cod: "\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0637\u0631\u062F \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
      marquee_dispatch: "\u062A\u062C\u0647\u064A\u0632 \u0648\u0634\u062D\u0646 \u0633\u0631\u064A\u0639 \u062E\u0644\u0627\u0644 24-48 \u0633\u0627\u0639\u0629",
      marquee_authentic: "\u0645\u0646\u062A\u062C\u0627\u062A \u0623\u0635\u0644\u064A\u0629 \u0648\u0645\u0636\u0645\u0648\u0646\u0629 100%",
      marquee_partner: "\u0634\u0631\u064A\u0643 \u0631\u0633\u0645\u064A \u0645\u0639 \u064A\u0627\u0644\u064A\u062F\u064A\u0646 \u0625\u0643\u0633\u0628\u0631\u064A\u0633",
      marquee_whatsapp: "\u062A\u0623\u0643\u064A\u062F \u0645\u0628\u0627\u0634\u0631 \u0648\u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628",
      hero_chip_top: "\u0627\u0644\u0635\u0648\u062A \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A 2026",
      hero_chip_acoustics: "\u0635\u0648\u062A\u064A\u0627\u062A \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u062F\u0642\u0629 360\xB0",
      hero_chip_cod: "\u062F\u0641\u0639 \u0628\u0639\u062F \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u2022 36 000 \u062F\u062C",
      info_title: "\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0645\u062A\u062C\u0631 Zirox.",
      info_cta: "\u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0645\u0632\u064A\u062F",
      info_desc: "\u0645\u062A\u062C\u0631 Zirox \u0647\u0648 \u0648\u062C\u0647\u062A\u0643\u0645 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629 \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u062A\u0642\u064A \u0628\u062D\u064A\u0627\u062A\u0643\u0645 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0628\u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629\u060C \u0627\u0644\u0623\u0632\u064A\u0627\u0621\u060C \u0648\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0632\u0644 \u0645\u0639 \u062A\u0648\u0635\u064A\u0644 \u0645\u062D\u0644\u064A \u0645\u0636\u0645\u0648\u0646.",
      bento_card1_title: "\u062D\u064A\u0627\u0629 \u062A\u0631\u062A\u0642\u064A \u0628\u0623\u0639\u0644\u0649 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0625\u062A\u0642\u0627\u0646",
      bento_card1_desc: "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0645\u062F\u0631\u0648\u0633\u0629 \u0648\u0645\u062C\u0631\u0628\u0629 \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0623\u062F\u0627\u0621\u060C \u0627\u0644\u0645\u062A\u0627\u0646\u0629\u060C \u0648\u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629.",
      bento_card2_title: "\u062F\u0627\u0626\u0645\u0627\u064B \u0645\u0648\u062B\u0648\u0642\u060C\n\u062F\u0627\u0626\u0645\u0627\u064B \u0645\u0641\u062D\u0648\u0635.",
      bento_card2_desc: "\u0627\u0641\u062D\u0635 \u0637\u0631\u062F\u0643 \u0628\u064A\u062F\u0643 \u0648\u062A\u0623\u0643\u062F \u0645\u0646\u0647 \u0628\u0646\u0641\u0633\u0643 \u0642\u0628\u0644 \u062F\u0641\u0639 \u0623\u064A \u062F\u064A\u0646\u0627\u0631. \u062A\u0633\u0648\u0642 \u0628\u062B\u0642\u0629 \u062A\u0627\u0645\u0629 \u0648\u0628\u0644\u0627 \u0623\u064A \u0645\u062E\u0627\u0637\u0631\u0629.",
      bento_card3_title: "\u0645\u0624\u062A\u0645\u062A\n\u0628\u0627\u0644\u0643\u0627\u0645\u0644.",
      bento_card3_desc: "\u0627\u0637\u0644\u0628 \u0639\u0628\u0631 \u0627\u0644\u0645\u0648\u0642\u0639\u060C \u0623\u0643\u062F \u0637\u0644\u0628\u0643 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u064A \u062B\u0648\u0627\u0646\u064D\u060C \u0648\u062A\u0627\u0628\u0639 \u0634\u062D\u0646\u062A\u0643 \u0645\u0628\u0627\u0634\u0631\u0629 \u062D\u062A\u0649 \u0628\u0627\u0628 \u0645\u0646\u0632\u0644\u0643.",
      curated_title: "\u0645\u062E\u062A\u0627\u0631\u0627\u062A \u062D\u0635\u0631\u064A\u0629",
      curated_desc: "\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0623\u0643\u062B\u0631 \u0637\u0644\u0628\u0627\u064B \u0648\u0631\u0648\u0627\u062C\u0627\u064B \u0641\u064A \u0645\u062A\u062C\u0631\u0646\u0627 \u0627\u0644\u0622\u0646.",
      view_all: "\u0639\u0631\u0636 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A (8) \u2190",
      catalog_eyebrow: "\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629",
      catalog_title: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A.",
      catalog_desc: "\u062A\u0634\u0643\u064A\u0644\u0629 \u0645\u0646\u062A\u0642\u0627\u0629 \u0628\u0639\u0646\u0627\u064A\u0629 \u0645\u0646 \u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0630\u0643\u064A\u0629\u060C \u0627\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629\u060C \u0648\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0632\u0644 \u0645\u0639 \u062A\u0648\u0635\u064A\u0644 \u0645\u0648\u062B\u0648\u0642 \u0644\u0643\u0627\u0641\u0629 \u0623\u0646\u062D\u0627\u0621 \u0627\u0644\u0648\u0637\u0646.",
      all_filter: "\u0627\u0644\u0643\u0644",
      search_placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C\u060C \u0627\u0644\u0641\u0626\u0629\u060C \u0623\u0648 \u0627\u0644\u0645\u0627\u0631\u0643\u0629...",
      sort_featured: "\u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0645\u064A\u0632\u0629",
      sort_low: "\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0642\u0644 \u0644\u0644\u0623\u0639\u0644\u0649",
      sort_high: "\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0623\u0642\u0644",
      sort_newest: "\u0627\u0644\u0623\u062D\u062F\u062B \u0648\u0635\u0648\u0644\u0627\u064B",
      cart_title: "\u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A",
      cart_empty: "\u0633\u0644\u062A\u0643 \u0641\u0627\u0631\u063A\u0629 \u062D\u0627\u0644\u064A\u0627\u064B",
      cart_empty_sub: "\u062A\u0635\u0641\u062D \u0645\u062A\u062C\u0631\u0646\u0627 \u0648\u0627\u0633\u062A\u0645\u062A\u0639 \u0628\u0623\u0642\u0648\u0649 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A!",
      cart_start_shopping: "\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u0633\u0648\u0642 \u0627\u0644\u0622\u0646",
      cart_total: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064A",
      cart_checkout: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u2190",
      free_shipping_unlocked: "\u{1F389} \u062A\u0647\u0627\u0646\u064A\u0646\u0627! \u062D\u0635\u0644\u062A \u0639\u0644\u0649 \u062A\u0648\u0635\u064A\u0644 \u0645\u062C\u0627\u0646\u064A!",
      free_shipping_add: "\u0623\u0636\u0641 {amount} \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A \u{1F69A}",
      shipping_details: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      full_name: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0644\u0642\u0628",
      phone_number: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641",
      wilaya: "\u0627\u0644\u0648\u0644\u0627\u064A\u0629",
      select_wilaya: "\u2014 \u0627\u062E\u062A\u0631 \u0648\u0644\u0627\u064A\u062A\u0643 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 (69 \u0648\u0644\u0627\u064A\u0629) \u2014",
      address: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0643\u0627\u0645\u0644 (\u0627\u0644\u0628\u0644\u062F\u064A\u0629 \u0648\u0627\u0644\u0634\u0627\u0631\u0639)",
      delivery_mode: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645",
      office_pickup: "\u{1F4E6} \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646 \u0645\u0643\u062A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 (Stop Desk)",
      home_delivery: "\u{1F3E0} \u062A\u0648\u0635\u064A\u0644 \u0644\u0628\u0627\u0628 \u0627\u0644\u0645\u0646\u0632\u0644",
      order_summary: "\u0645\u0644\u062E\u0635 \u0627\u0644\u0637\u0644\u0628\u064A\u0629",
      items_subtotal: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A:",
      shipping_fee: "\u0643\u0644\u0641\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644:",
      confirm_whatsapp: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628",
      catalog_counter: "{count} \u0642\u0637\u0639 \u0645\u062A\u0627\u062D\u0629",
      inspection_note: "\u0627\u0641\u062D\u0635 \u0637\u0631\u062F\u0643 \u0648\u062A\u0623\u0643\u062F \u0645\u0646 \u0645\u062D\u062A\u0648\u0627\u0647 \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639.",
      instant_note: "\u0633\u064A\u062A\u0645 \u0641\u062A\u062D \u0645\u062D\u0627\u062F\u062B\u0629 WhatsApp \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0639 \u0641\u0631\u064A\u0642\u0646\u0627 \u0644\u062A\u0623\u0643\u064A\u062F \u0634\u062D\u0646\u062A\u0643.",
      add_to_cart: "+ \u0623\u0636\u0641",
      view_details: "\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u2196",
      in_stock: "\u2713 \u0645\u062A\u0648\u0641\u0631 \u0648\u062C\u0627\u0647\u0632 \u0644\u0644\u0634\u062D\u0646 \u0627\u0644\u0641\u0648\u0631\u064A",
      product_specs: "\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0641\u0646\u064A\u0629 \u0644\u0644\u0645\u0646\u062A\u062C",
      order_whatsapp_direct: "\u{1F4AC} \u0627\u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628",
      toast_added: "\u062A\u0645\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0644\u0644\u0633\u0644\u0629! \u{1F6D2}",
      currency: "\u062F\u062C",
      // Footer
      footer_desc: "\u0648\u062C\u0647\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0627\u0642\u062A\u0646\u0627\u0621 \u0623\u0631\u0642\u0649 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0648\u062B\u0648\u0642\u0629 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631.",
      footer_network: "\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u062A\u062C\u0631",
      footer_care: "\u062E\u062F\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
      footer_logistics: "\u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644",
      footer_assurance: "\u0627\u0644\u0636\u0645\u0627\u0646 \u0648\u0627\u0644\u062B\u0642\u0629",
      footer_rights: "\xA9 2026 \u0645\u062A\u062C\u0631 Zirox. \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629.",
      footer_contact_phone: "\u0627\u0644\u0647\u0627\u062A\u0641: 0676 18 48 05",
      footer_contact_email: "\u0627\u0644\u0628\u0631\u064A\u062F: contact@ziroxstore.dz",
      footer_contact_city: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629\u060C \u0627\u0644\u062C\u0632\u0627\u0626\u0631",
      footer_coverage: "\u062A\u063A\u0637\u064A\u0629 \u0643\u0627\u0645\u0644 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629 \u2022 \u064A\u0627\u0644\u064A\u062F\u064A\u0646 \u0625\u0643\u0633\u0628\u0631\u064A\u0633",
      footer_inspect_note: "\u{1F4B5} \u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0628\u0639\u062F \u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0637\u0631\u062F.",
      footer_replace_note: "\u{1F504} \u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0645\u062C\u0627\u0646\u064A \u062E\u0644\u0627\u0644 7 \u0623\u064A\u0627\u0645.",
      // About Page
      about_eyebrow: "\u0627\u0644\u0647\u0648\u064A\u0629 \u0648\u0627\u0644\u0631\u0624\u064A\u0629",
      about_title: "\u0639\u0646 \u0645\u062A\u062C\u0631 Zirox.",
      about_desc: "\u0645\u0646\u0638\u0648\u0645\u0629 \u062A\u062C\u0627\u0631\u0629 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0639\u0635\u0631\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0635\u064F\u0645\u0645\u062A \u0644\u062A\u0642\u062F\u064A\u0645 \u0623\u0641\u0636\u0644 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062A\u0633\u0648\u0642 \u0644\u0644\u0645\u0633\u062A\u0647\u0644\u0643 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A.",
      about_vision_title: "\u0631\u0624\u064A\u062A\u0646\u0627",
      about_vision_desc: "\u0641\u064A \u0645\u062A\u062C\u0631 Zirox\u060C \u0646\u0624\u0645\u0646 \u0628\u0623\u0646 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0648\u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0634\u0641\u0627\u0641\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0641\u064A \u0645\u062A\u0646\u0627\u0648\u0644 \u0627\u0644\u062C\u0645\u064A\u0639 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631. \u062A\u0623\u0633\u0633\u062A \u0645\u0646\u0635\u062A\u0646\u0627 \u0628\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0639\u0627\u0645 2026\u060C \u0644\u0646\u0646\u062A\u0642\u064A \u0628\u0639\u0646\u0627\u064A\u0629 \u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0648\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u0639\u0635\u0631\u064A\u0629 \u0645\u0639 \u062A\u0648\u0635\u064A\u0644 \u0645\u0636\u0645\u0648\u0646 \u0644\u0643\u0627\u0641\u0629 \u0631\u0628\u0648\u0639 \u0627\u0644\u0648\u0637\u0646.",
      about_trust_title: "\u0644\u0645\u0627\u0630\u0627 \u064A\u062B\u0642 \u0628\u0646\u0627 \u0627\u0644\u0645\u062A\u0633\u0648\u0642\u0648\u0646",
      about_trust_desc: "\u2022 <strong>\u0627\u0646\u062A\u0642\u0627\u0621 \u0635\u0627\u0631\u0645 \u0644\u0644\u0645\u0646\u062A\u062C\u0627\u062A:</strong> \u0646\u0639\u0631\u0636 \u0641\u0642\u0637 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u062C\u062A\u0627\u0632 \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0645\u062A\u0627\u0646\u0629 \u0627\u0644\u0639\u0627\u0644\u064A\u0629.<br>\u2022 <strong>\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0637\u0631\u062F:</strong> \u062A\u0641\u062D\u0635 \u0645\u0646\u062A\u062C\u0643 \u0628\u064A\u062F\u0643 \u0648\u062A\u062A\u0623\u0643\u062F \u0645\u0646\u0647 \u062A\u0645\u0627\u0645\u0627\u064B \u0642\u0628\u0644 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0628\u0644\u063A \u0644\u0645\u0648\u0632\u0639 \u0627\u0644\u062A\u0648\u0635\u064A\u0644.<br>\u2022 <strong>\u062A\u063A\u0637\u064A\u0629 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629:</strong> \u0625\u0631\u0633\u0627\u0644 \u0633\u0631\u064A\u0639 \u0639\u0628\u0631 \u0634\u0628\u0643\u0627\u062A \u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0645\u0648\u062B\u0648\u0642\u0629 (\u064A\u0627\u0644\u064A\u062F\u064A\u0646\u060C \u0643\u0627\u0632\u064A \u062A\u0648\u0631).<br>\u2022 <strong>\u062F\u0639\u0645 \u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628:</strong> \u0645\u0633\u0627\u0639\u062F\u0629 \u0628\u0634\u0631\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u0648\u062A\u0648\u0627\u0635\u0644 \u062F\u0627\u0626\u0645 \u0642\u0628\u0644 \u0648\u0628\u0639\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628\u064A\u062A\u0643.",
      about_contact_title: "\u0627\u0644\u0645\u0642\u0631 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644",
      about_contact_desc: "\u{1F4CD} \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629\u060C \u0627\u0644\u062C\u0632\u0627\u0626\u0631<br>\u{1F4DE} \u0627\u0644\u0647\u0627\u062A\u0641: <strong>0676 18 48 05</strong><br>\u2709\uFE0F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A: <strong>contact@ziroxstore.dz</strong><br>\u{1F4AC} \u0648\u0627\u062A\u0633\u0627\u0628: \u0645\u062D\u0627\u062F\u062B\u0629 \u0641\u0648\u0631\u064A\u0629 \u0645\u062A\u0627\u062D\u0629 7 \u0623\u064A\u0627\u0645 \u0641\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",
      // Product View Bento Trust
      pv_warranty_title: "\u0636\u0645\u0627\u0646 \u0631\u0633\u0645\u064A<br>\u0644\u0645\u062F\u0629 12 \u0634\u0647\u0631\u0627\u064B.",
      pv_warranty_desc: "\u0643\u0627\u0641\u0629 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0648\u0627\u0644\u0645\u0642\u062A\u0646\u064A\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0645\u0634\u0645\u0648\u0644\u0629 \u0628\u0636\u0645\u0627\u0646 \u0645\u0639\u062A\u0645\u062F \u0636\u062F \u0623\u064A \u0639\u064A\u0648\u0628 \u0645\u0635\u0646\u0639\u064A\u0629.",
      pv_inspection_title: "\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0637\u0631\u062F<br>\u0645\u0636\u0645\u0648\u0646\u0629 \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639.",
      pv_inspection_desc: "\u0627\u0641\u062D\u0635 \u0648\u062A\u0623\u0643\u062F \u0645\u0646 \u0633\u0644\u0627\u0645\u0629 \u0637\u0644\u0628\u0643 \u0628\u064A\u062F\u0643 \u0642\u0628\u0644 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0628\u0644\u063A \u0644\u0645\u0648\u0632\u0639 \u0627\u0644\u062A\u0648\u0635\u064A\u0644.",
      pv_chat_title: "\u062F\u0639\u0645 \u0645\u0628\u0627\u0634\u0631 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628",
      pv_chat_desc: "\u0647\u0644 \u0644\u062F\u064A\u0643 \u0623\u064A \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u062D\u0648\u0644 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0623\u0648 \u0627\u0644\u0634\u062D\u0646\u061F \u0641\u0631\u064A\u0642\u0646\u0627 \u0645\u062A\u0648\u0627\u062C\u062F \u0644\u062E\u062F\u0645\u062A\u0643 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628.",
      pv_chat_cta: "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627",
      // Category Filters
      filter_all: "\u0627\u0644\u0643\u0644",
      filter_electronics: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A",
      filter_fashion: "\u0623\u0632\u064A\u0627\u0621 \u0648\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A",
      filter_home: "\u0627\u0644\u0645\u0646\u0632\u0644 \u0648\u0627\u0644\u0645\u0639\u064A\u0634\u0629",
      filter_health: "\u0627\u0644\u0635\u062D\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644",
      // Delivery Modes & Estimates
      office_pickup_title: "\u{1F4E6} \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646 \u0645\u0643\u062A\u0628 \u064A\u0627\u0644\u064A\u062F\u064A\u0646 (Stop Desk)",
      office_pickup_desc: "\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0631\u0646 \u0645\u0646 \u0623\u0642\u0631\u0628 \u0645\u0643\u062A\u0628 \u0641\u064A \u0628\u0644\u062F\u064A\u062A\u0643 \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0630\u064A \u064A\u0646\u0627\u0633\u0628\u0643",
      home_delivery_title: "\u{1F3E0} \u062A\u0648\u0635\u064A\u0644 \u0644\u0628\u0627\u0628 \u0627\u0644\u0645\u0646\u0632\u0644",
      home_delivery_desc: "\u062A\u0633\u0644\u064A\u0645 \u0634\u062E\u0635\u064A \u0645\u0628\u0627\u0634\u0631 \u0648\u0633\u0631\u064A\u0639 \u062D\u062A\u0649 \u0639\u062A\u0628\u0629 \u0628\u0627\u0628\u0643",
      delivery_estimate_fast: "\u26A1 \u0634\u062D\u0646 \u0633\u0631\u064A\u0639: \u064A\u0635\u0644\u0643 \u062E\u0644\u0627\u0644 <strong>24 \u0625\u0644\u0649 48 \u0633\u0627\u0639\u0629</strong> \u0645\u0639 \u064A\u0627\u0644\u064A\u062F\u064A\u0646 \u0625\u0643\u0633\u0628\u0631\u064A\u0633",
      delivery_estimate_south: "\u26A1 \u0634\u062D\u0646 \u0627\u0644\u062C\u0646\u0648\u0628 \u0648\u0627\u0644\u0647\u0636\u0627\u0628: \u064A\u0635\u0644\u0643 \u062E\u0644\u0627\u0644 <strong>3 \u0625\u0644\u0649 5 \u0623\u064A\u0627\u0645 \u0639\u0645\u0644</strong>",
      // Trust Pillars
      trust_inspect_title: "\u062D\u0642 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639",
      trust_inspect_desc: "\u0627\u0641\u062A\u062D \u0627\u0644\u0637\u0631\u062F \u0648\u0627\u0641\u062D\u0635 \u062C\u0647\u0627\u0632\u0643 \u0648\u062A\u0623\u0643\u062F \u0645\u0646 \u0645\u062D\u062A\u0648\u0627\u0647 \u0623\u0645\u0627\u0645 \u0627\u0644\u0645\u0648\u0632\u0639 \u0642\u0628\u0644 \u062A\u0633\u0644\u064A\u0645 \u0623\u064A \u062F\u064A\u0646\u0627\u0631.",
      trust_cod_title: "\u062F\u0641\u0639 \u0646\u0642\u062F\u064A \u0622\u0645\u0646 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 100%",
      trust_cod_desc: "\u062A\u0633\u0648\u0642 \u0628\u0631\u0627\u062D\u0629 \u0628\u0627\u0644\u060C \u0644\u0627 \u062F\u0641\u0639 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u0628\u0642 \u0648\u0644\u0627 \u0623\u064A \u0645\u062E\u0627\u0637\u0631\u0629. \u0639\u0627\u064A\u0646 \u0623\u0648\u0644\u0627\u064B \u0648\u0627\u062F\u0641\u0639 \u0644\u0627\u062D\u0642\u0627\u064B.",
      trust_shipping_title: "\u0634\u062D\u0646 \u0645\u0624\u0645\u0646 \u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629",
      trust_shipping_desc: "\u062A\u0648\u0632\u064A\u0639 \u0631\u0633\u0645\u064A \u0645\u0639\u062A\u0645\u062F \u0639\u0628\u0631 \u0634\u0628\u0643\u0629 \u064A\u0627\u0644\u064A\u062F\u064A\u0646 \u0625\u0643\u0633\u0628\u0631\u064A\u0633 \u0645\u0639 \u0631\u0642\u0645 \u062A\u062A\u0628\u0639 \u0641\u0648\u0631\u064A.",
      trust_warranty_title: "\u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0631\u0633\u0645\u064A 7 \u0623\u064A\u0627\u0645",
      trust_warranty_desc: "\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0641\u0648\u0631\u064A \u0648\u0645\u062C\u0627\u0646\u064A \u0648\u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u062D\u0627\u0644 \u0648\u062C\u0648\u062F \u0623\u064A \u0639\u064A\u0628 \u0645\u0635\u0646\u0639\u064A.",
      // Validation & Hints
      phone_hint: "10 \u0623\u0631\u0642\u0627\u0645 \u062A\u0628\u062F\u0623 \u0628\u0640 05 \u0623\u0648 06 \u0623\u0648 07",
      phone_valid: "\u2713 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u062C\u0632\u0627\u0626\u0631\u064A \u0635\u0627\u0644\u062D",
      name_hint: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0644\u0642\u0628 \u0643\u0627\u0645\u0644\u0627\u064B",
      name_valid: "\u2713 \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0644\u0642\u0628 \u0645\u0643\u062A\u0645\u0644",
      address_hint: "\u0627\u0644\u0628\u0644\u062F\u064A\u0629 \u0648\u0627\u0644\u062D\u064A \u0623\u0648 \u0627\u0644\u0634\u0627\u0631\u0639",
      // Validation & Messages
      err_name: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0644\u0642\u0628 \u0628\u0648\u0636\u0648\u062D (3 \u0623\u062D\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644).",
      err_phone: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u062C\u0632\u0627\u0626\u0631\u064A \u0635\u0627\u0644\u062D \u0645\u0643\u0648\u0646 \u0645\u0646 10 \u0623\u0631\u0642\u0627\u0645 (05\u060C 06\u060C \u0623\u0648 07).",
      err_state: "\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0648\u0644\u0627\u064A\u0629 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0643\u0644\u0641\u0629 \u0627\u0644\u0634\u062D\u0646.",
      err_address: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0639\u0646\u0648\u0627\u0646 \u062F\u0642\u064A\u0642 (\u0627\u0644\u0628\u0644\u062F\u064A\u0629 \u0648\u0627\u0644\u0634\u0627\u0631\u0639).",
      err_form_general: "\u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629.",
      order_processing: "\u062C\u0627\u0631\u064D \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0637\u0644\u0628\u064A\u0629...",
      order_redirecting: "\u2713 \u062C\u0627\u0631\u064D \u0641\u062A\u062D \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u0644\u062A\u0623\u0643\u064A\u062F...",
      free_badge: "\u0645\u062C\u0627\u0646\u064A",
      stock_low_badge: "\u{1F525} \u0628\u0642\u064A {stock} \u0642\u0637\u0639 \u0641\u0642\u0637!",
      cart_remove: "\u062D\u0630\u0641",
      sold_out: "\u2715 \u0646\u0641\u062F\u062A \u0627\u0644\u0643\u0645\u064A\u0629",
      product_not_found: "\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631",
      browse_all: "\u062A\u0635\u0641\u062D \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A",
      catalog_empty: "\u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C \u0641\u0627\u0631\u063A \u062D\u0627\u0644\u064A\u0627\u064B.",
      toast_stock_limit: "\u062D\u062F \u0627\u0644\u0645\u062E\u0632\u0648\u0646",
      toast_stock_limit_msg: "\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0642\u0635\u0648\u0649 \u0627\u0644\u0645\u062A\u0627\u062D\u0629: {max}",
      toast_cart_empty: "\u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629",
      toast_validation_error: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
      checkout_qty: "\u0627\u0644\u0643\u0645\u064A\u0629"
    }
  };
  var currentLang = StorageService.getLanguage("ar");
  function getCurrentLang() {
    return currentLang;
  }
  function t(key, lang = null) {
    const active = lang || currentLang || "ar";
    const dict = TRANSLATIONS[active] || TRANSLATIONS.ar;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }
  function localize(field, lang = null) {
    if (field === null || field === void 0) return "";
    if (typeof field === "string") return field;
    const active = lang || currentLang || "ar";
    return field[active] || field.ar || field.en || field.fr || "";
  }
  function formatPrice(price, lang = null) {
    const num = Math.round(parseFloat(price) || 0);
    const active = lang || currentLang || "ar";
    const curr = t("currency", active) || (active === "ar" ? "\u062F\u062C" : "DA");
    const formattedNum = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\xA0");
    if (active === "ar") {
      return `\u200E${formattedNum}\u200E\xA0${curr}`;
    }
    return `${formattedNum} ${curr}`;
  }
  function setLanguage(lang, onLanguageChange = null) {
    if (!TRANSLATIONS[lang]) lang = "ar";
    currentLang = lang;
    StorageService.setLanguage(lang);
    const isRtl = lang === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = dict[key];
        } else {
          el.innerHTML = dict[key];
        }
      }
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const key = el.getAttribute("data-i18n-ph");
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });
    if (typeof onLanguageChange === "function") {
      onLanguageChange(lang);
    }
  }
  if (typeof window !== "undefined") {
    window.t = t;
    window.localize = localize;
    window.formatPrice = formatPrice;
    window.setLanguage = setLanguage;
  }

  // admin-products.js
  var currentFilter = {
    search: "",
    category: "all",
    sort: "newest"
  };
  var selectedProductIds = /* @__PURE__ */ new Set();
  var modalState = {
    isOpen: false,
    editingId: null,
    activeTab: "basic",
    activeLangTab: "ar",
    activeSpecsLang: "ar",
    productData: null
  };
  async function renderProductsSection(container) {
    if (!container) return;
    const allProducts = await ProductsService.getAll();
    let filtered = [...allProducts];
    if (currentFilter.search.trim()) {
      const q = currentFilter.search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const idMatch = (p.id || "").toLowerCase().includes(q);
        const arName = (p.name?.ar || "").toLowerCase().includes(q);
        const frName = (p.name?.fr || "").toLowerCase().includes(q);
        const enName = (p.name?.en || "").toLowerCase().includes(q);
        const strName = typeof p.name === "string" ? p.name.toLowerCase().includes(q) : false;
        return idMatch || arName || frName || enName || strName;
      });
    }
    if (currentFilter.category !== "all") {
      filtered = filtered.filter((p) => (p.categoryKey || "").toLowerCase() === currentFilter.category.toLowerCase());
    }
    filtered.sort((a, b) => {
      if (currentFilter.sort === "price-low") return (a.price || 0) - (b.price || 0);
      if (currentFilter.sort === "price-high") return (b.price || 0) - (a.price || 0);
      if (currentFilter.sort === "stock") return (b.stock || 0) - (a.stock || 0);
      if (currentFilter.sort === "name") {
        const nameA = localize(a.name) || "";
        const nameB = localize(b.name) || "";
        return nameA.localeCompare(nameB);
      }
      const timeA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const timeB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return timeB - timeA;
    });
    const isAllSelected = filtered.length > 0 && filtered.every((p) => selectedProductIds.has(p.id));
    container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">\u{1F4E6} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A (${allProducts.length})</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">\u0625\u0636\u0627\u0641\u0629\u060C \u062A\u0639\u062F\u064A\u0644\u060C \u062D\u0630\u0641\u060C \u0648\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0648\u062A\u0635\u062F\u064A\u0631 \u0643\u062A\u0627\u0644\u0648\u062C \u0627\u0644\u0645\u062A\u062C\u0631</span>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn-pill" id="admin-add-product-btn" style="padding:10px 20px;font-size:0.85rem;">
                        + \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u062C\u062F\u064A\u062F
                    </button>
                    <button class="btn-secondary-pill" id="admin-export-products-btn" style="padding:10px 18px;font-size:0.85rem;">
                        \u{1F4E5} \u062A\u0635\u062F\u064A\u0631 (JSON)
                    </button>
                    <label class="btn-secondary-pill" style="padding:10px 18px;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;">
                        \u{1F4E4} \u0627\u0633\u062A\u064A\u0631\u0627\u062F (JSON)
                        <input type="file" id="admin-import-products-input" accept=".json" style="display:none;">
                    </label>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="admin-toolbar">
                <input type="text" class="admin-search-input" id="admin-prod-search" placeholder="\u{1F50D} \u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 (\u0639\u0631\u0628\u064A / \u0641\u0631\u0646\u0633\u064A / \u0625\u0646\u062C\u0644\u064A\u0632\u064A) \u0623\u0648 \u0627\u0644\u0645\u0639\u0631\u0651\u0641 ID..." value="${escapeHTML(currentFilter.search)}">
                
                <select class="admin-select" id="admin-prod-category-filter">
                    <option value="all" ${currentFilter.category === "all" ? "selected" : ""}>\u0643\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645</option>
                    <option value="electronics" ${currentFilter.category === "electronics" ? "selected" : ""}>\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A (Electronics)</option>
                    <option value="fashion" ${currentFilter.category === "fashion" ? "selected" : ""}>\u0623\u0632\u064A\u0627\u0621 \u0648\u0645\u0648\u0636\u0629 (Fashion)</option>
                    <option value="home" ${currentFilter.category === "home" ? "selected" : ""}>\u0645\u0646\u0632\u0644 \u0648\u062F\u064A\u0643\u0648\u0631 (Home)</option>
                    <option value="health" ${currentFilter.category === "health" ? "selected" : ""}>\u0635\u062D\u0629 \u0648\u0639\u0646\u0627\u064A\u0629 (Health)</option>
                </select>

                <select class="admin-select" id="admin-prod-sort">
                    <option value="newest" ${currentFilter.sort === "newest" ? "selected" : ""}>\u0627\u0644\u0623\u062D\u062F\u062B \u0625\u0636\u0627\u0641\u0629</option>
                    <option value="price-low" ${currentFilter.sort === "price-low" ? "selected" : ""}>\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0642\u0644 \u0644\u0644\u0623\u0639\u0644\u0649</option>
                    <option value="price-high" ${currentFilter.sort === "price-high" ? "selected" : ""}>\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0623\u0642\u0644</option>
                    <option value="stock" ${currentFilter.sort === "stock" ? "selected" : ""}>\u0627\u0644\u0623\u0643\u062B\u0631 \u062A\u0648\u0641\u0631\u0627\u064B \u0641\u064A \u0627\u0644\u0645\u062E\u0632\u0648\u0646</option>
                    <option value="name" ${currentFilter.sort === "name" ? "selected" : ""}>\u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0623\u0628\u062C\u062F\u064A</option>
                </select>
            </div>

            <!-- Products Table -->
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="width:40px;text-align:center;">
                                <input type="checkbox" id="admin-select-all-prods" ${isAllSelected ? "checked" : ""}>
                            </th>
                            <th style="width:60px;">\u0627\u0644\u0635\u0648\u0631\u0629</th>
                            <th>\u0627\u0644\u0627\u0633\u0645 (\u0627\u0644\u0639\u0631\u0628\u064A\u0629)</th>
                            <th>\u0627\u0644\u0642\u0633\u0645</th>
                            <th>\u0627\u0644\u0633\u0639\u0631</th>
                            <th>\u0627\u0644\u0645\u062E\u0632\u0648\u0646</th>
                            <th>\u0627\u0644\u0634\u0627\u0631\u0629</th>
                            <th>\u0627\u0644\u062D\u0627\u0644\u0629</th>
                            <th style="text-align:center;">\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `
                            <tr>
                                <td colspan="9" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
                                    \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u064A \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0628\u062D\u062B.
                                </td>
                            </tr>
                        ` : filtered.map((p) => {
      const isSelected = selectedProductIds.has(p.id);
      const nameAr = p.name?.ar || (typeof p.name === "string" ? p.name : p.name?.en || "\u0628\u062F\u0648\u0646 \u0627\u0633\u0645");
      const catKey = p.categoryKey || "general";
      const catName = p.category?.ar || (typeof p.category === "string" ? p.category : catKey);
      const priceFormatted = formatPrice(p.price || 0);
      const oldPriceHTML = p.oldPrice ? `<div style="font-size:0.75rem;text-decoration:line-through;color:var(--text-muted);">${formatPrice(p.oldPrice)}</div>` : "";
      const stock = typeof p.stock === "number" ? p.stock : 0;
      const badge = p.badge?.ar || (typeof p.badge === "string" ? p.badge : "") || "-";
      const imageSrc = sanitizeURL(p.image, "assets/product-image.png");
      let statusPill = "";
      const now = (/* @__PURE__ */ new Date()).getTime();
      const added = p.addedAt ? new Date(p.addedAt).getTime() : 0;
      const isNew = now - added < 7 * 24 * 60 * 60 * 1e3;
      if (stock === 0) {
        statusPill = `<span class="status-pill out-of-stock">\u0646\u0641\u062F \u0627\u0644\u0645\u062E\u0632\u0648\u0646</span>`;
      } else if (stock <= 5) {
        statusPill = `<span class="status-pill low-stock">\u0645\u062E\u0632\u0648\u0646 \u0645\u0646\u062E\u0641\u0636 (${stock})</span>`;
      } else if (isNew) {
        statusPill = `<span class="status-pill new">\u062C\u062F\u064A\u062F \u2728</span>`;
      } else {
        statusPill = `<span class="status-pill in-stock">\u0645\u062A\u0648\u0641\u0631 (${stock})</span>`;
      }
      return `
                                <tr data-id="${escapeHTML(p.id)}">
                                    <td style="text-align:center;">
                                        <input type="checkbox" class="admin-prod-checkbox" data-id="${escapeHTML(p.id)}" ${isSelected ? "checked" : ""}>
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
                                        <strong style="color:${stock <= 5 ? "#dc2626" : "inherit"};">${stock}</strong>
                                    </td>
                                    <td>
                                        <span style="font-size:0.75rem;background:var(--surface-container-low);padding:2px 8px;border-radius:12px;">${escapeHTML(badge)}</span>
                                    </td>
                                    <td>${statusPill}</td>
                                    <td>
                                        <div class="row-actions" style="justify-content:center;">
                                            <button class="admin-action-btn edit-prod-btn" data-id="${escapeHTML(p.id)}" title="\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C">\u270F\uFE0F</button>
                                            <button class="admin-action-btn dup-prod-btn" data-id="${escapeHTML(p.id)}" title="\u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u0645\u0646\u062A\u062C">\u{1F4CB}</button>
                                            <button class="admin-action-btn delete delete-prod-btn" data-id="${escapeHTML(p.id)}" title="\u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C">\u{1F5D1}\uFE0F</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
    }).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Bulk Floating Bar -->
        <div class="bulk-bar ${selectedProductIds.size > 0 ? "visible" : ""}" id="admin-bulk-bar">
            <span>\u062A\u0645 \u062A\u062D\u062F\u064A\u062F <strong>${selectedProductIds.size}</strong> \u0645\u0646\u062A\u062C</span>
            <button id="admin-bulk-dup-btn">\u0646\u0633\u062E \u0627\u0644\u0645\u062D\u062F\u062F</button>
            <button class="delete-btn" id="admin-bulk-delete-btn">\u062D\u0630\u0641 \u0627\u0644\u0645\u062D\u062F\u062F</button>
        </div>

        <!-- Product Modal Container -->
        <div id="product-modal-placeholder"></div>
    `;
    bindProductSectionEvents(container);
  }
  function bindProductSectionEvents(container) {
    const searchInput = container.querySelector("#admin-prod-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentFilter.search = e.target.value;
        renderProductsSection(container);
        const newSearch = container.querySelector("#admin-prod-search");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }
    const catFilter = container.querySelector("#admin-prod-category-filter");
    if (catFilter) {
      catFilter.addEventListener("change", (e) => {
        currentFilter.category = e.target.value;
        renderProductsSection(container);
      });
    }
    const sortFilter = container.querySelector("#admin-prod-sort");
    if (sortFilter) {
      sortFilter.addEventListener("change", (e) => {
        currentFilter.sort = e.target.value;
        renderProductsSection(container);
      });
    }
    const addBtn = container.querySelector("#admin-add-product-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => openProductModal(null, container));
    }
    const exportBtn = container.querySelector("#admin-export-products-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", exportProductsJSON);
    }
    const importInput = container.querySelector("#admin-import-products-input");
    if (importInput) {
      importInput.addEventListener("change", (e) => importProductsJSON(e, container));
    }
    const selectAllCheckbox = container.querySelector("#admin-select-all-prods");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", async (e) => {
        const allProducts = await ProductsService.getAll();
        if (e.target.checked) {
          allProducts.forEach((p) => selectedProductIds.add(p.id));
        } else {
          selectedProductIds.clear();
        }
        await renderProductsSection(container);
      });
    }
    container.querySelectorAll(".admin-prod-checkbox").forEach((cb) => {
      cb.addEventListener("change", async (e) => {
        const id = cb.getAttribute("data-id");
        if (e.target.checked) selectedProductIds.add(id);
        else selectedProductIds.delete(id);
        await renderProductsSection(container);
      });
    });
    container.querySelectorAll(".edit-prod-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await openProductModal(id, container);
      });
    });
    container.querySelectorAll(".dup-prod-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        await duplicateProduct(id, container);
      });
    });
    container.querySelectorAll(".delete-prod-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm(`\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0631\u063A\u0628\u062A\u0643 \u0641\u064A \u062D\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C (${id}) \u0646\u0647\u0627\u0626\u064A\u0627\u064B\u061F`)) {
          await deleteProduct(id, container);
        }
      });
    });
    const bulkDeleteBtn = container.querySelector("#admin-bulk-delete-btn");
    if (bulkDeleteBtn) {
      bulkDeleteBtn.addEventListener("click", async () => {
        if (confirm(`\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0630\u0641 ${selectedProductIds.size} \u0645\u0646\u062A\u062C \u0645\u062D\u062F\u062F \u0646\u0647\u0627\u0626\u064A\u0627\u064B\u061F`)) {
          const all = (await ProductsService.getAll()).filter((p) => !selectedProductIds.has(p.id));
          await ProductsService.saveAll(all);
          selectedProductIds.clear();
          window.adminToast?.("\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0628\u0646\u062C\u0627\u062D", "success");
          await renderProductsSection(container);
        }
      });
    }
    const bulkDupBtn = container.querySelector("#admin-bulk-dup-btn");
    if (bulkDupBtn) {
      bulkDupBtn.addEventListener("click", async () => {
        const all = await ProductsService.getAll();
        const toDup = all.filter((p) => selectedProductIds.has(p.id));
        toDup.forEach((original) => {
          const copy = JSON.parse(JSON.stringify(original));
          copy.id = "prod_" + Math.floor(1e5 + Math.random() * 9e5);
          if (typeof copy.name === "object") {
            if (copy.name.ar) copy.name.ar += " (\u0646\u0633\u062E\u0629)";
            if (copy.name.fr) copy.name.fr += " (copie)";
            if (copy.name.en) copy.name.en += " (copy)";
          } else {
            copy.name = String(copy.name) + " (copy)";
          }
          copy.addedAt = (/* @__PURE__ */ new Date()).toISOString();
          all.unshift(copy);
        });
        await ProductsService.saveAll(all);
        selectedProductIds.clear();
        window.adminToast?.("\u062A\u0645 \u0627\u0633\u062A\u0646\u0633\u0627\u062E \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0628\u0646\u062C\u0627\u062D", "success");
        await renderProductsSection(container);
      });
    }
  }
  async function openProductModal(productId = null, container = null) {
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
        id: "prod_" + Math.floor(1e5 + Math.random() * 9e5),
        categoryKey: "electronics",
        name: { ar: "", fr: "", en: "" },
        category: { ar: "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A", fr: "\xC9lectronique", en: "Electronics" },
        badge: { ar: "", fr: "", en: "" },
        price: 5e3,
        oldPrice: null,
        rating: 5,
        reviewsCount: 10,
        stock: 15,
        image: "assets/product-image.png",
        gallery: [],
        shortDesc: { ar: "", fr: "", en: "" },
        description: { ar: "", fr: "", en: "" },
        specs: {
          ar: { "\u0627\u0644\u0636\u0645\u0627\u0646": "12 \u0634\u0647\u0631\u0627\u064B \u0631\u0633\u0645\u064A" },
          fr: { "Garantie": "12 mois officiel" },
          en: { "Warranty": "12 months official" }
        },
        addedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (typeof product.name === "string") product.name = { ar: product.name, fr: product.name, en: product.name };
    if (typeof product.category === "string") product.category = { ar: product.category, fr: product.category, en: product.category };
    if (typeof product.badge === "string") product.badge = { ar: product.badge, fr: product.badge, en: product.badge };
    if (typeof product.shortDesc === "string") product.shortDesc = { ar: product.shortDesc, fr: product.shortDesc, en: product.shortDesc };
    if (typeof product.description === "string") product.description = { ar: product.description, fr: product.description, en: product.description };
    if (!product.specs || typeof product.specs !== "object") product.specs = { ar: {}, fr: {}, en: {} };
    if (!product.specs.ar) product.specs.ar = {};
    if (!product.specs.fr) product.specs.fr = {};
    if (!product.specs.en) product.specs.en = {};
    modalState = {
      isOpen: true,
      editingId: productId,
      activeTab: "basic",
      activeLangTab: "ar",
      activeSpecsLang: "ar",
      productData: product
    };
    renderModalDOM(container);
  }
  function renderModalDOM(container) {
    let modalWrapper = document.getElementById("admin-product-modal-root");
    if (!modalWrapper) {
      modalWrapper = document.createElement("div");
      modalWrapper.id = "admin-product-modal-root";
      document.body.appendChild(modalWrapper);
    }
    const p = modalState.productData;
    const isEdit = !!modalState.editingId;
    modalWrapper.innerHTML = `
        <div class="admin-modal-overlay open">
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <h3>${isEdit ? `\u270F\uFE0F \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C (${escapeHTML(p.id)})` : "\u2728 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u062C\u062F\u064A\u062F"}</h3>
                    <button class="modal-close-btn" id="modal-close-x">\u2715</button>
                </div>

                <!-- Main Tabs -->
                <div class="admin-modal-tabs">
                    <button class="admin-tab-btn ${modalState.activeTab === "basic" ? "active" : ""}" data-tab="basic">\u2699\uFE0F \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0627\u062A</button>
                    <button class="admin-tab-btn ${modalState.activeTab === "multi" ? "active" : ""}" data-tab="multi">\u{1F310} \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0627\u0644\u0644\u063A\u0627\u062A</button>
                    <button class="admin-tab-btn ${modalState.activeTab === "specs" ? "active" : ""}" data-tab="specs">\u{1F4CB} \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629</button>
                    <button class="admin-tab-btn ${modalState.activeTab === "gallery" ? "active" : ""}" data-tab="gallery">\u{1F5BC}\uFE0F \u0645\u0639\u0631\u0636 \u0627\u0644\u0635\u0648\u0631 (${(p.gallery || []).length})</button>
                    <button class="admin-tab-btn ${modalState.activeTab === "advanced" ? "active" : ""}" data-tab="advanced">\u26A1 \u062E\u064A\u0627\u0631\u0627\u062A \u0645\u062A\u0642\u062F\u0645\u0629</button>
                </div>

                <!-- Tab Contents -->
                <div class="admin-modal-body">
                    <!-- 1. Basic Tab -->
                    <div id="tab-pane-basic" style="display:${modalState.activeTab === "basic" ? "block" : "none"};">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0646\u062A\u062C (ID) *</label>
                                <input type="text" class="admin-input" id="inp-id" value="${escapeHTML(p.id)}" ${isEdit ? 'readonly style="background:var(--surface-container-low);"' : ""}>
                                <span class="error-inline" id="err-id"></span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0642\u0633\u0645 (Category Key) *</label>
                                <select class="admin-select" id="inp-catkey" style="border-radius:var(--radius-md);">
                                    <option value="electronics" ${p.categoryKey === "electronics" ? "selected" : ""}>\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A (electronics)</option>
                                    <option value="fashion" ${p.categoryKey === "fashion" ? "selected" : ""}>\u0623\u0632\u064A\u0627\u0621 (fashion)</option>
                                    <option value="home" ${p.categoryKey === "home" ? "selected" : ""}>\u0645\u0646\u0632\u0644 \u0648\u062F\u064A\u0643\u0648\u0631 (home)</option>
                                    <option value="health" ${p.categoryKey === "health" ? "selected" : ""}>\u0635\u062D\u0629 \u0648\u0639\u0646\u0627\u064A\u0629 (health)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062D\u0627\u0644\u064A (\u062F\u062C) *</label>
                                <input type="number" class="admin-input" id="inp-price" min="0" max="10000000" value="${p.price}">
                                <span class="error-inline" id="err-price"></span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0633\u0627\u0628\u0642 \u0642\u0628\u0644 \u0627\u0644\u062A\u062E\u0641\u064A\u0636 (\u062F\u062C - \u0627\u062E\u062A\u064A\u0627\u0631\u064A)</label>
                                <input type="number" class="admin-input" id="inp-oldprice" min="0" max="10000000" value="${p.oldPrice || ""}" placeholder="\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B \u0625\u0646 \u0644\u0645 \u064A\u0643\u0646 \u0647\u0646\u0627\u0643 \u062A\u062E\u0641\u064A\u0636">
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0648\u0641\u0631 *</label>
                                <input type="number" class="admin-input" id="inp-stock" min="0" max="999" value="${p.stock}">
                                <span class="error-inline" id="err-stock"></span>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">\u0627\u0644\u062A\u0642\u064A\u064A\u0645 (0 - 5 \u0646\u062C\u0648\u0645)</label>
                                <input type="number" step="0.1" min="1" max="5" class="admin-input" id="inp-rating" value="${p.rating || 4.9}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0639\u062F\u062F \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A</label>
                                <input type="number" min="0" class="admin-input" id="inp-reviews" value="${p.reviewsCount || 24}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0646\u0648\u0639 \u0627\u0644\u0634\u0627\u0631\u0629 (Badge Class)</label>
                                <select class="admin-select" id="inp-badge-class" style="border-radius:var(--radius-md);">
                                    <option value="">\u0628\u062F\u0648\u0646 \u0634\u0627\u0631\u0629 \u062E\u0627\u0635\u0629</option>
                                    <option value="bestseller" ${String(p.badge?.en || "").toUpperCase().includes("BEST") ? "selected" : ""}>\u0627\u0644\u0623\u0643\u062B\u0631 \u0645\u0628\u064A\u0639\u0627\u064B (Bestseller)</option>
                                    <option value="sale" ${String(p.badge?.en || "").toUpperCase().includes("SALE") ? "selected" : ""}>\u062A\u062E\u0641\u064A\u0636 \u062E\u0627\u0635 (Sale)</option>
                                    <option value="new" ${String(p.badge?.en || "").toUpperCase().includes("NEW") ? "selected" : ""}>\u062C\u062F\u064A\u062F (New)</option>
                                    <option value="hot">\u0631\u0627\u0626\u062C (Hot)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label class="form-label">\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 *</label>
                            <div style="display:flex;gap:12px;align-items:center;">
                                <input type="text" class="admin-input" id="inp-image" value="${escapeHTML(p.image)}" placeholder="assets/product-image.png \u0623\u0648 \u0631\u0627\u0628\u0637 https://">
                                <img src="${sanitizeURL(p.image, "assets/product-image.png")}" id="img-live-preview" style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid var(--border-light);" onerror="this.src='assets/product-image.png'">
                            </div>
                            <span class="error-inline" id="err-image"></span>
                        </div>
                    </div>

                    <!-- 2. Multilingual Tab -->
                    <div id="tab-pane-multi" style="display:${modalState.activeTab === "multi" ? "block" : "none"};">
                        <div style="display:flex;gap:8px;margin-bottom:18px;border-bottom:1px solid var(--border-light);padding-bottom:10px;">
                            <button class="btn-pill sub-lang-btn ${modalState.activeLangTab === "ar" ? "" : "btn-secondary-pill"}" data-lang="ar" style="padding:6px 14px;font-size:0.8rem;">\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (\u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629) \u{1F1E9}\u{1F1FF}</button>
                            <button class="btn-pill sub-lang-btn ${modalState.activeLangTab === "fr" ? "" : "btn-secondary-pill"}" data-lang="fr" style="padding:6px 14px;font-size:0.8rem;">Fran\xE7ais \u{1F1EB}\u{1F1F7}</button>
                            <button class="btn-pill sub-lang-btn ${modalState.activeLangTab === "en" ? "" : "btn-secondary-pill"}" data-lang="en" style="padding:6px 14px;font-size:0.8rem;">English \u{1F1EC}\u{1F1E7}</button>
                        </div>

                        <!-- AR Sub -->
                        <div class="lang-sub-pane" style="display:${modalState.activeLangTab === "ar" ? "block" : "none"};">
                            <div class="form-group">
                                <label class="form-label">\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 *</label>
                                <input type="text" class="admin-input" id="inp-name-ar" value="${escapeHTML(p.name?.ar || "")}" placeholder="\u0645\u062B\u0627\u0644: \u0633\u0645\u0627\u0639\u0627\u062A \u0633\u0648\u0646\u064A WH-1000XM5 \u0627\u0644\u0644\u0627\u0633\u0644\u0643\u064A\u0629">
                                <span class="error-inline" id="err-name-ar"></span>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">\u0627\u0633\u0645 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0645\u0639\u0631\u0648\u0636 (\u0639\u0631\u0628\u064A)</label>
                                    <input type="text" class="admin-input" id="inp-cat-ar" value="${escapeHTML(p.category?.ar || "")}" placeholder="\u0645\u062B\u0627\u0644: \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A \u0648\u0635\u0648\u062A\u064A\u0627\u062A">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">\u0646\u0635 \u0627\u0644\u0634\u0627\u0631\u0629 (\u0639\u0631\u0628\u064A)</label>
                                    <input type="text" class="admin-input" id="inp-badge-ar" value="${escapeHTML(p.badge?.ar || "")}" placeholder="\u0645\u062B\u0627\u0644: \u0627\u0644\u0623\u0643\u062B\u0631 \u0645\u0628\u064A\u0639\u0627\u064B">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0648\u0635\u0641 \u0642\u0635\u064A\u0631 \u0644\u0644\u0628\u0637\u0627\u0642\u0629 (\u0639\u0631\u0628\u064A)</label>
                                <input type="text" class="admin-input" id="inp-short-ar" value="${escapeHTML(p.shortDesc?.ar || "")}" placeholder="\u064A\u0638\u0647\u0631 \u0641\u064A \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C">
                            </div>
                            <div class="form-group">
                                <label class="form-label">\u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u0627\u0644\u0645\u0641\u0635\u0651\u0644 (\u0639\u0631\u0628\u064A)</label>
                                <textarea class="admin-textarea" id="inp-desc-ar">${escapeHTML(p.description?.ar || "")}</textarea>
                            </div>
                        </div>

                        <!-- FR Sub -->
                        <div class="lang-sub-pane" style="display:${modalState.activeLangTab === "fr" ? "block" : "none"};">
                            <div class="form-group">
                                <label class="form-label">Nom du produit (Fran\xE7ais)</label>
                                <input type="text" class="admin-input" id="inp-name-fr" value="${escapeHTML(p.name?.fr || "")}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Cat\xE9gorie affich\xE9e (FR)</label>
                                    <input type="text" class="admin-input" id="inp-cat-fr" value="${escapeHTML(p.category?.fr || "")}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Texte du badge (FR)</label>
                                    <input type="text" class="admin-input" id="inp-badge-fr" value="${escapeHTML(p.badge?.fr || "")}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description courte (FR)</label>
                                <input type="text" class="admin-input" id="inp-short-fr" value="${escapeHTML(p.shortDesc?.fr || "")}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description d\xE9taill\xE9e (FR)</label>
                                <textarea class="admin-textarea" id="inp-desc-fr">${escapeHTML(p.description?.fr || "")}</textarea>
                            </div>
                        </div>

                        <!-- EN Sub -->
                        <div class="lang-sub-pane" style="display:${modalState.activeLangTab === "en" ? "block" : "none"};">
                            <div class="form-group">
                                <label class="form-label">Product Name (English)</label>
                                <input type="text" class="admin-input" id="inp-name-en" value="${escapeHTML(p.name?.en || "")}">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Display Category (EN)</label>
                                    <input type="text" class="admin-input" id="inp-cat-en" value="${escapeHTML(p.category?.en || "")}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Badge Text (EN)</label>
                                    <input type="text" class="admin-input" id="inp-badge-en" value="${escapeHTML(p.badge?.en || "")}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Short Description (EN)</label>
                                <input type="text" class="admin-input" id="inp-short-en" value="${escapeHTML(p.shortDesc?.en || "")}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Detailed Description (EN)</label>
                                <textarea class="admin-textarea" id="inp-desc-en">${escapeHTML(p.description?.en || "")}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Specs Tab -->
                    <div id="tab-pane-specs" style="display:${modalState.activeTab === "specs" ? "block" : "none"};">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
                            <div style="display:flex;gap:8px;">
                                <button type="button" class="btn-pill spec-lang-btn ${modalState.activeSpecsLang === "ar" ? "" : "btn-secondary-pill"}" data-speclang="ar" style="padding:6px 14px;font-size:0.8rem;">\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u{1F1E9}\u{1F1FF}</button>
                                <button type="button" class="btn-pill spec-lang-btn ${modalState.activeSpecsLang === "fr" ? "" : "btn-secondary-pill"}" data-speclang="fr" style="padding:6px 14px;font-size:0.8rem;">Fran\xE7ais \u{1F1EB}\u{1F1F7}</button>
                                <button type="button" class="btn-pill spec-lang-btn ${modalState.activeSpecsLang === "en" ? "" : "btn-secondary-pill"}" data-speclang="en" style="padding:6px 14px;font-size:0.8rem;">English \u{1F1EC}\u{1F1E7}</button>
                            </div>
                            <button type="button" class="btn-secondary-pill" id="btn-add-spec-row" style="padding:6px 14px;font-size:0.8rem;">+ \u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0627\u0635\u0641\u0629</button>
                        </div>
                        <div id="specs-rows-container">
                            ${renderSpecsEditorRows(p.specs?.[modalState.activeSpecsLang || "ar"] || {}, modalState.activeSpecsLang || "ar")}
                        </div>
                    </div>

                    <!-- 4. Gallery Tab -->
                    <div id="tab-pane-gallery" style="display:${modalState.activeTab === "gallery" ? "block" : "none"};">
                        <div style="margin-bottom:16px;">
                            <label class="form-label">\u0625\u0636\u0627\u0641\u0629 \u0635\u0648\u0631\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 \u0644\u0644\u0645\u0639\u0631\u0636</label>
                            <div style="display:flex;gap:10px;">
                                <input type="text" class="admin-input" id="new-gallery-url" placeholder="https://... \u0623\u0648 assets/...">
                                <button type="button" class="btn-pill" id="btn-add-gallery-item" style="padding:10px 18px;white-space:nowrap;">+ \u0625\u0636\u0627\u0641\u0629</button>
                            </div>
                        </div>
                        <div id="gallery-items-container" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:12px;">
                            ${(p.gallery || []).map((img, idx) => `
                                <div style="position:relative;border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;background:var(--surface-container-low);padding:6px;text-align:center;">
                                    <img src="${sanitizeURL(img, "assets/product-image.png")}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;" onerror="this.src='assets/product-image.png'">
                                    <div style="margin-top:6px;display:flex;justify-content:center;gap:6px;">
                                        <button type="button" class="admin-action-btn del-gal-btn" data-idx="${idx}" title="\u062D\u0630\u0641">\u{1F5D1}\uFE0F</button>
                                        <button type="button" class="admin-action-btn set-primary-gal-btn" data-url="${escapeHTML(img)}" title="\u062A\u0639\u064A\u064A\u0646 \u0643\u0635\u0648\u0631\u0629 \u0631\u0626\u064A\u0633\u064A\u0629">\u2B50</button>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    </div>

                    <!-- 5. Advanced Tab -->
                    <div id="tab-pane-advanced" style="display:${modalState.activeTab === "advanced" ? "block" : "none"};">
                        <div class="form-group">
                            <label class="form-label">\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u0629 (addedAt)</label>
                            <input type="text" class="admin-input" id="inp-added-at" value="${escapeHTML(p.addedAt || (/* @__PURE__ */ new Date()).toISOString())}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0635\u0641\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 (JSON Metadata)</label>
                            <textarea class="admin-textarea" id="inp-custom-meta" style="font-family:monospace;font-size:0.8rem;">${escapeHTML(JSON.stringify(p.metadata || {}, null, 2))}</textarea>
                            <span class="error-inline" id="err-meta"></span>
                        </div>
                    </div>
                </div>

                <div class="admin-modal-footer">
                    <button type="button" class="btn-secondary-pill" id="modal-cancel-btn">\u0625\u0644\u063A\u0627\u0621</button>
                    <button type="button" class="btn-pill" id="modal-save-product-btn">\u062D\u0641\u0638 \u0627\u0644\u0645\u0646\u062A\u062C</button>
                </div>
            </div>
        </div>
    `;
    bindModalEvents(modalWrapper, container);
  }
  function renderSpecsEditorRows(specsObj, lang = "ar") {
    const entries = Object.entries(specsObj || {});
    if (entries.length === 0) {
      const hintText = lang === "ar" ? '\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0645\u062F\u062E\u0644\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0644\u063A\u0629 \u062D\u0627\u0644\u064A\u0627\u064B. \u0627\u0636\u063A\u0637 \u0639\u0644\u0649 "+ \u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0627\u0635\u0641\u0629" \u0644\u0625\u0636\u0627\u0641\u0629 \u062E\u0635\u0627\u0626\u0635 \u0645\u062B\u0644 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629\u060C \u0627\u0644\u0648\u0632\u0646\u060C \u0627\u0644\u0644\u0648\u0646.' : lang === "fr" ? 'Aucune sp\xE9cification saisie pour cette langue. Cliquez sur "+ Ajouter" pour ins\xE9rer des propri\xE9t\xE9s.' : 'No specifications entered for this language yet. Click "+ Add" to insert specs.';
      return `<div class="empty-specs-hint" style="color:var(--text-muted);font-size:0.85rem;padding:12px;text-align:center;">${escapeHTML(hintText)}</div>`;
    }
    const keyPlaceholder = lang === "ar" ? "\u0627\u0644\u062E\u0627\u0635\u064A\u0629 (\u0645\u062B\u0627\u0644: \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629)" : lang === "fr" ? "Propri\xE9t\xE9 (ex: Batterie)" : "Feature (e.g. Battery)";
    const valPlaceholder = lang === "ar" ? "\u0627\u0644\u0642\u064A\u0645\u0629 (\u0645\u062B\u0627\u0644: 30 \u0633\u0627\u0639\u0629)" : lang === "fr" ? "Valeur (ex: 30 heures)" : "Value (e.g. 30 hours)";
    return entries.map(([k, v], idx) => `
        <div class="spec-edit-row" style="display:flex;gap:10px;margin-bottom:10px;align-items:center;">
            <input type="text" class="admin-input spec-key-inp" value="${escapeHTML(k)}" placeholder="${escapeHTML(keyPlaceholder)}" style="flex:1;">
            <input type="text" class="admin-input spec-val-inp" value="${escapeHTML(v)}" placeholder="${escapeHTML(valPlaceholder)}" style="flex:2;">
            <button type="button" class="admin-action-btn delete remove-spec-row-btn" data-idx="${idx}" title="\u062D\u0630\u0641">\u2715</button>
        </div>
    `).join("");
  }
  function bindModalEvents(modalWrapper, container) {
    const closeBtn = modalWrapper.querySelector("#modal-close-x");
    const cancelBtn = modalWrapper.querySelector("#modal-cancel-btn");
    const overlay = modalWrapper.querySelector(".admin-modal-overlay");
    const closeModal = () => {
      modalState.isOpen = false;
      modalWrapper.innerHTML = "";
    };
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
    }
    modalWrapper.querySelectorAll(".admin-modal-tabs .admin-tab-btn").forEach((btn) => {
      btn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        modalState.activeTab = btn.getAttribute("data-tab");
        renderModalDOM(container);
      };
    });
    modalWrapper.querySelectorAll(".sub-lang-btn").forEach((btn) => {
      btn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        modalState.activeLangTab = btn.getAttribute("data-lang");
        renderModalDOM(container);
      };
    });
    const imageInput = modalWrapper.querySelector("#inp-image");
    const imgPreview = modalWrapper.querySelector("#img-live-preview");
    if (imageInput && imgPreview) {
      imageInput.addEventListener("input", () => {
        imgPreview.src = sanitizeURL(imageInput.value, "assets/product-image.png");
      });
    }
    modalWrapper.querySelectorAll(".spec-lang-btn").forEach((btn) => {
      btn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        modalState.activeSpecsLang = btn.getAttribute("data-speclang") || "ar";
        renderModalDOM(container);
      };
    });
    const addSpecBtn = modalWrapper.querySelector("#btn-add-spec-row");
    if (addSpecBtn) {
      addSpecBtn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        const specLang = modalState.activeSpecsLang || "ar";
        if (!modalState.productData.specs) modalState.productData.specs = { ar: {}, fr: {}, en: {} };
        if (!modalState.productData.specs[specLang]) modalState.productData.specs[specLang] = {};
        const defaultLabel = specLang === "ar" ? "\u062E\u0627\u0635\u064A\u0629" : specLang === "fr" ? "Caract\xE9ristique" : "Feature";
        const count = Object.keys(modalState.productData.specs[specLang]).length + 1;
        const uniqueKey = `${defaultLabel} ${count}`;
        const defaultValue = specLang === "ar" ? "\u0627\u0644\u0642\u064A\u0645\u0629" : specLang === "fr" ? "Valeur" : "Value";
        modalState.productData.specs[specLang][uniqueKey] = defaultValue;
        renderModalDOM(container);
      };
    }
    modalWrapper.querySelectorAll(".remove-spec-row-btn").forEach((btn) => {
      btn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        const specLang = modalState.activeSpecsLang || "ar";
        const row = btn.closest(".spec-edit-row");
        if (row) {
          const k = row.querySelector(".spec-key-inp")?.value;
          if (k && modalState.productData.specs?.[specLang]) {
            delete modalState.productData.specs[specLang][k];
          }
        }
        renderModalDOM(container);
      };
    });
    const addGalBtn = modalWrapper.querySelector("#btn-add-gallery-item");
    const galUrlInp = modalWrapper.querySelector("#new-gallery-url");
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
    modalWrapper.querySelectorAll(".del-gal-btn").forEach((btn) => {
      btn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        if (!isNaN(idx) && Array.isArray(modalState.productData.gallery)) {
          modalState.productData.gallery.splice(idx, 1);
          renderModalDOM(container);
        }
      };
    });
    modalWrapper.querySelectorAll(".set-primary-gal-btn").forEach((btn) => {
      btn.onclick = () => {
        collectCurrentModalInputs(modalWrapper);
        const url = btn.getAttribute("data-url");
        if (url) {
          modalState.productData.image = url;
          renderModalDOM(container);
        }
      };
    });
    const saveBtn = modalWrapper.querySelector("#modal-save-product-btn");
    if (saveBtn) {
      saveBtn.onclick = async () => {
        collectCurrentModalInputs(modalWrapper);
        if (await validateAndSaveProduct(modalWrapper, container)) {
          closeModal();
        }
      };
    }
  }
  function collectCurrentModalInputs(modalWrapper = null) {
    const root = modalWrapper || document.getElementById("admin-product-modal-root") || document;
    const p = modalState.productData;
    if (!p) return;
    const getVal = (id2) => root.querySelector("#" + id2)?.value;
    const id = getVal("inp-id");
    if (id) p.id = id.trim();
    const catKey = getVal("inp-catkey");
    if (catKey) p.categoryKey = catKey;
    const price = getVal("inp-price");
    if (price !== void 0) p.price = safePrice(price);
    const oldPrice = getVal("inp-oldprice");
    p.oldPrice = oldPrice ? safePrice(oldPrice) : null;
    const stock = getVal("inp-stock");
    if (stock !== void 0) p.stock = Math.max(0, parseInt(stock, 10) || 0);
    const rating = getVal("inp-rating");
    if (rating !== void 0) p.rating = parseFloat(rating) || 4.9;
    const reviews = getVal("inp-reviews");
    if (reviews !== void 0) p.reviewsCount = parseInt(reviews, 10) || 0;
    const img = getVal("inp-image");
    if (img) p.image = img.trim();
    const nameAr = getVal("inp-name-ar");
    if (nameAr !== void 0) p.name.ar = nameAr.trim();
    const nameFr = getVal("inp-name-fr");
    if (nameFr !== void 0) p.name.fr = nameFr.trim();
    const nameEn = getVal("inp-name-en");
    if (nameEn !== void 0) p.name.en = nameEn.trim();
    const catAr = getVal("inp-cat-ar");
    if (catAr !== void 0) p.category.ar = catAr.trim();
    const catFr = getVal("inp-cat-fr");
    if (catFr !== void 0) p.category.fr = catFr.trim();
    const catEn = getVal("inp-cat-en");
    if (catEn !== void 0) p.category.en = catEn.trim();
    const badgeAr = getVal("inp-badge-ar");
    if (badgeAr !== void 0) p.badge.ar = badgeAr.trim();
    const badgeFr = getVal("inp-badge-fr");
    if (badgeFr !== void 0) p.badge.fr = badgeFr.trim();
    const badgeEn = getVal("inp-badge-en");
    if (badgeEn !== void 0) p.badge.en = badgeEn.trim();
    const shortAr = getVal("inp-short-ar");
    if (shortAr !== void 0) p.shortDesc.ar = shortAr.trim();
    const shortFr = getVal("inp-short-fr");
    if (shortFr !== void 0) p.shortDesc.fr = shortFr.trim();
    const shortEn = getVal("inp-short-en");
    if (shortEn !== void 0) p.shortDesc.en = shortEn.trim();
    const descAr = getVal("inp-desc-ar");
    if (descAr !== void 0) p.description.ar = descAr.trim();
    const descFr = getVal("inp-desc-fr");
    if (descFr !== void 0) p.description.fr = descFr.trim();
    const descEn = getVal("inp-desc-en");
    if (descEn !== void 0) p.description.en = descEn.trim();
    const specsContainer = root.querySelector("#specs-rows-container");
    if (specsContainer) {
      const specRows = root.querySelectorAll(".spec-edit-row");
      const specLang = modalState.activeSpecsLang || "ar";
      if (!p.specs) p.specs = { ar: {}, fr: {}, en: {} };
      if (!p.specs[specLang]) p.specs[specLang] = {};
      const specsMap = {};
      specRows.forEach((row) => {
        const k = row.querySelector(".spec-key-inp")?.value?.trim();
        const v = row.querySelector(".spec-val-inp")?.value?.trim();
        if (k) specsMap[k] = v || "";
      });
      p.specs[specLang] = specsMap;
    }
    const addedAt = getVal("inp-added-at");
    if (addedAt) p.addedAt = addedAt.trim();
    const customMetaStr = getVal("inp-custom-meta");
    if (customMetaStr) {
      try {
        p.metadata = JSON.parse(customMetaStr);
      } catch {
      }
    }
  }
  async function validateAndSaveProduct(modalWrapper, container) {
    const p = modalState.productData;
    let isValid = true;
    const setErr = (id, msg) => {
      const el = modalWrapper.querySelector("#" + id);
      if (el) el.textContent = msg;
      if (msg) isValid = false;
    };
    setErr("err-id", "");
    setErr("err-price", "");
    setErr("err-stock", "");
    setErr("err-name-ar", "");
    setErr("err-image", "");
    if (!p.id || !/^[a-zA-Z0-9_\-]{1,64}$/.test(p.id)) {
      setErr("err-id", "\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u062D\u0631\u0641 \u0648\u0623\u0631\u0642\u0627\u0645 \u0648\u0634\u0631\u0637\u0627\u062A \u0641\u0642\u0637 \u0628\u062F\u0648\u0646 \u0645\u0633\u0627\u0641\u0627\u062A (1-64 \u062D\u0631\u0641).");
    }
    if (typeof p.price !== "number" || isNaN(p.price) || p.price < 0 || p.price > 1e7) {
      setErr("err-price", "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0633\u0639\u0631 \u0635\u062D\u064A\u062D \u0628\u064A\u0646 0 \u0648 10,000,000 \u062F\u062C.");
    }
    if (typeof p.stock !== "number" || isNaN(p.stock) || p.stock < 0 || p.stock > 999) {
      setErr("err-stock", "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0645\u062E\u0632\u0648\u0646 \u0628\u064A\u0646 0 \u0648 999.");
    }
    if (!p.name?.ar && typeof p.name !== "string") {
      setErr("err-name-ar", "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0645\u0637\u0644\u0648\u0628.");
    }
    if (!p.image) {
      p.image = "assets/product-image.png";
    }
    if (!isValid) {
      window.adminToast?.("\u064A\u0631\u062C\u0649 \u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0642\u0628\u0644 \u0627\u0644\u062D\u0641\u0638", "error");
      return false;
    }
    if (!p.name.fr) p.name.fr = p.name.ar;
    if (!p.name.en) p.name.en = p.name.ar;
    if (!p.category.fr) p.category.fr = p.category.ar;
    if (!p.category.en) p.category.en = p.category.ar;
    await ProductsService.save(p);
    window.adminToast?.("\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D!", "success");
    if (container) {
      await renderProductsSection(container);
    }
    return true;
  }
  async function duplicateProduct(productId, container) {
    const target = await ProductsService.getById(productId);
    if (!target) return;
    const copy = JSON.parse(JSON.stringify(target));
    copy.id = "prod_" + Math.floor(1e5 + Math.random() * 9e5);
    if (typeof copy.name === "object") {
      if (copy.name.ar) copy.name.ar += " (\u0646\u0633\u062E\u0629)";
      if (copy.name.fr) copy.name.fr += " (copie)";
      if (copy.name.en) copy.name.en += " (copy)";
    } else {
      copy.name = String(copy.name) + " (copy)";
    }
    copy.addedAt = (/* @__PURE__ */ new Date()).toISOString();
    await ProductsService.save(copy);
    window.adminToast?.("\u062A\u0645 \u0627\u0633\u062A\u0646\u0633\u0627\u062E \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D!", "success");
    await renderProductsSection(container);
  }
  async function deleteProduct(productId, container) {
    await ProductsService.delete(productId);
    selectedProductIds.delete(productId);
    window.adminToast?.("\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D!", "success");
    await renderProductsSection(container);
  }
  async function exportProductsJSON() {
    const products = await ProductsService.getAll();
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zirox-products-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.adminToast?.("\u062A\u0645 \u062A\u0646\u0632\u064A\u0644 \u0643\u062A\u0627\u0644\u0648\u062C \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0628\u062A\u0646\u0633\u064A\u0642 JSON \u0628\u0646\u062C\u0627\u062D", "success");
  }
  function importProductsJSON(e, container) {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          throw new Error("\u0627\u0644\u0645\u0644\u0641 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0645\u0635\u0641\u0648\u0641\u0629 \u0645\u0646\u062A\u062C\u0627\u062A (Array).");
        }
        const validItems = data.filter(isValidProduct);
        if (validItems.length === 0) {
          throw new Error("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u064A \u0645\u0646\u062A\u062C\u0627\u062A \u0635\u0627\u0644\u062D\u0629 \u0641\u064A \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u062E\u062A\u0627\u0631.");
        }
        if (confirm(`\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 ${validItems.length} \u0645\u0646\u062A\u062C \u0635\u0627\u0644\u062D. \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0633\u062A\u0628\u062F\u0627\u0644/\u062F\u0645\u062C \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u062A\u062C\u0631\u061F`)) {
          await ProductsService.saveAll(validItems);
          window.adminToast?.(`\u062A\u0645 \u0627\u0633\u062A\u064A\u0631\u0627\u062F ${validItems.length} \u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D!`, "success");
          await renderProductsSection(container);
        }
      } catch (err) {
        console.error("Import error", err);
        window.adminToast?.("\u0641\u0634\u0644 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F: " + (err.message || "\u0645\u0644\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D"), "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // admin-orders.js
  var currentOrderFilter = {
    search: "",
    status: "all",
    wilaya: "",
    dateFrom: "",
    dateTo: ""
  };
  function renderOrdersSection(container) {
    if (!container) return;
    const allOrders = StorageService.getOrders();
    let filtered = [...allOrders];
    if (currentOrderFilter.search.trim()) {
      const q = currentOrderFilter.search.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        const idMatch = (o.id || "").toLowerCase().includes(q);
        const nameMatch = (o.customerName || "").toLowerCase().includes(q);
        const phoneMatch = (o.phone || "").toLowerCase().includes(q);
        return idMatch || nameMatch || phoneMatch;
      });
    }
    if (currentOrderFilter.status !== "all") {
      filtered = filtered.filter((o) => (o.status || "Pending").toLowerCase() === currentOrderFilter.status.toLowerCase());
    }
    if (currentOrderFilter.wilaya.trim()) {
      const w = currentOrderFilter.wilaya.trim().toLowerCase();
      filtered = filtered.filter((o) => (o.wilaya || "").toLowerCase().includes(w));
    }
    if (currentOrderFilter.dateFrom) {
      const fromTime = new Date(currentOrderFilter.dateFrom).getTime();
      filtered = filtered.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= fromTime);
    }
    if (currentOrderFilter.dateTo) {
      const toTime = new Date(currentOrderFilter.dateTo).getTime() + (24 * 60 * 60 * 1e3 - 1);
      filtered = filtered.filter((o) => o.createdAt && new Date(o.createdAt).getTime() <= toTime);
    }
    container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">\u{1F4CB} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A (${allOrders.length})</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">\u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0634\u062D\u0646\u060C \u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631\u060C \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0632\u0628\u0627\u0626\u0646</span>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn-secondary-pill" id="admin-export-orders-csv" style="padding:10px 18px;font-size:0.85rem;">
                        \u{1F4CA} \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A (CSV)
                    </button>
                    <button class="btn-secondary-pill" id="admin-export-orders-json" style="padding:10px 18px;font-size:0.85rem;">
                        \u{1F4E5} \u062A\u0635\u062F\u064A\u0631 (JSON)
                    </button>
                </div>
            </div>

            <!-- Filters Toolbar -->
            <div class="admin-toolbar">
                <input type="text" class="admin-search-input" id="admin-order-search" placeholder="\u{1F50D} \u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645\u060C \u0627\u0644\u0647\u0627\u062A\u0641\u060C \u0623\u0648 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0637\u0644\u0628 ORD-..." value="${escapeHTML(currentOrderFilter.search)}">
                
                <select class="admin-select" id="admin-order-status-filter">
                    <option value="all" ${currentOrderFilter.status === "all" ? "selected" : ""}>\u0643\u0644 \u0627\u0644\u062D\u0627\u0644\u0627\u062A</option>
                    <option value="Pending" ${currentOrderFilter.status === "Pending" ? "selected" : ""}>\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 (Pending)</option>
                    <option value="Confirmed" ${currentOrderFilter.status === "Confirmed" ? "selected" : ""}>\u0645\u0624\u0643\u062F\u0629 (Confirmed)</option>
                    <option value="Shipped" ${currentOrderFilter.status === "Shipped" ? "selected" : ""}>\u062A\u0645 \u0627\u0644\u0634\u062D\u0646 (Shipped)</option>
                    <option value="Delivered" ${currentOrderFilter.status === "Delivered" ? "selected" : ""}>\u0645\u0633\u062A\u0644\u0645\u0629 (Delivered)</option>
                    <option value="Cancelled" ${currentOrderFilter.status === "Cancelled" ? "selected" : ""}>\u0645\u0644\u063A\u0627\u0629 (Cancelled)</option>
                </select>

                <input type="text" class="admin-search-input" id="admin-order-wilaya-filter" placeholder="\u0627\u0644\u0648\u0644\u0627\u064A\u0629..." style="max-width:140px;" value="${escapeHTML(currentOrderFilter.wilaya)}">

                <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-muted);">
                    \u0645\u0646: <input type="date" class="admin-input" id="admin-order-date-from" style="padding:7px 10px;width:auto;" value="${currentOrderFilter.dateFrom}">
                    \u0625\u0644\u0649: <input type="date" class="admin-input" id="admin-order-date-to" style="padding:7px 10px;width:auto;" value="${currentOrderFilter.dateTo}">
                </div>
            </div>

            <!-- Orders Table -->
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628</th>
                            <th>\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0648\u0627\u0644\u0648\u0642\u062A</th>
                            <th>\u0627\u0644\u0632\u0628\u0648\u0646</th>
                            <th>\u0627\u0644\u0647\u0627\u062A\u0641</th>
                            <th>\u0627\u0644\u0648\u0644\u0627\u064A\u0629 \u0648\u0627\u0644\u0639\u0646\u0648\u0627\u0646</th>
                            <th>\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</th>
                            <th>\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</th>
                            <th>\u0627\u0644\u062D\u0627\u0644\u0629</th>
                            <th style="text-align:center;">\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `
                            <tr>
                                <td colspan="9" style="text-align:center;padding:48px 20px;color:var(--text-muted);">
                                    \u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u064A \u0637\u0644\u0628\u064A\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0641\u0644\u062A\u0631 \u0627\u0644\u0645\u062D\u062F\u062F.
                                </td>
                            </tr>
                        ` : filtered.map((order) => {
      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short" }) : "-";
      const itemsCount = Array.isArray(order.items) ? order.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 0;
      const status = order.status || "Pending";
      const cleanPhone = String(order.phone || "").replace(/\D/g, "");
      const waPhone = cleanPhone.startsWith("0") ? "213" + cleanPhone.slice(1) : cleanPhone.startsWith("213") ? cleanPhone : "213" + cleanPhone;
      const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`\u0645\u0631\u062D\u0628\u0627\u064B ${order.customerName}\u060C \u0646\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0628\u062E\u0635\u0648\u0635 \u0637\u0644\u0628\u064A\u062A\u0643 \u0631\u0642\u0645 #${order.id} \u0645\u0646 \u0645\u062A\u062C\u0631 Zirox.`)}`;
      return `
                                <tr data-order-id="${escapeHTML(order.id)}">
                                    <td>
                                        <strong style="font-family:monospace;color:var(--text-primary);">${escapeHTML(order.id)}</strong>
                                    </td>
                                    <td style="font-size:0.8rem;white-space:nowrap;color:var(--text-muted);">
                                        ${escapeHTML(dateStr)}
                                    </td>
                                    <td>
                                        <div style="font-weight:700;">${escapeHTML(order.customerName || "\u0639\u0645\u064A\u0644")}</div>
                                    </td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:6px;">
                                            <a href="tel:${escapeHTML(order.phone)}" style="color:var(--text-primary);text-decoration:none;font-weight:600;direction:ltr;">${escapeHTML(order.phone)}</a>
                                            <a href="${waLink}" target="_blank" rel="noopener" style="text-decoration:none;font-size:0.9rem;" title="\u0645\u062D\u0627\u062F\u062B\u0629 \u0648\u0627\u062A\u0633\u0627\u0628">\u{1F4AC}</a>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="font-weight:600;">${escapeHTML(order.wilaya || "-")}</div>
                                        <div style="font-size:0.75rem;color:var(--text-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(order.address || "")}</div>
                                    </td>
                                    <td>
                                        <span style="font-size:0.82rem;font-weight:700;background:var(--surface-container-low);padding:2px 8px;border-radius:12px;">
                                            ${itemsCount} \u0642\u0637\u0639
                                        </span>
                                    </td>
                                    <td>
                                        <strong style="color:var(--text-primary);">${escapeHTML(order.total || "0 \u062F\u062C")}</strong>
                                    </td>
                                    <td>
                                        <select class="admin-select order-status-select" data-id="${escapeHTML(order.id)}" style="padding:4px 8px;font-size:0.78rem;font-weight:700;border-radius:var(--radius-md);">
                                            <option value="Pending" ${status === "Pending" ? "selected" : ""}>\u23F3 \u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631</option>
                                            <option value="Confirmed" ${status === "Confirmed" ? "selected" : ""}>\u2713 \u0645\u0624\u0643\u062F\u0629</option>
                                            <option value="Shipped" ${status === "Shipped" ? "selected" : ""}>\u{1F69A} \u062A\u0645 \u0627\u0644\u0634\u062D\u0646</option>
                                            <option value="Delivered" ${status === "Delivered" ? "selected" : ""}>\u2705 \u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645</option>
                                            <option value="Cancelled" ${status === "Cancelled" ? "selected" : ""}>\u2715 \u0645\u0644\u063A\u0627\u0629</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div class="row-actions" style="justify-content:center;">
                                            <button class="admin-action-btn view-order-btn" data-id="${escapeHTML(order.id)}" title="\u0639\u0631\u0636 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629">\u{1F441}\uFE0F</button>
                                            <a href="${waLink}" target="_blank" rel="noopener" class="admin-action-btn" title="\u062A\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628">\u{1F4AC}</a>
                                            <button class="admin-action-btn delete delete-order-btn" data-id="${escapeHTML(order.id)}" title="\u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628">\u{1F5D1}\uFE0F</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
    }).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <div id="order-modal-placeholder"></div>
    `;
    bindOrderSectionEvents(container);
  }
  function bindOrderSectionEvents(container) {
    const searchInp = container.querySelector("#admin-order-search");
    if (searchInp) {
      searchInp.addEventListener("input", (e) => {
        currentOrderFilter.search = e.target.value;
        renderOrdersSection(container);
        const refocused = container.querySelector("#admin-order-search");
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }
    const statusSelect = container.querySelector("#admin-order-status-filter");
    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        currentOrderFilter.status = e.target.value;
        renderOrdersSection(container);
      });
    }
    const wilayaInp = container.querySelector("#admin-order-wilaya-filter");
    if (wilayaInp) {
      wilayaInp.addEventListener("input", (e) => {
        currentOrderFilter.wilaya = e.target.value;
        renderOrdersSection(container);
        const refocused = container.querySelector("#admin-order-wilaya-filter");
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }
    const dateFromInp = container.querySelector("#admin-order-date-from");
    if (dateFromInp) {
      dateFromInp.addEventListener("change", (e) => {
        currentOrderFilter.dateFrom = e.target.value;
        renderOrdersSection(container);
      });
    }
    const dateToInp = container.querySelector("#admin-order-date-to");
    if (dateToInp) {
      dateToInp.addEventListener("change", (e) => {
        currentOrderFilter.dateTo = e.target.value;
        renderOrdersSection(container);
      });
    }
    container.querySelectorAll(".order-status-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const id = sel.getAttribute("data-id");
        const newStatus = sel.value;
        StorageService.updateOrderStatus(id, newStatus);
        window.adminToast?.(`\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 #${id} \u0625\u0644\u0649: ${newStatus}`, "success");
      });
    });
    container.querySelectorAll(".view-order-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        openOrderDetailsModal(id, container);
      });
    });
    container.querySelectorAll(".delete-order-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm(`\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0631\u063A\u0628\u062A\u0643 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 #${id} \u0646\u0647\u0627\u0626\u064A\u0627\u064B\u061F`)) {
          StorageService.deleteOrder(id);
          window.adminToast?.(`\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 #${id} \u0628\u0646\u062C\u0627\u062D`, "success");
          renderOrdersSection(container);
        }
      });
    });
    const csvBtn = container.querySelector("#admin-export-orders-csv");
    if (csvBtn) csvBtn.onclick = exportOrdersCSV;
    const jsonBtn = container.querySelector("#admin-export-orders-json");
    if (jsonBtn) jsonBtn.onclick = exportOrdersJSON;
  }
  function openOrderDetailsModal(orderId, container) {
    const orders = StorageService.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    let modalWrapper = document.getElementById("admin-order-modal-root");
    if (!modalWrapper) {
      modalWrapper = document.createElement("div");
      modalWrapper.id = "admin-order-modal-root";
      document.body.appendChild(modalWrapper);
    }
    const items = Array.isArray(order.items) ? order.items : [];
    const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleString("ar-DZ", { dateStyle: "full", timeStyle: "short" }) : "-";
    const cleanPhone = String(order.phone || "").replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "213" + cleanPhone.slice(1) : cleanPhone.startsWith("213") ? cleanPhone : "213" + cleanPhone;
    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`\u0645\u0631\u062D\u0628\u0627\u064B ${order.customerName}\u060C \u0646\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0628\u062E\u0635\u0648\u0635 \u0637\u0644\u0628\u064A\u062A\u0643 \u0631\u0642\u0645 #${order.id} \u0645\u0646 \u0645\u062A\u062C\u0631 Zirox.`)}`;
    modalWrapper.innerHTML = `
        <div class="admin-modal-overlay open">
            <div class="admin-modal print-invoice-area" style="max-width:760px;">
                <div class="admin-modal-header no-print">
                    <h3>\u{1F4E6} \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 #${escapeHTML(order.id)}</h3>
                    <button class="modal-close-btn" id="order-modal-close">\u2715</button>
                </div>

                <div class="admin-modal-body" style="padding:28px;">
                    <!-- Invoice Header (Printed) -->
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid var(--color-black);padding-bottom:16px;">
                        <div>
                            <h2 style="margin:0;font-size:1.6rem;font-weight:800;letter-spacing:-0.03em;">ZIROX STORE</h2>
                            <p style="margin:4px 0 0 0;font-size:0.82rem;color:var(--text-muted);">\u0645\u0646\u0635\u0629 \u0627\u0644\u0646\u062E\u0628\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0644\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u2022 \u0627\u0644\u062C\u0632\u0627\u0626\u0631</p>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:800;font-size:1.1rem;font-family:monospace;">${escapeHTML(order.id)}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHTML(dateFormatted)}</div>
                        </div>
                    </div>

                    <!-- Customer & Shipping Block -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;background:var(--surface-subtle);padding:16px;border-radius:var(--radius-md);">
                        <div>
                            <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0632\u0628\u0648\u0646</span>
                            <div style="font-weight:700;font-size:1rem;margin-top:4px;">${escapeHTML(order.customerName)}</div>
                            <div style="font-size:0.9rem;margin-top:2px;">
                                \u{1F4DE} <a href="tel:${escapeHTML(order.phone)}" style="color:inherit;text-decoration:none;">${escapeHTML(order.phone)}</a>
                            </div>
                        </div>
                        <div>
                            <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0648\u0627\u0644\u0634\u062D\u0646</span>
                            <div style="font-weight:700;font-size:0.95rem;margin-top:4px;">\u{1F4CD} ${escapeHTML(order.wilaya)}</div>
                            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">\u{1F3E0} ${escapeHTML(order.address || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F")}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">\u{1F69A} ${escapeHTML(order.deliveryMethod || "\u062A\u0648\u0635\u064A\u0644 \u0644\u0644\u0645\u0643\u062A\u0628 \u0623\u0648 \u0627\u0644\u0645\u0646\u0632\u0644")}</div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div style="margin-bottom:24px;">
                        <span style="font-size:0.82rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:10px;">\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0637\u0644\u0628\u064A\u0629</span>
                        <table style="width:100%;border-collapse:collapse;text-align:right;font-size:0.88rem;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--border-light);color:var(--text-muted);font-size:0.78rem;">
                                    <th style="padding:8px 0;">\u0627\u0644\u0645\u0646\u062A\u062C</th>
                                    <th style="padding:8px;text-align:center;">\u0627\u0644\u0643\u0645\u064A\u0629</th>
                                    <th style="padding:8px;text-align:left;">\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0641\u0631\u062F\u064A</th>
                                    <th style="padding:8px 0;text-align:left;">\u0627\u0644\u0645\u062C\u0645\u0648\u0639</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((it) => `
                                    <tr style="border-bottom:1px solid var(--border-light);">
                                        <td style="padding:10px 0;display:flex;align-items:center;gap:10px;">
                                            <img src="${sanitizeURL(it.image, "assets/product-image.png")}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" onerror="this.src='assets/product-image.png'">
                                            <span style="font-weight:600;">${escapeHTML(it.name)}</span>
                                        </td>
                                        <td style="padding:10px;text-align:center;font-weight:700;">x${it.quantity || 1}</td>
                                        <td style="padding:10px;text-align:left;">${formatPrice(it.price || 0)}</td>
                                        <td style="padding:10px 0;text-align:left;font-weight:700;">${formatPrice((it.price || 0) * (it.quantity || 1))}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>

                    <!-- Total Block -->
                    <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
                        <div style="width:260px;background:var(--surface-container-low);padding:14px;border-radius:var(--radius-md);">
                            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem;color:var(--text-muted);">
                                <span>\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639:</span>
                                <strong>\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 (COD)</strong>
                            </div>
                            <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border-light);padding-top:8px;font-size:1.1rem;font-weight:800;color:var(--text-primary);">
                                <span>\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0643\u0644\u064A:</span>
                                <span>${escapeHTML(order.total || "0 \u062F\u062C")}</span>
                            </div>
                        </div>
                    </div>

                    <div style="font-size:0.76rem;color:var(--text-muted);text-align:center;margin-top:20px;">
                        \u062D\u0642 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u0627\u0644\u0641\u062D\u0635 \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0637\u0631\u062F \u0645\u0643\u0641\u0648\u0644 \u0648\u0645\u0636\u0645\u0648\u0646 \u0642\u0628\u0644 \u062F\u0641\u0639 \u0623\u064A \u062F\u064A\u0646\u0627\u0631 \u0644\u0644\u0645\u0648\u0632\u0639.
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="admin-modal-footer no-print">
                    <button type="button" class="btn-secondary-pill" id="order-copy-summary-btn">\u{1F4CB} \u0646\u0633\u062E \u0627\u0644\u0645\u0644\u062E\u0635</button>
                    <a href="${waLink}" target="_blank" rel="noopener" class="btn-secondary-pill" style="text-decoration:none;">\u{1F4AC} \u0648\u0627\u062A\u0633\u0627\u0628</a>
                    <button type="button" class="btn-pill" id="order-print-btn">\u{1F5A8}\uFE0F \u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629</button>
                </div>
            </div>
        </div>
    `;
    const closeBtn = modalWrapper.querySelector("#order-modal-close");
    const overlay = modalWrapper.querySelector(".admin-modal-overlay");
    const closeModal = () => {
      modalWrapper.innerHTML = "";
    };
    if (closeBtn) closeBtn.onclick = closeModal;
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
    }
    const printBtn = modalWrapper.querySelector("#order-print-btn");
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
    const copyBtn = modalWrapper.querySelector("#order-copy-summary-btn");
    if (copyBtn) {
      copyBtn.onclick = () => {
        let summary = `*\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 #${order.id}*
`;
        summary += `\u0627\u0644\u0632\u0628\u0648\u0646: ${order.customerName}
\u0627\u0644\u0647\u0627\u062A\u0641: ${order.phone}
\u0627\u0644\u0648\u0644\u0627\u064A\u0629: ${order.wilaya}
\u0627\u0644\u0639\u0646\u0648\u0627\u0646: ${order.address}
`;
        summary += `-----------------------
\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A:
`;
        items.forEach((it) => {
          summary += `\u25AA ${it.name} (x${it.quantity || 1}) - ${formatPrice((it.price || 0) * (it.quantity || 1))}
`;
        });
        summary += `-----------------------
\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0646\u0647\u0627\u0626\u064A: ${order.total}`;
        navigator.clipboard.writeText(summary).then(() => {
          window.adminToast?.("\u062A\u0645 \u0646\u0633\u062E \u0645\u0644\u062E\u0635 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 \u0627\u0644\u062D\u0627\u0641\u0638\u0629!", "success");
        });
      };
    }
  }
  function exportOrdersCSV() {
    const orders = StorageService.getOrders();
    if (orders.length === 0) {
      window.adminToast?.("\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u064A \u0637\u0644\u0628\u064A\u0627\u062A \u0644\u062A\u0635\u062F\u064A\u0631\u0647\u0627.", "warning");
      return;
    }
    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Wilaya", "Address", "Delivery Method", "Items Count", "Total", "Status"];
    const rows = orders.map((o) => {
      const count = Array.isArray(o.items) ? o.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 0;
      return [
        `"${o.id || ""}"`,
        `"${o.createdAt || ""}"`,
        `"${(o.customerName || "").replace(/"/g, '""')}"`,
        `"${(o.phone || "").replace(/"/g, '""')}"`,
        `"${(o.wilaya || "").replace(/"/g, '""')}"`,
        `"${(o.address || "").replace(/"/g, '""')}"`,
        `"${(o.deliveryMethod || "").replace(/"/g, '""')}"`,
        count,
        `"${(o.total || "").replace(/"/g, '""')}"`,
        `"${o.status || "Pending"}"`
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zirox-orders-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.adminToast?.("\u062A\u0645 \u062A\u0635\u062F\u064A\u0631 \u0645\u0644\u0641 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A (CSV) \u0628\u0646\u062C\u0627\u062D!", "success");
  }
  function exportOrdersJSON() {
    const orders = StorageService.getOrders();
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zirox-orders-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.adminToast?.("\u062A\u0645 \u062A\u0646\u0632\u064A\u0644 \u0645\u0644\u0641 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A (JSON) \u0628\u0646\u062C\u0627\u062D!", "success");
  }

  // shipping.js
  var FREE_SHIPPING_THRESHOLD = 2e4;
  var WILAYA_ZONES = Object.freeze({
    // Capital & Mitidja (Fast Northern Hubs)
    ZONE_1: [16, 9, 42, 35],
    // High Plateaus, Interior & Northern New Wilayas (Law 26-06)
    ZONE_3: [
      3,
      4,
      5,
      7,
      14,
      17,
      20,
      28,
      29,
      32,
      38,
      40,
      45,
      51,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      67,
      68
    ],
    // Southern & Great Desert Wilayas (including 66 Messaad & 69 El Abiodh Sidi Cheikh)
    ZONE_4: [
      1,
      8,
      11,
      30,
      33,
      37,
      39,
      47,
      49,
      50,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      66,
      69
    ]
    // Default: ZONE 2 (Coastal & Standard North)
  });
  var SHIPPING_RATES = Object.freeze({
    1: { office: 300, home: 450 },
    2: { office: 400, home: 600 },
    3: { office: 500, home: 750 },
    4: { office: 750, home: 1100 }
  });
  function getEffectiveThreshold() {
    const custom = StorageService.getFreeShippingThreshold();
    return typeof custom === "number" && custom >= 0 ? custom : FREE_SHIPPING_THRESHOLD;
  }
  function getEffectiveZones() {
    const custom = StorageService.getWilayaZones();
    return custom && typeof custom === "object" ? custom : WILAYA_ZONES;
  }
  function getEffectiveRates() {
    const custom = StorageService.getShippingRates();
    return custom && typeof custom === "object" ? custom : SHIPPING_RATES;
  }
  function getWilayaZone(wilayaNumber) {
    const zones = getEffectiveZones();
    const num = parseInt(wilayaNumber, 10);
    if (zones.ZONE_1 && zones.ZONE_1.includes(num)) return 1;
    if (zones.ZONE_4 && zones.ZONE_4.includes(num)) return 4;
    if (zones.ZONE_3 && zones.ZONE_3.includes(num)) return 3;
    return 2;
  }
  function calculateShippingCost(wilayaNumber, deliveryType = "office") {
    const zone = getWilayaZone(wilayaNumber);
    const mode = deliveryType === "home" ? "home" : "office";
    const rates = getEffectiveRates();
    const rate = rates[zone] || rates[2] || { office: 400, home: 600 };
    return rate[mode];
  }
  function isFreeShipping(subtotal) {
    return subtotal >= getEffectiveThreshold();
  }
  function getFreeShippingStatus(subtotal) {
    const threshold = getEffectiveThreshold();
    const isUnlocked = isFreeShipping(subtotal);
    const remaining = Math.max(0, threshold - subtotal);
    const percentage = threshold > 0 ? Math.min(100, Math.round(subtotal / threshold * 100)) : 100;
    return { isUnlocked, remaining, percentage, threshold };
  }

  // admin-settings.js
  var ALGERIA_WILAYAS_DATA = Object.freeze([
    { code: 1, nameAr: "\u0623\u062F\u0631\u0627\u0631", nameEn: "Adrar" },
    { code: 2, nameAr: "\u0627\u0644\u0634\u0644\u0641", nameEn: "Chlef" },
    { code: 3, nameAr: "\u0627\u0644\u0623\u063A\u0648\u0627\u0637", nameEn: "Laghouat" },
    { code: 4, nameAr: "\u0623\u0645 \u0627\u0644\u0628\u0648\u0627\u0642\u064A", nameEn: "Oum El Bouaghi" },
    { code: 5, nameAr: "\u0628\u0627\u062A\u0646\u0629", nameEn: "Batna" },
    { code: 6, nameAr: "\u0628\u062C\u0627\u064A\u0629", nameEn: "B\xE9ja\xEFa" },
    { code: 7, nameAr: "\u0628\u0633\u0643\u0631\u0629", nameEn: "Biskra" },
    { code: 8, nameAr: "\u0628\u0634\u0627\u0631", nameEn: "B\xE9char" },
    { code: 9, nameAr: "\u0627\u0644\u0628\u0644\u064A\u062F\u0629", nameEn: "Blida" },
    { code: 10, nameAr: "\u0627\u0644\u0628\u0648\u064A\u0631\u0629", nameEn: "Bouira" },
    { code: 11, nameAr: "\u062A\u0645\u0646\u0631\u0627\u0633\u062A", nameEn: "Tamanrasset" },
    { code: 12, nameAr: "\u062A\u0628\u0633\u0629", nameEn: "T\xE9bessa" },
    { code: 13, nameAr: "\u062A\u0644\u0645\u0633\u0627\u0646", nameEn: "Tlemcen" },
    { code: 14, nameAr: "\u062A\u064A\u0627\u0631\u062A", nameEn: "Tiaret" },
    { code: 15, nameAr: "\u062A\u064A\u0632\u064A \u0648\u0632\u0648", nameEn: "Tizi Ouzou" },
    { code: 16, nameAr: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629", nameEn: "Algiers" },
    { code: 17, nameAr: "\u0627\u0644\u062C\u0644\u0641\u0629", nameEn: "Djelfa" },
    { code: 18, nameAr: "\u062C\u064A\u062C\u0644", nameEn: "Jijel" },
    { code: 19, nameAr: "\u0633\u0637\u064A\u0641", nameEn: "S\xE9tif" },
    { code: 20, nameAr: "\u0633\u0639\u064A\u062F\u0629", nameEn: "Sa\xEFda" },
    { code: 21, nameAr: "\u0633\u0643\u064A\u0643\u062F\u0629", nameEn: "Skikda" },
    { code: 22, nameAr: "\u0633\u064A\u062F\u064A \u0628\u0644\u0639\u0628\u0627\u0633", nameEn: "Sidi Bel Abb\xE8s" },
    { code: 23, nameAr: "\u0639\u0646\u0627\u0628\u0629", nameEn: "Annaba" },
    { code: 24, nameAr: "\u0642\u0627\u0644\u0645\u0629", nameEn: "Guelma" },
    { code: 25, nameAr: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629", nameEn: "Constantine" },
    { code: 26, nameAr: "\u0627\u0644\u0645\u062F\u064A\u0629", nameEn: "M\xE9d\xE9a" },
    { code: 27, nameAr: "\u0645\u0633\u062A\u063A\u0627\u0646\u0645", nameEn: "Mostaganem" },
    { code: 28, nameAr: "\u0627\u0644\u0645\u0633\u064A\u0644\u0629", nameEn: "M'Sila" },
    { code: 29, nameAr: "\u0645\u0639\u0633\u0643\u0631", nameEn: "Mascara" },
    { code: 30, nameAr: "\u0648\u0631\u0642\u0644\u0629", nameEn: "Ouargla" },
    { code: 31, nameAr: "\u0648\u0647\u0631\u0627\u0646", nameEn: "Oran" },
    { code: 32, nameAr: "\u0627\u0644\u0628\u064A\u0636", nameEn: "El Bayadh" },
    { code: 33, nameAr: "\u0625\u0644\u064A\u0632\u064A", nameEn: "Illizi" },
    { code: 34, nameAr: "\u0628\u0631\u062C \u0628\u0648\u0639\u0631\u064A\u0631\u064A\u062C", nameEn: "Bordj Bou Arr\xE9ridj" },
    { code: 35, nameAr: "\u0628\u0648\u0645\u0631\u062F\u0627\u0633", nameEn: "Boumerd\xE8s" },
    { code: 36, nameAr: "\u0627\u0644\u0637\u0627\u0631\u0641", nameEn: "El Tarf" },
    { code: 37, nameAr: "\u062A\u0646\u062F\u0648\u0641", nameEn: "Tindouf" },
    { code: 38, nameAr: "\u062A\u0633\u0645\u0633\u064A\u0644\u062A", nameEn: "Tissemsilt" },
    { code: 39, nameAr: "\u0627\u0644\u0648\u0627\u062F\u064A", nameEn: "El Oued" },
    { code: 40, nameAr: "\u062E\u0646\u0634\u0644\u0629", nameEn: "Khenchela" },
    { code: 41, nameAr: "\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633", nameEn: "Souk Ahras" },
    { code: 42, nameAr: "\u062A\u064A\u0628\u0627\u0632\u0629", nameEn: "Tipaza" },
    { code: 43, nameAr: "\u0645\u064A\u0644\u0629", nameEn: "Mila" },
    { code: 44, nameAr: "\u0639\u064A\u0646 \u0627\u0644\u062F\u0641\u0644\u0649", nameEn: "A\xEFn Defla" },
    { code: 45, nameAr: "\u0627\u0644\u0646\u0639\u0627\u0645\u0629", nameEn: "Na\xE2ma" },
    { code: 46, nameAr: "\u0639\u064A\u0646 \u062A\u0645\u0648\u0634\u0646\u062A", nameEn: "A\xEFn T\xE9mouchent" },
    { code: 47, nameAr: "\u063A\u0631\u062F\u0627\u064A\u0629", nameEn: "Gharda\xEFa" },
    { code: 48, nameAr: "\u063A\u0644\u064A\u0632\u0627\u0646", nameEn: "Relizane" },
    { code: 49, nameAr: "\u062A\u064A\u0645\u064A\u0645\u0648\u0646", nameEn: "Timimoun" },
    { code: 50, nameAr: "\u0628\u0631\u062C \u0628\u0627\u062C\u064A \u0645\u062E\u062A\u0627\u0631", nameEn: "Bordj Badji Mokhtar" },
    { code: 51, nameAr: "\u0623\u0648\u0644\u0627\u062F \u062C\u0644\u0627\u0644", nameEn: "Ouled Djellal" },
    { code: 52, nameAr: "\u0628\u0646\u064A \u0639\u0628\u0627\u0633", nameEn: "B\xE9ni Abb\xE8s" },
    { code: 53, nameAr: "\u0639\u064A\u0646 \u0635\u0627\u0644\u062D", nameEn: "In Salah" },
    { code: 54, nameAr: "\u0639\u064A\u0646 \u0642\u0632\u0627\u0645", nameEn: "In Guezzam" },
    { code: 55, nameAr: "\u062A\u0642\u0631\u062A", nameEn: "Touggourt" },
    { code: 56, nameAr: "\u062C\u0627\u0646\u062A", nameEn: "Djanet" },
    { code: 57, nameAr: "\u0627\u0644\u0645\u063A\u064A\u0631", nameEn: "El M'Ghair" },
    { code: 58, nameAr: "\u0627\u0644\u0645\u0646\u064A\u0639\u0629", nameEn: "El Meniaa" },
    { code: 59, nameAr: "\u0623\u0641\u0644\u0648", nameEn: "Aflou" },
    { code: 60, nameAr: "\u0628\u0631\u064A\u0643\u0629", nameEn: "Barika" },
    { code: 61, nameAr: "\u0627\u0644\u0642\u0646\u0637\u0631\u0629", nameEn: "El Kantara" },
    { code: 62, nameAr: "\u0628\u0626\u0631 \u0627\u0644\u0639\u0627\u062A\u0631", nameEn: "Bir El Ater" },
    { code: 63, nameAr: "\u0627\u0644\u0639\u0631\u064A\u0634\u0629", nameEn: "El Aricha" },
    { code: 64, nameAr: "\u0642\u0635\u0631 \u0627\u0644\u0634\u0644\u0627\u0644\u0629", nameEn: "Ksar Chellala" },
    { code: 65, nameAr: "\u0639\u064A\u0646 \u0648\u0633\u0627\u0631\u0629", nameEn: "Ain Oussera" },
    { code: 66, nameAr: "\u0645\u0633\u0639\u062F", nameEn: "Messaad" },
    { code: 67, nameAr: "\u0642\u0635\u0631 \u0627\u0644\u0628\u062E\u0627\u0631\u064A", nameEn: "Ksar El Boukhari" },
    { code: 68, nameAr: "\u0628\u0648\u0633\u0639\u0627\u062F\u0629", nameEn: "Bou-Saada" },
    { code: 69, nameAr: "\u0627\u0644\u0623\u0628\u064A\u0636 \u0633\u064A\u062F\u064A \u0627\u0644\u0634\u064A\u062E", nameEn: "El Abiodh Sidi Cheikh" }
  ]);
  var DEFAULT_SITE_SETTINGS = Object.freeze({
    brandName: "ZIROX",
    tagline: "\u0645\u062A\u062C\u0631 \u0627\u0644\u0646\u062E\u0628\u0629 \u0627\u0644\u0641\u0627\u062E\u0631 \u2022 DZ",
    logoUrl: "",
    faviconUrl: "favicon.ico",
    whatsappNumber: "213676184805",
    phoneDisplay: "+213 676 18 48 05",
    email: "contact@zirox-store.com",
    city: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
    facebookUrl: "https://facebook.com",
    instagramUrl: "https://instagram.com",
    topBarEnabled: true,
    topBarBadge: "69 Wilayas",
    topBarText: "\u062A\u0648\u0635\u064A\u0644 \u0633\u0631\u064A\u0639 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629 \u2022 \u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u0641\u062D\u0635 \u0627\u0644\u0637\u0631\u062F \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u2022 \u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A \u0644\u0644\u0637\u0644\u0628\u0627\u062A \u0641\u0648\u0642 20 000 \u062F\u062C",
    heroLiveBadge: "\u{1F1E9}\u{1F1FF} \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0644\u062A\u0642\u0646\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u2022 \u0627\u0644\u062C\u0632\u0627\u0626\u0631 2026",
    heroTicker: "ALGIERS / ORAN / CONSTANTINE / 69 WILAYAS",
    heroTitle: "\u0627\u0642\u062A\u0646\u0650 \u0642\u0645\u0629 \u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629\n\u0628\u0623\u0645\u0627\u0646 \u0633\u064A\u0627\u062F\u064A \u0645\u0637\u0644\u0642.",
    heroDesc: "\u0645\u0646\u0635\u0629 \u0627\u0644\u062A\u0633\u0648\u0651\u0642 \u0627\u0644\u0623\u0648\u0644\u0649 \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 100%. \u0645\u0639\u0627\u064A\u0646\u0629 \u0648\u0627\u062E\u062A\u0628\u0627\u0631 \u0641\u0648\u0631\u064A \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0645\u0628\u0627\u0634\u0631 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629.",
    heroProductImg: "assets/sony-wh1000xm5.png",
    heroChipTop: "MASTER SOUND 2026",
    heroChipAcoustics: "360\xB0 PRECISION ACOUSTICS",
    heroChipCod: "COD VERIFIED \u2022 36 000 DZD",
    marqueeEnabled: true,
    whatsappFloatEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: "\u0627\u0644\u0645\u062A\u062C\u0631 \u064A\u062E\u0636\u0639 \u062D\u0627\u0644\u064A\u0627\u064B \u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u062F\u0648\u0631\u064A\u0629 \u0644\u062A\u062D\u0633\u064A\u0646 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u062A\u0633\u0648\u0642. \u0633\u0646\u0639\u0648\u062F \u0642\u0631\u064A\u0628\u0627\u064B!"
  });
  var wilayaFilterQuery = "";
  var activeSettingsTab = "brand";
  function renderShippingSection(container) {
    if (!container) return;
    const currentThreshold = getEffectiveThreshold();
    const currentRates = getEffectiveRates();
    const currentZones = getEffectiveZones();
    const filteredWilayas = ALGERIA_WILAYAS_DATA.filter((w) => {
      if (!wilayaFilterQuery) return true;
      const q = wilayaFilterQuery.toLowerCase();
      return String(w.code).includes(q) || w.nameAr.toLowerCase().includes(q) || w.nameEn.toLowerCase().includes(q);
    });
    container.innerHTML = `
        <!-- Sub-section A: Free Shipping Threshold -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">\u{1F381} \u0639\u062A\u0628\u0629 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u062C\u0627\u0646\u064A (Free Shipping Threshold)</h3>
                <span style="font-size:0.8rem;color:var(--text-muted);">\u062A\u062D\u062F\u064A\u062F \u0642\u064A\u0645\u0629 \u0627\u0644\u0633\u0644\u0629 \u0627\u0644\u0645\u0624\u0647\u0644\u0629 \u0644\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062C\u0627\u0646\u064A</span>
            </div>
            <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
                <div style="flex:1;min-width:240px;">
                    <label class="form-label">\u0627\u0644\u0642\u064A\u0645\u0629 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A (DZD)</label>
                    <input type="number" class="admin-input" id="inp-free-shipping-threshold" value="${currentThreshold}" min="0" step="1000">
                </div>
                <div style="margin-top:20px;display:flex;gap:10px;">
                    <button class="btn-pill" id="btn-save-threshold">\u062D\u0641\u0638 \u0627\u0644\u0639\u062A\u0628\u0629</button>
                    <button class="btn-secondary-pill" id="btn-reset-threshold">\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A (20,000 \u062F\u062C)</button>
                </div>
            </div>
        </div>

        <!-- Sub-section B: Shipping Rates Table -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">\u{1F69A} \u062C\u062F\u0648\u0644 \u062A\u0633\u0639\u064A\u0631\u0627\u062A \u0627\u0644\u0634\u062D\u0646 \u062D\u0633\u0628 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 (Zone \xD7 Mode)</h3>
                <button class="btn-secondary-pill" id="btn-reset-rates">\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629</button>
            </div>
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629</th>
                            <th>\u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A</th>
                            <th>\u062A\u0648\u0635\u064A\u0644 \u0644\u0644\u0645\u0643\u062A\u0628 (Stop Desk / Office)</th>
                            <th>\u062A\u0648\u0635\u064A\u0644 \u0644\u0644\u0645\u0646\u0632\u0644 (Home Delivery)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Zone 1</strong></td>
                            <td>\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0648\u0627\u0644\u0645\u062A\u064A\u062C\u0629 (\u0627\u0644\u062C\u0632\u0627\u0626\u0631\u060C \u0627\u0644\u0628\u0644\u064A\u062F\u0629\u060C \u062A\u064A\u0628\u0627\u0632\u0629\u060C \u0628\u0648\u0645\u0631\u062F\u0627\u0633)</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="1" data-mode="office" value="${currentRates[1]?.office || 300}" style="width:110px;"> \u062F\u062C</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="1" data-mode="home" value="${currentRates[1]?.home || 450}" style="width:110px;"> \u062F\u062C</td>
                        </tr>
                        <tr>
                            <td><strong>Zone 2</strong></td>
                            <td>\u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0633\u0627\u062D\u0644\u064A\u0629 (\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629)</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="2" data-mode="office" value="${currentRates[2]?.office || 400}" style="width:110px;"> \u062F\u062C</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="2" data-mode="home" value="${currentRates[2]?.home || 600}" style="width:110px;"> \u062F\u062C</td>
                        </tr>
                        <tr>
                            <td><strong>Zone 3</strong></td>
                            <td>\u0627\u0644\u0647\u0636\u0627\u0628 \u0627\u0644\u0639\u0644\u064A\u0627 \u0648\u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="3" data-mode="office" value="${currentRates[3]?.office || 500}" style="width:110px;"> \u062F\u062C</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="3" data-mode="home" value="${currentRates[3]?.home || 750}" style="width:110px;"> \u062F\u062C</td>
                        </tr>
                        <tr>
                            <td><strong>Zone 4</strong></td>
                            <td>\u0627\u0644\u062C\u0646\u0648\u0628 \u0648\u0627\u0644\u0635\u062D\u0631\u0627\u0621 \u0627\u0644\u0643\u0628\u0631\u0649 (\u0628\u0645\u0627 \u0641\u064A\u0647\u0627 \u0645\u0633\u0639\u062F 66 \u0648\u0627\u0644\u0623\u0628\u064A\u0636 \u0633\u064A\u062F\u064A \u0627\u0644\u0634\u064A\u062E 69)</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="4" data-mode="office" value="${currentRates[4]?.office || 750}" style="width:110px;"> \u062F\u062C</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="4" data-mode="home" value="${currentRates[4]?.home || 1100}" style="width:110px;"> \u062F\u062C</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="margin-top:16px;text-align:left;">
                <button class="btn-pill" id="btn-save-rates">\u062D\u0641\u0638 \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0633\u0639\u064A\u0631\u0627\u062A</button>
            </div>
        </div>

        <!-- Sub-section C: Zone Assignments for 69 Wilayas -->
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h3 class="admin-card-title">\u{1F4CD} \u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0627\u0637\u0642 (Zone 1 - 4)</h3>
                    <span style="font-size:0.8rem;color:var(--text-muted);">\u062A\u0639\u062F\u064A\u0644 \u062A\u0635\u0646\u064A\u0641 \u0623\u064A \u0648\u0644\u0627\u064A\u0629 \u0648\u0641\u0642 \u0639\u0642\u0648\u062F \u0634\u0631\u0643\u0627\u062A \u0627\u0644\u062A\u0648\u0635\u064A\u0644</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <input type="text" class="admin-search-input" id="inp-search-wilayas" placeholder="\u{1F50D} \u0628\u062D\u062B \u0639\u0646 \u0648\u0644\u0627\u064A\u0629 \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0631\u0642\u0645..." value="${escapeHTML(wilayaFilterQuery)}" style="min-width:240px;">
                    <button class="btn-secondary-pill" id="btn-reset-zones">\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0631\u0633\u0645\u064A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A</button>
                </div>
            </div>
            <div class="table-responsive" style="max-height:420px;overflow-y:auto;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="width:70px;">\u0627\u0644\u0631\u0642\u0645</th>
                            <th>\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629</th>
                            <th>\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629/\u0627\u0644\u0644\u0627\u062A\u064A\u0646\u064A\u0629</th>
                            <th>\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629</th>
                            <th>\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u0637\u0642\u0629</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredWilayas.map((w) => {
      const zone = getWilayaZone(w.code);
      return `
                                <tr>
                                    <td><strong>${w.code}</strong></td>
                                    <td>${escapeHTML(w.nameAr)}</td>
                                    <td>${escapeHTML(w.nameEn)}</td>
                                    <td>
                                        <span class="status-pill ${zone === 4 ? "out-of-stock" : zone === 1 ? "in-stock" : "low-stock"}">
                                            Zone ${zone}
                                        </span>
                                    </td>
                                    <td>
                                        <select class="admin-select wilaya-zone-select" data-code="${w.code}" style="padding:4px 8px;font-size:0.8rem;">
                                            <option value="1" ${zone === 1 ? "selected" : ""}>Zone 1 (\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0648\u0627\u0644\u0645\u062A\u064A\u062C\u0629)</option>
                                            <option value="2" ${zone === 2 ? "selected" : ""}>Zone 2 (\u0627\u0644\u0633\u0627\u062D\u0644 \u0648\u0627\u0644\u0634\u0645\u0627\u0644)</option>
                                            <option value="3" ${zone === 3 ? "selected" : ""}>Zone 3 (\u0627\u0644\u0647\u0636\u0627\u0628 \u0627\u0644\u0639\u0644\u064A\u0627 \u0648\u0627\u0644\u062F\u0627\u062E\u0644)</option>
                                            <option value="4" ${zone === 4 ? "selected" : ""}>Zone 4 (\u0627\u0644\u062C\u0646\u0648\u0628 \u0648\u0627\u0644\u0635\u062D\u0631\u0627\u0621)</option>
                                        </select>
                                    </td>
                                </tr>
                            `;
    }).join("")}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:16px;text-align:left;">
                <button class="btn-pill" id="btn-save-wilaya-zones">\u062D\u0641\u0638 \u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A</button>
            </div>
        </div>

        <!-- Sub-section D: Preview Live Shipping Calculator -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">\u{1F9EE} \u062D\u0627\u0633\u0628\u0629 \u0645\u062D\u0627\u0643\u0627\u0629 \u0643\u0644\u0641\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 (Live Preview)</h3>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;align-items:flex-end;">
                <div class="form-group">
                    <label class="form-label">\u0627\u062E\u062A\u0631 \u0627\u0644\u0648\u0644\u0627\u064A\u0629</label>
                    <select class="admin-select" id="calc-wilaya-select" style="border-radius:var(--radius-md);">
                        ${ALGERIA_WILAYAS_DATA.map((w) => `<option value="${w.code}">${w.code} - ${w.nameAr} (${w.nameEn})</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">\u0646\u0648\u0639 \u0627\u0644\u062A\u0648\u0635\u064A\u0644</label>
                    <select class="admin-select" id="calc-mode-select" style="border-radius:var(--radius-md);">
                        <option value="office">\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646 \u0627\u0644\u0645\u0643\u062A\u0628 (Stop Desk)</option>
                        <option value="home">\u062A\u0648\u0635\u064A\u0644 \u0644\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0644\u0645\u0646\u0632\u0644 (Home)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">\u0642\u064A\u0645\u0629 \u0627\u0644\u0633\u0644\u0629 (\u062F\u062C)</label>
                    <input type="number" class="admin-input" id="calc-subtotal-inp" value="15000" step="500">
                </div>
            </div>

            <div id="calc-result-box" style="margin-top:20px;padding:16px;border-radius:var(--radius-md);background:var(--surface-container-low);display:flex;justify-content:space-around;flex-wrap:wrap;gap:12px;text-align:center;">
                <!-- Computed dynamically -->
            </div>
        </div>
    `;
    bindShippingSectionEvents(container);
    updateCalculatorPreview(container);
  }
  function bindShippingSectionEvents(container) {
    const saveThreshBtn = container.querySelector("#btn-save-threshold");
    const threshInp = container.querySelector("#inp-free-shipping-threshold");
    if (saveThreshBtn && threshInp) {
      saveThreshBtn.onclick = () => {
        const val = parseInt(threshInp.value, 10);
        StorageService.setFreeShippingThreshold(val);
        window.adminToast?.("\u062A\u0645 \u062D\u0641\u0638 \u0639\u062A\u0628\u0629 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u062C\u0627\u0646\u064A \u0628\u0646\u062C\u0627\u062D!", "success");
        updateCalculatorPreview(container);
      };
    }
    const resetThreshBtn = container.querySelector("#btn-reset-threshold");
    if (resetThreshBtn) {
      resetThreshBtn.onclick = () => {
        StorageService.removeItem(STORAGE_KEYS.FREE_SHIPPING_THRESHOLD);
        window.adminToast?.("\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0639\u062A\u0628\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 (20,000 \u062F\u062C)", "success");
        renderShippingSection(container);
      };
    }
    const saveRatesBtn = container.querySelector("#btn-save-rates");
    if (saveRatesBtn) {
      saveRatesBtn.onclick = () => {
        const newRates = { 1: {}, 2: {}, 3: {}, 4: {} };
        container.querySelectorAll(".rate-inp").forEach((inp) => {
          const z = inp.getAttribute("data-zone");
          const m = inp.getAttribute("data-mode");
          const v = Math.max(0, parseInt(inp.value, 10) || 0);
          newRates[z][m] = v;
        });
        StorageService.setShippingRates(newRates);
        window.adminToast?.("\u062A\u0645 \u062D\u0641\u0638 \u062C\u062F\u0648\u0644 \u062A\u0633\u0639\u064A\u0631\u0627\u062A \u0627\u0644\u0634\u062D\u0646 \u0628\u0646\u062C\u0627\u062D!", "success");
        updateCalculatorPreview(container);
      };
    }
    const resetRatesBtn = container.querySelector("#btn-reset-rates");
    if (resetRatesBtn) {
      resetRatesBtn.onclick = () => {
        StorageService.removeItem(STORAGE_KEYS.SHIPPING_RATES);
        window.adminToast?.("\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0633\u0639\u064A\u0631\u0627\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629", "success");
        renderShippingSection(container);
      };
    }
    const wilayaSearchInp = container.querySelector("#inp-search-wilayas");
    if (wilayaSearchInp) {
      wilayaSearchInp.addEventListener("input", (e) => {
        wilayaFilterQuery = e.target.value;
        renderShippingSection(container);
        const refocused = container.querySelector("#inp-search-wilayas");
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }
    const saveZonesBtn = container.querySelector("#btn-save-wilaya-zones");
    if (saveZonesBtn) {
      saveZonesBtn.onclick = () => {
        const zones = {
          ZONE_1: [],
          ZONE_3: [],
          ZONE_4: []
        };
        container.querySelectorAll(".wilaya-zone-select").forEach((sel) => {
          const code = parseInt(sel.getAttribute("data-code"), 10);
          const val = parseInt(sel.value, 10);
          if (val === 1) zones.ZONE_1.push(code);
          else if (val === 3) zones.ZONE_3.push(code);
          else if (val === 4) zones.ZONE_4.push(code);
        });
        StorageService.setWilayaZones(zones);
        window.adminToast?.("\u062A\u0645 \u062D\u0641\u0638 \u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0628\u0646\u062C\u0627\u062D!", "success");
        updateCalculatorPreview(container);
      };
    }
    const resetZonesBtn = container.querySelector("#btn-reset-zones");
    if (resetZonesBtn) {
      resetZonesBtn.onclick = () => {
        StorageService.removeItem(STORAGE_KEYS.WILAYA_ZONES);
        window.adminToast?.("\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629", "success");
        renderShippingSection(container);
      };
    }
    const calcWilaya = container.querySelector("#calc-wilaya-select");
    const calcMode = container.querySelector("#calc-mode-select");
    const calcSubtotal = container.querySelector("#calc-subtotal-inp");
    [calcWilaya, calcMode, calcSubtotal].forEach((el) => {
      if (el) el.addEventListener("input", () => updateCalculatorPreview(container));
    });
  }
  function updateCalculatorPreview(container) {
    const calcWilaya = container.querySelector("#calc-wilaya-select");
    const calcMode = container.querySelector("#calc-mode-select");
    const calcSubtotal = container.querySelector("#calc-subtotal-inp");
    const resultBox = container.querySelector("#calc-result-box");
    if (!resultBox || !calcWilaya || !calcMode || !calcSubtotal) return;
    const wilayaCode = parseInt(calcWilaya.value, 10) || 16;
    const mode = calcMode.value;
    const subtotal = Math.max(0, parseInt(calcSubtotal.value, 10) || 0);
    const zone = getWilayaZone(wilayaCode);
    const cost = calculateShippingCost(wilayaCode, mode);
    const { isUnlocked, remaining, percentage, threshold } = getFreeShippingStatus(subtotal);
    const finalShipping = isUnlocked ? 0 : cost;
    const totalOrder = subtotal + finalShipping;
    resultBox.innerHTML = `
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629</div>
            <div style="font-size:1.2rem;font-weight:800;">Zone ${zone}</div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">\u0643\u0644\u0641\u0629 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0639\u0627\u062F\u064A\u0629</div>
            <div style="font-size:1.2rem;font-weight:800;">${formatPrice(cost)}</div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">\u0645\u0624\u0647\u0644 \u0644\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u061F</div>
            <div style="font-size:1.1rem;font-weight:800;color:${isUnlocked ? "#16a34a" : "#ea580c"};">
                ${isUnlocked ? "\u2713 \u0646\u0639\u0645 (\u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A)" : `\u0644\u0627 (\u0628\u0627\u0642\u064A ${formatPrice(remaining)})`}
            </div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">\u0643\u0644\u0641\u0629 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u062D\u062A\u0633\u0628\u0629</div>
            <div style="font-size:1.2rem;font-weight:800;color:${isUnlocked ? "#16a34a" : "inherit"};">
                ${formatPrice(finalShipping)}
            </div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062A\u0648\u0642\u0639</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">${formatPrice(totalOrder)}</div>
        </div>
    `;
  }
  function renderSettingsSection(container) {
    if (!container) return;
    const saved = StorageService.getSettings() || {};
    const s = { ...DEFAULT_SITE_SETTINGS, ...saved };
    container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">\u2699\uFE0F \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0645\u062A\u062C\u0631 (Site Settings)</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">\u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u062A\u062C\u0631\u060C \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644\u060C \u0646\u0635\u0648\u0635 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0648\u0627\u0644\u0641\u0648\u062A\u0631\u060C \u0648\u0627\u0644\u0634\u0627\u0631\u0627\u062A</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="btn-pill" id="btn-save-site-settings">\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A</button>
                    <button class="btn-secondary-pill" id="btn-reset-site-settings">\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u062A</button>
                </div>
            </div>

            <!-- Settings Sub Tabs -->
            <div class="admin-modal-tabs" style="background:var(--surface-white);margin-bottom:20px;padding:0;border-bottom:1px solid var(--border-light);">
                <button class="admin-tab-btn ${activeSettingsTab === "brand" ? "active" : ""}" data-stab="brand">\u{1F3F7}\uFE0F \u0627\u0644\u0647\u0648\u064A\u0629 \u0648\u0627\u0644\u0628\u0631\u0627\u0646\u062F</button>
                <button class="admin-tab-btn ${activeSettingsTab === "contact" ? "active" : ""}" data-stab="contact">\u{1F4DE} \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0648\u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628</button>
                <button class="admin-tab-btn ${activeSettingsTab === "topbar" ? "active" : ""}" data-stab="topbar">\u{1F4E2} \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u0639\u0644\u0648\u064A (Top Bar)</button>
                <button class="admin-tab-btn ${activeSettingsTab === "hero" ? "active" : ""}" data-stab="hero">\u{1F31F} \u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0640 Hero</button>
                <button class="admin-tab-btn ${activeSettingsTab === "footer" ? "active" : ""}" data-stab="footer">\u{1F4C4} \u0627\u0644\u0641\u0648\u062A\u0631 \u0648\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062A\u0648\u0627\u0635\u0644</button>
                <button class="admin-tab-btn ${activeSettingsTab === "advanced" ? "active" : ""}" data-stab="advanced">\u26A1 \u062E\u064A\u0627\u0631\u0627\u062A \u0645\u062A\u0642\u062F\u0645\u0629</button>
            </div>

            <!-- Tab 1: Brand -->
            <div id="spane-brand" style="display:${activeSettingsTab === "brand" ? "block" : "none"};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631 (Brand Name)</label>
                        <input type="text" class="admin-input" id="set-brand-name" value="${escapeHTML(s.brandName)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0627\u0644\u0634\u0639\u0627\u0631 \u0627\u0644\u0641\u0631\u0639\u064A (Tagline)</label>
                        <input type="text" class="admin-input" id="set-tagline" value="${escapeHTML(s.tagline)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0631\u0627\u0628\u0637 \u0623\u064A\u0642\u0648\u0646\u0629 \u0627\u0644\u0645\u062A\u062C\u0631 (Favicon URL)</label>
                        <input type="text" class="admin-input" id="set-favicon" value="${escapeHTML(s.faviconUrl)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0631\u0627\u0628\u0637 \u0634\u0639\u0627\u0631 \u0645\u062E\u0635\u0635 (Logo Image URL)</label>
                        <input type="text" class="admin-input" id="set-logo-url" value="${escapeHTML(s.logoUrl)}" placeholder="\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B \u0644\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0631\u0645\u0632 SVG \u0627\u0644\u0645\u0644\u0643\u064A">
                    </div>
                </div>
            </div>

            <!-- Tab 2: Contact -->
            <div id="spane-contact" style="display:${activeSettingsTab === "contact" ? "block" : "none"};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0631\u0642\u0645 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0631\u0633\u0645\u064A (\u0628\u062F\u0648\u0646 \u0645\u0633\u0627\u0641\u0627\u062A \u0623\u0648 +) *</label>
                        <input type="text" class="admin-input" id="set-wa-num" value="${escapeHTML(s.whatsappNumber)}" placeholder="213676184805">
                        <span style="font-size:0.75rem;color:var(--text-muted);">\u064A\u064F\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u062C\u0645\u064A\u0639 \u0631\u0648\u0627\u0628\u0637 \u0648\u062A\u0623\u0643\u064A\u062F\u0627\u062A \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u064A \u0627\u0644\u0645\u062A\u062C\u0631</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0644\u0644\u0639\u0631\u0636</label>
                        <input type="text" class="admin-input" id="set-phone-disp" value="${escapeHTML(s.phoneDisplay)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0644\u0644\u062F\u0639\u0645</label>
                        <input type="email" class="admin-input" id="set-email" value="${escapeHTML(s.email)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0627\u0644\u0645\u062F\u064A\u0646\u0629 / \u0627\u0644\u0645\u0642\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A</label>
                        <input type="text" class="admin-input" id="set-city" value="${escapeHTML(s.city)}">
                    </div>
                </div>
            </div>

            <!-- Tab 3: Top Bar -->
            <div id="spane-topbar" style="display:${activeSettingsTab === "topbar" ? "block" : "none"};">
                <div class="form-group" style="margin-bottom:20px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-topbar-enable" ${s.topBarEnabled ? "checked" : ""} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;">\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u064A \u0627\u0644\u0639\u0644\u0648\u064A (Top Bar)</span>
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group" style="max-width:200px;">
                        <label class="form-label">\u0634\u0627\u0631\u0629 \u0627\u0644\u0634\u0631\u064A\u0637 (Badge)</label>
                        <input type="text" class="admin-input" id="set-topbar-badge" value="${escapeHTML(s.topBarBadge)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062A\u0631\u0648\u064A\u062C\u064A\u0629</label>
                        <input type="text" class="admin-input" id="set-topbar-text" value="${escapeHTML(s.topBarText)}">
                    </div>
                </div>
            </div>

            <!-- Tab 4: Hero -->
            <div id="spane-hero" style="display:${activeSettingsTab === "hero" ? "block" : "none"};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0634\u0627\u0631\u0629 \u0627\u0644\u0647\u064A\u062F\u0631 \u0627\u0644\u0646\u0634\u0637\u0629 (Live Badge)</label>
                        <input type="text" class="admin-input" id="set-hero-live" value="${escapeHTML(s.heroLiveBadge)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0634\u0631\u064A\u0637 \u0627\u0644\u062A\u064A\u0643\u0631 \u0627\u0644\u0639\u0644\u0648\u064A (Ticker Text)</label>
                        <input type="text" class="admin-input" id="set-hero-ticker" value="${escapeHTML(s.heroTicker)}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A H1</label>
                    <textarea class="admin-textarea" id="set-hero-title" style="min-height:60px;">${escapeHTML(s.heroTitle)}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">\u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u062A\u0631\u062D\u064A\u0628\u064A</label>
                    <textarea class="admin-textarea" id="set-hero-desc" style="min-height:70px;">${escapeHTML(s.heroDesc)}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0631\u0627\u0628\u0637 \u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0627\u0644\u0645\u0639\u0631\u0648\u0636 \u0641\u064A Hero</label>
                        <input type="text" class="admin-input" id="set-hero-img" value="${escapeHTML(s.heroProductImg)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0634\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0627\u0644\u0639\u0644\u0648\u064A\u0629 (Top Chip)</label>
                        <input type="text" class="admin-input" id="set-hero-chiptop" value="${escapeHTML(s.heroChipTop)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0634\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A (Acoustics Chip)</label>
                        <input type="text" class="admin-input" id="set-hero-chipacoustics" value="${escapeHTML(s.heroChipAcoustics)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0634\u0627\u0631\u0629 \u0627\u0644\u062F\u0641\u0639 (COD Chip)</label>
                        <input type="text" class="admin-input" id="set-hero-chipcod" value="${escapeHTML(s.heroChipCod)}">
                    </div>
                </div>
            </div>

            <!-- Tab 5: Footer & Social -->
            <div id="spane-footer" style="display:${activeSettingsTab === "footer" ? "block" : "none"};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">\u0631\u0627\u0628\u0637 \u0635\u0641\u062D\u0629 Facebook</label>
                        <input type="text" class="admin-input" id="set-fb" value="${escapeHTML(s.facebookUrl)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">\u0631\u0627\u0628\u0637 \u062D\u0633\u0627\u0628 Instagram</label>
                        <input type="text" class="admin-input" id="set-ig" value="${escapeHTML(s.instagramUrl)}">
                    </div>
                </div>
            </div>

            <!-- Tab 6: Advanced -->
            <div id="spane-advanced" style="display:${activeSettingsTab === "advanced" ? "block" : "none"};">
                <div class="form-group" style="margin-bottom:20px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-marquee-enable" ${s.marqueeEnabled ? "checked" : ""} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;">\u062A\u0641\u0639\u064A\u0644 \u0634\u0631\u064A\u0637 \u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0627\u0644\u0645\u062A\u062D\u0631\u0643 (Marquee Ticker)</span>
                    </label>
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-wa-float-enable" ${s.whatsappFloatEnabled ? "checked" : ""} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;">\u062A\u0641\u0639\u064A\u0644 \u0632\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0627\u0644\u0639\u0627\u0626\u0645 \u0627\u0644\u0633\u0631\u064A\u0639</span>
                    </label>
                </div>
                <div class="form-group" style="margin-bottom:20px;border-top:1px solid var(--border-light);padding-top:16px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-maint-mode" ${s.maintenanceMode ? "checked" : ""} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;color:#dc2626;">\u062A\u0641\u0639\u064A\u0644 \u0648\u0636\u0639 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u0624\u0642\u062A \u0644\u0644\u0645\u062A\u062C\u0631</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">\u0631\u0633\u0627\u0644\u0629 \u0648\u0636\u0639 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u0639\u0631\u0648\u0636\u0629 \u0644\u0644\u0632\u0628\u0627\u0626\u0646</label>
                    <textarea class="admin-textarea" id="set-maint-msg">${escapeHTML(s.maintenanceMessage)}</textarea>
                </div>
            </div>
        </div>
    `;
    bindSettingsSectionEvents(container);
  }
  function bindSettingsSectionEvents(container) {
    container.querySelectorAll(".admin-modal-tabs .admin-tab-btn").forEach((btn) => {
      btn.onclick = () => {
        activeSettingsTab = btn.getAttribute("data-stab");
        renderSettingsSection(container);
      };
    });
    const saveBtn = container.querySelector("#btn-save-site-settings");
    if (saveBtn) {
      saveBtn.onclick = () => {
        const getVal = (id) => container.querySelector("#" + id)?.value?.trim();
        const getChecked = (id) => container.querySelector("#" + id)?.checked;
        const newSettings = {
          brandName: getVal("set-brand-name"),
          tagline: getVal("set-tagline"),
          logoUrl: getVal("set-logo-url"),
          faviconUrl: getVal("set-favicon"),
          whatsappNumber: getVal("set-wa-num"),
          phoneDisplay: getVal("set-phone-disp"),
          email: getVal("set-email"),
          city: getVal("set-city"),
          facebookUrl: getVal("set-fb"),
          instagramUrl: getVal("set-ig"),
          topBarEnabled: getChecked("set-topbar-enable"),
          topBarBadge: getVal("set-topbar-badge"),
          topBarText: getVal("set-topbar-text"),
          heroLiveBadge: getVal("set-hero-live"),
          heroTicker: getVal("set-hero-ticker"),
          heroTitle: getVal("set-hero-title"),
          heroDesc: getVal("set-hero-desc"),
          heroProductImg: getVal("set-hero-img"),
          heroChipTop: getVal("set-hero-chiptop"),
          heroChipAcoustics: getVal("set-hero-chipacoustics"),
          heroChipCod: getVal("set-hero-chipcod"),
          marqueeEnabled: getChecked("set-marquee-enable"),
          whatsappFloatEnabled: getChecked("set-wa-float-enable"),
          maintenanceMode: getChecked("set-maint-mode"),
          maintenanceMessage: getVal("set-maint-msg")
        };
        StorageService.setSettings(newSettings);
        window.adminToast?.("\u062A\u0645 \u062D\u0641\u0638 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0646\u062C\u0627\u062D \u0648\u0633\u064A\u062A\u0645 \u062A\u0637\u0628\u064A\u0642\u0647\u0627 \u0639\u0644\u0649 \u0627\u0644\u0645\u062A\u062C\u0631!", "success");
      };
    }
    const resetBtn = container.querySelector("#btn-reset-site-settings");
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm("\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0644\u0644\u0645\u062A\u062C\u0631\u061F")) {
          StorageService.setSettings({ ...DEFAULT_SITE_SETTINGS });
          window.adminToast?.("\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0644\u0644\u0645\u062A\u062C\u0631", "success");
          renderSettingsSection(container);
        }
      };
    }
  }
  function renderBackupSection(container) {
    if (!container) return;
    const allKeys = StorageService.getAllKeys();
    let totalBytes = 0;
    const keyBreakdown = [];
    for (const [k, v] of Object.entries(allKeys)) {
      const str = JSON.stringify(v || "");
      const bytes = new Blob([str]).size;
      totalBytes += bytes;
      keyBreakdown.push({ key: k, kb: (bytes / 1024).toFixed(2), count: Array.isArray(v) ? v.length : null });
    }
    const totalKB = (totalBytes / 1024).toFixed(2);
    container.innerHTML = `
        <!-- Full Backup Actions -->
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">\u{1F4BE} \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 (Backup & Restore)</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">\u062A\u0623\u0645\u064A\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631 \u0645\u062D\u0644\u064A\u0627\u064B \u0628\u062F\u0648\u0646 \u062E\u0627\u062F\u0645\u060C \u0648\u062A\u0635\u062F\u064A\u0631 \u0648\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A</span>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
                <!-- Export Card -->
                <div style="border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;background:var(--surface-subtle);display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <h3 style="margin:0 0 8px 0;font-size:1.1rem;font-weight:800;">\u{1F4E5} \u062A\u062D\u0645\u064A\u0644 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0643\u0627\u0645\u0644\u0629 (Full Backup)</h3>
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0 0 16px 0;">
                            \u062A\u0635\u062F\u064A\u0631 \u0643\u0627\u0645\u0644 \u0643\u062A\u0627\u0644\u0648\u062C \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A\u060C \u0633\u062C\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A\u060C \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0645\u0646\u0627\u0637\u0642\u060C \u0648\u062A\u062E\u0635\u064A\u0635\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631 \u0641\u064A \u0645\u0644\u0641 JSON \u0645\u0634\u0641\u0631 \u0648\u0645\u0646\u0638\u0645.
                        </p>
                    </div>
                    <button class="btn-pill" id="btn-download-full-backup" style="align-self:flex-start;">
                        \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 (.JSON)
                    </button>
                </div>

                <!-- Import Card -->
                <div style="border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;background:var(--surface-subtle);display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <h3 style="margin:0 0 8px 0;font-size:1.1rem;font-weight:800;">\u{1F4E4} \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0648\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0646\u0633\u062E\u0629 \u0633\u0627\u0628\u0642\u0629</h3>
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0 0 16px 0;">
                            \u0627\u062E\u062A\u0631 \u0645\u0644\u0641 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0635\u0627\u0644\u062D \u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0627\u0641\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0641\u0648\u0631\u0627\u064B \u0645\u0639 \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0641\u062D\u0635 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0644\u0641.
                        </p>
                    </div>
                    <label class="btn-secondary-pill" style="align-self:flex-start;cursor:pointer;display:inline-flex;align-items:center;">
                        \u0627\u062E\u062A\u0631 \u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629
                        <input type="file" id="inp-import-full-backup" accept=".json" style="display:none;">
                    </label>
                </div>
            </div>

            <!-- Storage Analytics -->
            <div style="margin-bottom:28px;">
                <h3 style="font-size:0.95rem;font-weight:800;margin-bottom:12px;">\u{1F4CA} \u062D\u062C\u0645 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u062D\u0644\u064A (LocalStorage: ${totalKB} KB)</h3>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>\u0627\u0644\u0645\u0641\u062A\u0627\u062D (Storage Key)</th>
                                <th>\u0627\u0644\u0646\u0648\u0639 / \u0627\u0644\u0639\u0646\u0627\u0635\u0631</th>
                                <th>\u0627\u0644\u062D\u062C\u0645 \u0627\u0644\u062A\u0642\u0631\u064A\u0628\u064A (KB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${keyBreakdown.map((b) => `
                                <tr>
                                    <td><code style="font-size:0.8rem;background:var(--surface-container-low);padding:2px 6px;border-radius:4px;">${escapeHTML(b.key)}</code></td>
                                    <td>${b.count !== null ? `<strong>${b.count}</strong> \u0639\u0646\u0627\u0635\u0631` : "\u0643\u0627\u0626\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A"}</td>
                                    <td><strong>${b.kb} KB</strong></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Danger Zone -->
            <div style="border:1px solid #f87171;background:rgba(220, 38, 38, 0.04);border-radius:var(--radius-lg);padding:24px;">
                <h3 style="color:#dc2626;font-size:1.05rem;font-weight:800;margin:0 0 8px 0;">\u26A0\uFE0F \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629 (Danger Zone)</h3>
                <p style="font-size:0.84rem;color:var(--text-muted);margin:0 0 20px 0;">
                    \u0647\u0630\u0647 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u062A\u0624\u062F\u064A \u0625\u0644\u0649 \u0645\u0633\u062D \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0646\u0647\u0627\u0626\u064A\u0627\u064B. \u064A\u0631\u062C\u0649 \u062A\u0648\u062E\u064A \u0627\u0644\u062D\u0630\u0631 \u0642\u0628\u0644 \u062A\u0646\u0641\u064A\u0630 \u0623\u064A \u0625\u062C\u0631\u0627\u0621.
                </p>

                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="btn-secondary-pill" id="btn-reset-seed-products" style="color:#dc2626;border-color:#fca5a5;">
                        \u{1F504} \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 (8 \u0645\u0646\u062A\u062C\u0627\u062A)
                    </button>
                    <button class="btn-secondary-pill" id="btn-clear-cart" style="color:#dc2626;border-color:#fca5a5;">
                        \u{1F6D2} \u0625\u0641\u0631\u0627\u063A \u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A
                    </button>
                    <button class="btn-secondary-pill" id="btn-clear-orders" style="color:#dc2626;border-color:#fca5a5;">
                        \u{1F5D1}\uFE0F \u0645\u0633\u062D \u0633\u062C\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A
                    </button>
                    <button class="btn-pill" id="btn-factory-reset" style="background:#dc2626;color:#fff;">
                        \u26A1 \u0636\u0628\u0637 \u0627\u0644\u0645\u0635\u0646\u0639 (\u0645\u0633\u062D \u0643\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631)
                    </button>
                </div>
            </div>
        </div>
    `;
    bindBackupSectionEvents(container);
  }
  function bindBackupSectionEvents(container) {
    const downloadBtn = container.querySelector("#btn-download-full-backup");
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const backupPayload = {
          version: "1.0.0",
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          data: StorageService.getAllKeys()
        };
        const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zirox-full-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.adminToast?.("\u062A\u0645 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u062A\u062C\u0631 \u0628\u0646\u062C\u0627\u062D!", "success");
      };
    }
    const importInput = container.querySelector("#inp-import-full-backup");
    if (importInput) {
      importInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            const data = parsed.data || parsed;
            if (!data || typeof data !== "object") {
              throw new Error("\u0647\u064A\u0643\u0644 \u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0627\u0641\u0642.");
            }
            if (confirm("\u062A\u0646\u0628\u064A\u0647: \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0647\u0630\u0647 \u0627\u0644\u0646\u0633\u062E\u0629 \u0633\u064A\u0633\u062A\u0628\u062F\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u062A\u062C\u0631. \u0647\u0644 \u062A\u0648\u062F \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629\u061F")) {
              for (const [key, val] of Object.entries(data)) {
                if (val !== null && val !== void 0) {
                  StorageService.setItem(key, val);
                }
              }
              window.adminToast?.("\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0627\u0641\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D!", "success");
              renderBackupSection(container);
            }
          } catch (err) {
            console.error("Backup restore failed", err);
            window.adminToast?.("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0646\u0633\u062E\u0629: " + (err.message || "\u0627\u0644\u0645\u0644\u0641 \u062A\u0627\u0644\u0641"), "error");
          }
        };
        reader.readAsText(file);
        e.target.value = "";
      };
    }
    const resetProductsBtn = container.querySelector("#btn-reset-seed-products");
    if (resetProductsBtn) {
      resetProductsBtn.onclick = async () => {
        if (confirm("\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u062A\u0627\u0644\u0648\u062C \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0627\u0644\u0623\u0635\u0644\u064A (8 \u0645\u0646\u062A\u062C\u0627\u062A)\u061F \u0633\u064A\u062A\u0645 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629.")) {
          await ProductsService.seedInitialProducts();
          window.adminToast?.("\u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u062A\u0627\u0644\u0648\u062C \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A \u0628\u0646\u062C\u0627\u062D!", "success");
          renderBackupSection(container);
        }
      };
    }
    const clearCartBtn = container.querySelector("#btn-clear-cart");
    if (clearCartBtn) {
      clearCartBtn.onclick = () => {
        if (confirm("\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0631\u063A\u0628\u062A\u0643 \u0641\u064A \u0625\u0641\u0631\u0627\u063A \u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u061F")) {
          StorageService.setCart([]);
          window.adminToast?.("\u062A\u0645 \u0625\u0641\u0631\u0627\u063A \u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0628\u0646\u062C\u0627\u062D", "success");
          renderBackupSection(container);
        }
      };
    }
    const clearOrdersBtn = container.querySelector("#btn-clear-orders");
    if (clearOrdersBtn) {
      clearOrdersBtn.onclick = () => {
        if (confirm("\u062A\u062D\u0630\u064A\u0631: \u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u0643\u0627\u0641\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0646\u0647\u0627\u0626\u064A\u0627\u064B! \u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F\u061F")) {
          StorageService.setOrders([]);
          window.adminToast?.("\u062A\u0645 \u0645\u0633\u062D \u0633\u062C\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A \u0628\u0627\u0644\u0643\u0627\u0645\u0644", "success");
          renderBackupSection(container);
        }
      };
    }
    const factoryResetBtn = container.querySelector("#btn-factory-reset");
    if (factoryResetBtn) {
      factoryResetBtn.onclick = async () => {
        const code = prompt('\u0625\u062C\u0631\u0627\u0621 \u062E\u0637\u064A\u0631 \u0644\u0644\u063A\u0627\u064A\u0629! \u0644\u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631 \u0648\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062D\u0627\u0644\u0629 \u0627\u0644\u0635\u0641\u0631\u060C \u0627\u0643\u062A\u0628 "RESET" \u0628\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0644\u0644\u062A\u0623\u0643\u064A\u062F:');
        if (code === "RESET") {
          Object.values(STORAGE_KEYS).forEach((k) => StorageService.removeItem(k));
          await ProductsService.seedInitialProducts();
          window.adminToast?.("\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0636\u0628\u0637 \u0627\u0644\u0645\u0635\u0646\u0639 \u0628\u0646\u062C\u0627\u062D!", "success");
          renderBackupSection(container);
        } else if (code !== null) {
          window.adminToast?.("\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 (\u0627\u0644\u0631\u0645\u0632 \u063A\u064A\u0631 \u0645\u0637\u0627\u0628\u0642)", "warning");
        }
      };
    }
  }

  // admin.js
  var ADMIN_PASSWORD = typeof atob === "function" ? atob("emlyb3gtYWRtaW4tMjAyNg==") : "zirox-admin-2026";
  var AUTH_SESSION_KEY = "zirox_admin_auth";
  var FAILED_ATTEMPTS_KEY = "zirox_admin_failed_attempts";
  var LOCKOUT_UNTIL_KEY = "zirox_admin_lockout_until";
  var MAX_ATTEMPTS = 5;
  var LOCKOUT_MS = 5 * 60 * 1e3;
  var sessionStore = {
    get(key) {
      try {
        return typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage.getItem(key) : null;
      } catch (e) {
        return null;
      }
    },
    set(key, val) {
      try {
        if (typeof window !== "undefined" && window.sessionStorage) window.sessionStorage.setItem(key, val);
      } catch (e) {
      }
    },
    remove(key) {
      try {
        if (typeof window !== "undefined" && window.sessionStorage) window.sessionStorage.removeItem(key);
      } catch (e) {
      }
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
    return lockoutUntil > now ? lockoutUntil - now : 0;
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
  function adminToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    let icon = "\u2139\uFE0F";
    if (type === "success") icon = "\u2705";
    else if (type === "error") icon = "\u274C";
    else if (type === "warning") icon = "\u26A0\uFE0F";
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <h5>${escapeHTML(type === "error" ? "\u062E\u0637\u0623" : type === "success" ? "\u0646\u062C\u0627\u062D" : "\u062A\u0646\u0628\u064A\u0647")}</h5>
            <p>${escapeHTML(message)}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("toast-hide");
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
  window.adminToast = adminToast;
  var currentRoute = "overview";
  function bootAdminApp() {
    initTheme();
    initLanguage();
    if (!isAuthenticated()) {
      showLoginOverlay();
    } else {
      initAdminDashboard();
    }
    window.__zirox_admin_loaded = true;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAdminApp);
  } else {
    bootAdminApp();
  }
  function showLoginOverlay() {
    const appRoot = document.getElementById("admin-app");
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

                <h2>\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629</h2>
                <p>\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0633\u0631\u064A\u0629 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062A\u062C\u0631</p>

                <div class="auth-lockout" id="auth-lockout-msg" style="${remainingLockout > 0 ? "display:block;" : "display:none;"}">
                    \u26A0\uFE0F \u062A\u0645 \u0642\u0641\u0644 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0628\u0633\u0628\u0628 \u062A\u062C\u0627\u0648\u0632 5 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062E\u0627\u0637\u0626\u0629. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 <span id="lockout-countdown">${Math.ceil(remainingLockout / 1e3)}</span> \u062B\u0627\u0646\u064A\u0629.
                </div>

                <form id="admin-login-form">
                    <div class="auth-input-group">
                        <input type="password" class="auth-input" id="admin-password-input" placeholder="\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631..." autocomplete="current-password" required ${remainingLockout > 0 ? "disabled" : ""}>
                        <button type="button" class="auth-eye-btn" id="auth-toggle-pwd" title="\u0625\u0638\u0647\u0627\u0631/\u0625\u062E\u0641\u0627\u0621">\u{1F441}\uFE0F</button>
                    </div>

                    <div class="auth-error" id="auth-error-msg"></div>

                    <button type="submit" class="btn-pill" id="admin-submit-login" style="width:100%;justify-content:center;padding:13px;font-size:0.95rem;" ${remainingLockout > 0 ? "disabled" : ""}>
                        \u062F\u062E\u0648\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645
                    </button>
                </form>

                <div style="margin-top:24px;border-top:1px solid var(--border-light);padding-top:16px;">
                    <a href="index.html" style="color:var(--text-muted);text-decoration:none;font-size:0.82rem;">
                        \u2190 \u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0645\u062A\u062C\u0631 Zirox
                    </a>
                </div>
            </div>
        </div>
    `;
    bindLoginEvents();
  }
  function bindLoginEvents() {
    const form = document.getElementById("admin-login-form");
    const pwdInput = document.getElementById("admin-password-input");
    const eyeBtn = document.getElementById("auth-toggle-pwd");
    const errorMsg = document.getElementById("auth-error-msg");
    const lockoutMsg = document.getElementById("auth-lockout-msg");
    const submitBtn = document.getElementById("admin-submit-login");
    if (eyeBtn && pwdInput) {
      eyeBtn.onclick = () => {
        const isText = pwdInput.type === "text";
        pwdInput.type = isText ? "password" : "text";
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
          adminToast("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D!", "success");
          initAdminDashboard();
        } else {
          recordFailedAttempt();
          const failed = getFailedAttempts();
          if (failed >= MAX_ATTEMPTS) {
            lockoutMsg.style.display = "block";
            pwdInput.disabled = true;
            submitBtn.disabled = true;
            startLockoutTimer();
          } else {
            errorMsg.style.display = "block";
            errorMsg.textContent = `\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629! (${MAX_ATTEMPTS - failed} \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u062A\u0628\u0642\u064A\u0629 \u0642\u0628\u0644 \u0627\u0644\u0625\u063A\u0644\u0627\u0642)`;
            pwdInput.value = "";
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
    const countdownEl = document.getElementById("lockout-countdown");
    const timer = setInterval(() => {
      const ms = getLockoutRemainingMs();
      if (ms <= 0) {
        clearInterval(timer);
        clearAuthFailures();
        showLoginOverlay();
      } else if (countdownEl) {
        countdownEl.textContent = Math.ceil(ms / 1e3);
      }
    }, 1e3);
  }
  function initAdminDashboard() {
    const appRoot = document.getElementById("admin-app");
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
                        <span class="nav-icon">\u{1F4CA}</span>
                        <span>\u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A</span>
                    </a>
                    <a href="#products" class="admin-nav-item" data-route="products">
                        <span class="nav-icon">\u{1F4E6}</span>
                        <span>\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</span>
                    </a>
                    <a href="#orders" class="admin-nav-item" data-route="orders">
                        <span class="nav-icon">\u{1F4CB}</span>
                        <span>\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A</span>
                    </a>
                    <a href="#shipping" class="admin-nav-item" data-route="shipping">
                        <span class="nav-icon">\u{1F69A}</span>
                        <span>\u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0645\u0646\u0627\u0637\u0642</span>
                    </a>
                    <a href="#settings" class="admin-nav-item" data-route="settings">
                        <span class="nav-icon">\u2699\uFE0F</span>
                        <span>\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631</span>
                    </a>
                    <a href="#backup" class="admin-nav-item" data-route="backup">
                        <span class="nav-icon">\u{1F4BE}</span>
                        <span>\u0627\u0644\u0646\u0633\u062E \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629</span>
                    </a>
                </nav>

                <div class="admin-sidebar-footer">
                    <a href="index.html" class="admin-nav-item" target="_blank" rel="noopener">
                        <span class="nav-icon">\u{1F519}</span>
                        <span>\u0639\u0631\u0636 \u0627\u0644\u0645\u062A\u062C\u0631</span>
                    </a>
                    <button class="admin-nav-item logout" id="admin-logout-btn" style="width:100%;border:none;background:none;text-align:right;">
                        <span class="nav-icon">\u{1F6AA}</span>
                        <span>\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C</span>
                    </button>
                </div>
            </aside>

            <!-- Main Content Area -->
            <div class="admin-main-wrap">
                <!-- Top Header -->
                <header class="admin-header">
                    <div class="admin-header-left">
                        <button class="admin-mobile-toggle" id="admin-mobile-menu-btn" aria-label="Toggle Sidebar">\u2630</button>
                        <div class="admin-title-group">
                            <h1 id="admin-section-title">\u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A</h1>
                            <div class="admin-breadcrumb" id="admin-section-breadcrumb">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 / \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629</div>
                        </div>
                    </div>

                    <div class="admin-header-actions">
                        <div class="lang-switcher" aria-label="Language">
                            <button class="lang-btn ${getCurrentLang() === "ar" ? "active" : ""}" data-lang="ar">AR</button>
                            <button class="lang-btn ${getCurrentLang() === "fr" ? "active" : ""}" data-lang="fr">FR</button>
                            <button class="lang-btn ${getCurrentLang() === "en" ? "active" : ""}" data-lang="en">EN</button>
                        </div>
                        <button id="admin-theme-toggle" class="icon-btn" title="\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0646\u0645\u0637">\u{1F319}</button>
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
    window.addEventListener("hashchange", handleRoute);
    handleRoute();
  }
  function bindDashboardEvents() {
    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (confirm("\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C\u061F")) {
          sessionStore.remove(AUTH_SESSION_KEY);
          adminToast("\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0628\u0646\u062C\u0627\u062D.", "info");
          showLoginOverlay();
        }
      };
    }
    const mobileBtn = document.getElementById("admin-mobile-menu-btn");
    const sidebar = document.getElementById("admin-sidebar");
    if (mobileBtn && sidebar) {
      mobileBtn.onclick = (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
      };
      document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && e.target !== mobileBtn) {
          sidebar.classList.remove("open");
        }
      });
    }
    const themeBtn = document.getElementById("admin-theme-toggle");
    if (themeBtn) {
      themeBtn.onclick = () => {
        const isDark = document.body.getAttribute("data-theme") === "dark";
        if (isDark) {
          document.body.removeAttribute("data-theme");
          themeBtn.innerHTML = "\u{1F319}";
          StorageService.setTheme("light");
        } else {
          document.body.setAttribute("data-theme", "dark");
          themeBtn.innerHTML = "\u2600\uFE0F";
          StorageService.setTheme("dark");
        }
      };
    }
    document.querySelectorAll(".lang-switcher .lang-btn").forEach((btn) => {
      btn.onclick = () => {
        const lang = btn.getAttribute("data-lang");
        setLanguage(lang);
        document.querySelectorAll(".lang-switcher .lang-btn").forEach((b) => b.classList.toggle("active", b === btn));
        handleRoute();
      };
    });
  }
  async function handleRoute() {
    const hash = window.location.hash.slice(1) || "overview";
    currentRoute = hash;
    const sidebar = document.getElementById("admin-sidebar");
    if (sidebar) sidebar.classList.remove("open");
    document.querySelectorAll(".admin-nav-item").forEach((link) => {
      const route = link.getAttribute("data-route");
      link.classList.toggle("active", route === currentRoute);
    });
    const titleEl = document.getElementById("admin-section-title");
    const breadcrumbEl = document.getElementById("admin-section-breadcrumb");
    const mainView = document.getElementById("admin-main-view");
    if (!mainView) return;
    if (currentRoute === "overview") {
      if (titleEl) titleEl.textContent = "\u{1F4CA} \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629";
      if (breadcrumbEl) breadcrumbEl.textContent = "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 / \u0627\u0644\u0646\u0638\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629";
      await renderOverviewSection(mainView);
    } else if (currentRoute === "products") {
      if (titleEl) titleEl.textContent = "\u{1F4E6} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A";
      if (breadcrumbEl) breadcrumbEl.textContent = "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 / \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A";
      await renderProductsSection(mainView);
    } else if (currentRoute === "orders") {
      if (titleEl) titleEl.textContent = "\u{1F4CB} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A";
      if (breadcrumbEl) breadcrumbEl.textContent = "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 / \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A";
      renderOrdersSection(mainView);
    } else if (currentRoute === "shipping") {
      if (titleEl) titleEl.textContent = "\u{1F69A} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0645\u0646\u0627\u0637\u0642";
      if (breadcrumbEl) breadcrumbEl.textContent = "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 / \u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644";
      renderShippingSection(mainView);
    } else if (currentRoute === "settings") {
      if (titleEl) titleEl.textContent = "\u2699\uFE0F \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631";
      if (breadcrumbEl) breadcrumbEl.textContent = "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 / \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A";
      renderSettingsSection(mainView);
    } else if (currentRoute === "backup") {
      if (titleEl) titleEl.textContent = "\u{1F4BE} \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629";
      if (breadcrumbEl) breadcrumbEl.textContent = "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 / \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0648\u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A";
      renderBackupSection(mainView);
    } else {
      window.location.hash = "#overview";
    }
  }
  async function renderOverviewSection(container) {
    const products = await ProductsService.getAll();
    const orders = StorageService.getOrders();
    const totalProducts = products.length;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let totalInventoryValue = 0;
    products.forEach((p) => {
      const stock = typeof p.stock === "number" ? p.stock : 0;
      const price = typeof p.price === "number" ? p.price : 0;
      if (stock === 0) outOfStockCount++;
      else if (stock <= 5) lowStockCount++;
      totalInventoryValue += price * stock;
    });
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => (o.status || "Pending") === "Pending").length;
    let totalRevenue = 0;
    orders.forEach((o) => {
      if (o.status === "Delivered" || o.status === "Confirmed") {
        const rawPrice = parseInt(String(o.total || "").replace(/\D/g, ""), 10) || 0;
        totalRevenue += rawPrice;
      }
    });
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const recentOrders = orders.slice(0, 5);
    const lowStockProducts = products.filter((p) => typeof p.stock === "number" && p.stock <= 5);
    container.innerHTML = `
        <!-- 4x2 Stats Grid -->
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A</span>
                    <span class="admin-stat-icon">\u{1F4E6}</span>
                </div>
                <div class="admin-stat-value">${totalProducts}</div>
                <div class="admin-stat-sub">\u0645\u0646\u062A\u062C \u0646\u0634\u0637 \u0641\u064A \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0645\u0646\u062A\u062C\u0627\u062A \u0646\u0641\u062F\u062A</span>
                    <span class="admin-stat-icon" style="background:rgba(220,38,38,0.1);color:#dc2626;">\u26A0\uFE0F</span>
                </div>
                <div class="admin-stat-value" style="color:${outOfStockCount > 0 ? "#dc2626" : "inherit"};">${outOfStockCount}</div>
                <div class="admin-stat-sub ${outOfStockCount > 0 ? "danger" : ""}">\u0628\u062D\u0627\u062C\u0629 \u0644\u062A\u062C\u062F\u064A\u062F \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0641\u0648\u0631\u0627\u064B</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0645\u062E\u0632\u0648\u0646 \u0645\u0646\u062E\u0641\u0636 (\u2264 5)</span>
                    <span class="admin-stat-icon" style="background:rgba(234,88,12,0.1);color:#ea580c;">\u23F3</span>
                </div>
                <div class="admin-stat-value" style="color:${lowStockCount > 0 ? "#ea580c" : "inherit"};">${lowStockCount}</div>
                <div class="admin-stat-sub ${lowStockCount > 0 ? "warning" : ""}">\u0642\u0637\u0639 \u0623\u0648\u0634\u0643\u062A \u0639\u0644\u0649 \u0627\u0644\u0646\u0641\u0627\u062F</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0643\u0644\u064A\u0629</span>
                    <span class="admin-stat-icon">\u{1F4B0}</span>
                </div>
                <div class="admin-stat-value">${formatPrice(totalInventoryValue)}</div>
                <div class="admin-stat-sub">\u0633\u0639\u0631 \u0627\u0644\u0628\u064A\u0639 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A</span>
                    <span class="admin-stat-icon">\u{1F4CB}</span>
                </div>
                <div class="admin-stat-value">${totalOrders}</div>
                <div class="admin-stat-sub">\u0637\u0644\u0628\u064A\u0629 \u0645\u0633\u062C\u0644\u0629 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0637\u0644\u0628\u064A\u0627\u062A \u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631</span>
                    <span class="admin-stat-icon" style="background:rgba(234,88,12,0.1);color:#ea580c;">\u{1F552}</span>
                </div>
                <div class="admin-stat-value" style="color:${pendingOrders > 0 ? "#ea580c" : "inherit"};">${pendingOrders}</div>
                <div class="admin-stat-sub ${pendingOrders > 0 ? "warning" : ""}">\u0628\u062D\u0627\u062C\u0629 \u0644\u0644\u062A\u0623\u0643\u064A\u062F \u0639\u0628\u0631 \u0627\u0644\u0647\u0627\u062A\u0641/\u0648\u0627\u062A\u0633\u0627\u0628</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0645\u0624\u0643\u062F\u0629</span>
                    <span class="admin-stat-icon" style="background:rgba(22,163,74,0.1);color:#16a34a;">\u{1F4C8}</span>
                </div>
                <div class="admin-stat-value" style="color:#16a34a;">${formatPrice(totalRevenue)}</div>
                <div class="admin-stat-sub positive">\u0637\u0644\u0628\u064A\u0627\u062A \u0645\u0624\u0643\u062F\u0629 \u0648\u0645\u0633\u062A\u0644\u0645\u0629</div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-header">
                    <span class="admin-stat-title">\u0645\u062A\u0648\u0633\u0637 \u0642\u064A\u0645\u0629 \u0627\u0644\u0637\u0644\u0628</span>
                    <span class="admin-stat-icon">\u{1F3F7}\uFE0F</span>
                </div>
                <div class="admin-stat-value">${formatPrice(avgOrderValue)}</div>
                <div class="admin-stat-sub">\u0645\u0639\u062F\u0644 \u0633\u0644\u0629 \u0627\u0644\u0634\u0631\u0627\u0621</div>
            </div>
        </div>

        <!-- Quick Actions Row -->
        <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
            <a href="#products" class="btn-pill" id="quick-add-prod-btn" style="text-decoration:none;padding:12px 24px;">
                + \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u062C\u062F\u064A\u062F
            </a>
            <a href="#orders" class="btn-secondary-pill" style="text-decoration:none;padding:12px 24px;">
                \u{1F4CB} \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A
            </a>
            <a href="#backup" class="btn-secondary-pill" style="text-decoration:none;padding:12px 24px;">
                \u{1F4BE} \u0623\u062E\u0630 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629
            </a>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;">
            <!-- Recent Orders -->
            <div class="admin-card" style="margin-bottom:0;">
                <div class="admin-card-header">
                    <h3 class="admin-card-title">\u{1F552} \u0623\u062D\u062F\u062B \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0629</h3>
                    <a href="#orders" style="font-size:0.8rem;color:var(--text-muted);text-decoration:none;">\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2190</a>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628</th>
                                <th>\u0627\u0644\u0632\u0628\u0648\u0646</th>
                                <th>\u0627\u0644\u0648\u0644\u0627\u064A\u0629</th>
                                <th>\u0627\u0644\u0645\u0628\u0644\u063A</th>
                                <th>\u0627\u0644\u062D\u0627\u0644\u0629</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentOrders.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">
                                        \u0644\u0627 \u062A\u0648\u062C\u062F \u0637\u0644\u0628\u064A\u0627\u062A \u0645\u0633\u062C\u0644\u0629 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.
                                    </td>
                                </tr>
                            ` : recentOrders.map((o) => `
                                <tr>
                                    <td><strong>${escapeHTML(o.id)}</strong></td>
                                    <td>${escapeHTML(o.customerName)}</td>
                                    <td>${escapeHTML(o.wilaya)}</td>
                                    <td><strong>${escapeHTML(o.total)}</strong></td>
                                    <td>
                                        <span class="status-pill status-${(o.status || "pending").toLowerCase()}">
                                            ${escapeHTML(o.status || "Pending")}
                                        </span>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Low Stock Warnings -->
            <div class="admin-card" style="margin-bottom:0;">
                <div class="admin-card-header">
                    <h3 class="admin-card-title" style="color:#dc2626;">\u26A0\uFE0F \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646</h3>
                    <a href="#products" style="font-size:0.8rem;color:var(--text-muted);text-decoration:none;">\u0625\u062F\u0627\u0631\u0629 \u2190</a>
                </div>
                <div>
                    ${lowStockProducts.length === 0 ? `
                        <div style="padding:28px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
                            \u2728 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u062A\u0648\u0641\u0631\u0629 \u0628\u0645\u062E\u0632\u0648\u0646 \u0643\u0627\u0641\u064D.
                        </div>
                    ` : lowStockProducts.map((p) => `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light);">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <img src="${sanitizeURL(p.image, "assets/product-image.png")}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;" onerror="this.src='assets/product-image.png'">
                                <div>
                                    <div style="font-weight:700;font-size:0.85rem;">${escapeHTML(p.name?.ar || (typeof p.name === "string" ? p.name : p.id))}</div>
                                    <div style="font-size:0.75rem;color:var(--text-muted);">${formatPrice(p.price || 0)}</div>
                                </div>
                            </div>
                            <span class="status-pill ${p.stock === 0 ? "out-of-stock" : "low-stock"}">
                                ${p.stock === 0 ? "\u0646\u0641\u062F" : `${p.stock} \u0641\u0642\u0637`}
                            </span>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
  }
  function initTheme() {
    const stored = StorageService.getTheme();
    if (stored === "dark") {
      document.body.setAttribute("data-theme", "dark");
      const themeBtn = document.getElementById("admin-theme-toggle");
      if (themeBtn) themeBtn.innerHTML = "\u2600\uFE0F";
    }
  }
  function initLanguage() {
    const lang = StorageService.getLanguage("ar");
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }
})();
