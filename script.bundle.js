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
  function sanitizeCartItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it) => it && typeof it === "object").map((it) => ({
      id: typeof it.id === "string" ? it.id.slice(0, 64) : "item_" + Math.random().toString(36).slice(2),
      name: typeof it.name === "string" ? it.name.slice(0, 200) : "",
      price: safePrice(it.price),
      image: typeof it.image === "string" ? it.image.slice(0, 500) : "assets/product-image.png",
      quantity: Math.min(99, Math.max(1, Math.trunc(Number(it.quantity)) || 1))
    })).filter((it) => it.name.length > 0);
  }

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

  // cart.js
  var CartServiceClass = class {
    constructor() {
      this.items = sanitizeCartItems(StorageService.getCart());
      this.subscribers = /* @__PURE__ */ new Set();
    }
    /**
     * Subscribe to cart state changes
     * @param {Function} callback Receives updated items array
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
      if (typeof callback === "function") {
        this.subscribers.add(callback);
        callback(this.getItems());
      }
      return () => this.subscribers.delete(callback);
    }
    /**
     * Notify all observers and persist to StorageService
     * @private
     */
    notify() {
      StorageService.setCart(this.items);
      const currentItems = this.getItems();
      this.subscribers.forEach((cb) => {
        try {
          cb(currentItems);
        } catch (err) {
          console.error("CartService: Subscriber error", err);
        }
      });
    }
    /**
     * Get a shallow copy of items in the cart
     * @returns {Array<object>}
     */
    getItems() {
      return [...this.items];
    }
    /**
     * Total number of individual items in the cart
     * @returns {number}
     */
    getTotalCount() {
      return this.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
    }
    /**
     * Calculate subtotal price for all items in the cart
     * @returns {number}
     */
    getSubtotal() {
      return this.items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
    }
    /**
     * Add a product to the cart
     * @param {object} product
     * @param {string} product.id
     * @param {string} product.name
     * @param {number} product.price
     * @param {string} [product.image]
     * @param {number} [quantity=1]
     */
    addItem(product, quantity = 1) {
      const qty = Math.min(99, Math.max(1, parseInt(quantity, 10) || 1));
      const price = safePrice(product.price);
      const name = String(product.name || "").slice(0, 200);
      if (!name) return;
      const existing = this.items.find((i) => product.id && i.id === product.id || i.name === name);
      if (existing) {
        existing.quantity = Math.min(99, existing.quantity + qty);
      } else {
        this.items.push({
          id: product.id || "item_" + Date.now(),
          name,
          price,
          image: product.image || "assets/product-image.png",
          quantity: qty
        });
      }
      this.notify();
    }
    /**
     * Update quantity for item at specific index
     * @param {number} index
     * @param {number} quantity
     */
    updateQuantity(index, quantity) {
      if (index < 0 || index >= this.items.length) return;
      const newQty = Math.min(99, Math.max(0, parseInt(quantity, 10) || 0));
      if (newQty <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = newQty;
        this.notify();
      }
    }
    /**
     * Increment item quantity by 1
     * @param {number} index
     */
    increaseQuantity(index) {
      if (index >= 0 && index < this.items.length) {
        this.items[index].quantity = Math.min(99, this.items[index].quantity + 1);
        this.notify();
      }
    }
    /**
     * Decrement item quantity by 1, or remove if reaching 0
     * @param {number} index
     */
    decreaseQuantity(index) {
      if (index >= 0 && index < this.items.length) {
        if (this.items[index].quantity > 1) {
          this.items[index].quantity -= 1;
          this.notify();
        } else {
          this.removeItem(index);
        }
      }
    }
    /**
     * Remove an item from the cart
     * @param {number} index
     */
    removeItem(index) {
      if (index >= 0 && index < this.items.length) {
        this.items.splice(index, 1);
        this.notify();
      }
    }
    /**
     * Clear all items from the cart
     */
    clearCart() {
      this.items = [];
      this.notify();
    }
  };
  var CartService = new CartServiceClass();

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

  // script.js
  var toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  function showToast(title, message, image = "", icon = "\u{1F6CD}\uFE0F") {
    const toast = document.createElement("div");
    toast.className = "toast";
    const safeTitle = escapeHTML(title);
    const safeMessage = escapeHTML(message);
    const safeImg = sanitizeURL(image, "");
    const visualMedia = safeImg ? `<img src="${safeImg}" alt="${safeTitle}" class="toast-img" onerror="this.style.display='none'">` : `<div class="toast-icon">${escapeHTML(icon)}</div>`;
    toast.innerHTML = `
        ${visualMedia}
        <div class="toast-content">
            <h5>${safeTitle}</h5>
            <p>${safeMessage}</p>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("toast-hide");
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
  window.showToast = showToast;
  function buildProductCard(product) {
    if (!product) return "";
    const id = escapeHTML(product.id || "");
    const name = escapeHTML(localize(product.name));
    const categoryKey = escapeHTML((product.categoryKey || "general").toLowerCase());
    const category = escapeHTML(localize(product.category) || "General");
    const rawShortDesc = localize(product.shortDesc) || localize(product.description) || "";
    const shortDesc = escapeHTML(rawShortDesc);
    const imageSrc = sanitizeURL(product.image, "assets/product-image.png");
    const price = parseInt(product.price, 10) || 0;
    const formattedPrice = escapeHTML(formatPrice(price));
    const ratingVal = (parseFloat(product.rating) || 4.9).toFixed(1);
    const reviewsVal = parseInt(product.reviewsCount, 10) || 24;
    const stock = typeof product.stock === "number" ? product.stock : 10;
    let badgeClass = "";
    let badgeHTML = "";
    const localizedBadge = localize(product.badge);
    if (localizedBadge) {
      const b = String(localizedBadge).toUpperCase();
      if (b.includes("SALE") || b.includes("%") || b.includes("\u062A\u062E\u0641\u064A\u0636") || b.includes("SOLDE")) badgeClass = "sale";
      else if (b.includes("BEST") || b.includes("TOP") || b.includes("\u0623\u0643\u062B\u0631") || b.includes("MEILLEUR")) badgeClass = "bestseller";
      badgeHTML = `<span class="product-badge ${badgeClass}">${escapeHTML(localizedBadge)}</span>`;
    }
    const oldPriceHTML = product.oldPrice ? `<span class="product-old-price">${escapeHTML(formatPrice(product.oldPrice))}</span>` : "";
    const isLowStock = stock > 0 && stock <= 5;
    const lowStockHTML = isLowStock ? `<div style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.72rem;font-weight:700;color:#dc2626;background:rgba(220,38,38,0.08);padding:0.2rem 0.6rem;border-radius:var(--radius-full);width:max-content;margin-top:2px;">${escapeHTML(t("stock_low_badge").replace("{stock}", stock))}</div>` : "";
    const isOutOfStock = stock === 0;
    const buttonText = isOutOfStock ? escapeHTML(t("sold_out")) : escapeHTML(t("add_to_cart"));
    return `
    <div class="product-card" data-category="${categoryKey}">
        ${badgeHTML}
        <div class="product-img">
            <img src="${imageSrc}" alt="${name}" loading="lazy" onerror="this.src='assets/product-image.png'">
            <div class="quick-view-overlay">
                <a href="product-view.html?id=${id}" class="quick-view-btn">${escapeHTML(t("view_details"))}</a>
            </div>
        </div>
        <div class="product-details">
            <div class="product-category-meta">
                <span class="product-category">${category}</span>
                <span class="product-rating">\u2605 ${ratingVal} <span style="color:var(--text-muted);font-weight:500;font-size:0.7rem;">(${reviewsVal})</span></span>
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
                    ${isOutOfStock ? 'disabled aria-disabled="true"' : ""}>
                    <span>${buttonText}</span>
                </button>
            </div>
        </div>
    </div>`;
  }
  async function renderFeaturedProducts() {
    const grid = document.querySelector(".featured-products .products-grid") || document.querySelector(".products-grid:not(.shop-grid)");
    if (!grid) return;
    const products = await ProductsService.getAll();
    if (!products || products.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--color-black-60);">${escapeHTML(t("catalog_empty"))}</div>`;
      return;
    }
    const featured = products.slice(0, 6);
    grid.innerHTML = featured.map(buildProductCard).join("");
  }
  var shopInitialized = false;
  var HOME_GRID_LIMIT = 6;
  async function renderShopProducts() {
    const grid = document.querySelector(".shop-grid");
    if (!grid) return;
    const limit = grid.id === "trending-grid" ? HOME_GRID_LIMIT : Infinity;
    const products = await ProductsService.getAll();
    if (!shopInitialized) {
      shopInitialized = true;
      grid.innerHTML = Array(6).fill(0).map(() => `
            <div class="skeleton-card" style="padding: 16px; border-radius: 20px; border: 1px solid var(--border-light); background: var(--surface-white);">
                <div class="skeleton-box" style="height: 240px; border-radius: 14px; margin-bottom: 14px;"></div>
                <div class="skeleton-box" style="height: 18px; width: 75%; margin-bottom: 8px;"></div>
                <div class="skeleton-box" style="height: 14px; width: 45%; margin-bottom: 14px;"></div>
                <div class="skeleton-box" style="height: 42px; border-radius: 9999px;"></div>
            </div>
        `).join("");
      setTimeout(() => {
        if (!products || products.length === 0) {
          grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:70px;color:var(--color-black-60);">${escapeHTML(t("catalog_empty"))}</div>`;
          return;
        }
        grid.innerHTML = products.slice(0, limit).map(buildProductCard).join("");
        setupShopFilters(products, limit);
      }, 180);
      return;
    }
    if (!products || products.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:70px;color:var(--color-black-60);">${escapeHTML(t("catalog_empty"))}</div>`;
      return;
    }
    grid.innerHTML = products.slice(0, limit).map(buildProductCard).join("");
    setupShopFilters(products, limit);
  }
  function setupShopFilters(allProducts, limit = Infinity) {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const sortSelect = document.querySelector(".sort-select");
    const grid = document.querySelector(".shop-grid");
    const searchInput = document.getElementById("product-search");
    if (!grid) return;
    let activeCategory = "all";
    const activeBtnEl = document.querySelector(".filter-btn.active");
    if (activeBtnEl) {
      activeCategory = (activeBtnEl.getAttribute("data-category") || "all").toLowerCase();
    }
    let sortOrder = "featured";
    if (sortSelect) {
      const v = (sortSelect.value || "").toLowerCase();
      if (v.includes("low") || v.includes("croissant") || v.includes("\u0627\u0644\u0623\u0642\u0644")) sortOrder = "low";
      else if (v.includes("high") || v.includes("d\xE9croissant") || v.includes("\u0627\u0644\u0623\u0639\u0644\u0649")) sortOrder = "high";
      else if (v.includes("newest") || v.includes("nouveaut\xE9s") || v.includes("\u0627\u0644\u0623\u062D\u062F\u062B")) sortOrder = "newest";
    }
    let searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const applyFiltersAndSort = () => {
      const filtered = ProductsService.filterAndSort(allProducts, {
        category: activeCategory,
        searchQuery,
        sortOrder
      });
      if (filtered.length === 0) {
        grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--color-black-60);">
                    <div style="font-size:3rem;margin-bottom:12px;">\u{1F50D}</div>
                    <h3>${escapeHTML(t("search_placeholder") || "No products found")}</h3>
                </div>`;
      } else {
        grid.innerHTML = filtered.slice(0, limit).map(buildProductCard).join("");
      }
    };
    filterBtns.forEach((btn) => {
      btn.onclick = () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = (btn.getAttribute("data-category") || "all").toLowerCase();
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
        if (val.includes("low") || val.includes("croissant") || val.includes("\u0627\u0644\u0623\u0642\u0644")) sortOrder = "low";
        else if (val.includes("high") || val.includes("d\xE9croissant") || val.includes("\u0627\u0644\u0623\u0639\u0644\u0649")) sortOrder = "high";
        else if (val.includes("newest") || val.includes("nouveaut\xE9s") || val.includes("\u0627\u0644\u0623\u062D\u062F\u062B")) sortOrder = "newest";
        else sortOrder = "featured";
        applyFiltersAndSort();
      };
    }
    if (activeCategory !== "all" || searchQuery || sortOrder !== "featured") {
      applyFiltersAndSort();
    }
  }
  async function renderProductView() {
    const viewContainer = document.querySelector(".product-view-container");
    if (!viewContainer) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
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
                <h2>${escapeHTML(t("product_not_found"))}</h2>
                <a href="products.html" class="btn-primary" style="margin-top:20px;">${escapeHTML(t("browse_all"))}</a>
            </div>`;
      return;
    }
    const rawName = localize(p.name);
    const name = escapeHTML(rawName);
    document.title = `${name} | Zirox Store`;
    const category = escapeHTML(localize(p.category) || "General");
    const imageSrc = sanitizeURL(p.image, "assets/product-image.png");
    const formattedPrice = escapeHTML(formatPrice(p.price));
    const rawDesc = localize(p.description) || localize(p.shortDesc) || "";
    const safeDesc = escapeHTML(rawDesc).replace(/\n/g, "<br>");
    let specsHTML = "";
    const lang = getCurrentLang();
    const localizedSpecs = p.specs && typeof p.specs === "object" && (p.specs.ar || p.specs.fr || p.specs.en) ? p.specs[lang] || p.specs.ar || p.specs.fr || p.specs.en || {} : p.specs || {};
    if (localizedSpecs && typeof localizedSpecs === "object") {
      specsHTML = Object.entries(localizedSpecs).map(([key, val]) => `
            <div class="spec-box">
                <span class="spec-title">${escapeHTML(key)}</span>
                <span class="spec-value">${escapeHTML(val)}</span>
            </div>
        `).join("");
    }
    const galleryImages = Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery.map((img) => sanitizeURL(img, imageSrc)) : [imageSrc];
    const thumbsHTML = galleryImages.map((img, idx) => `
        <div class="thumb-item ${idx === 0 ? "active" : ""}" data-full-img="${encodeURI(img)}">
            <img src="${img}" alt="${name} - View ${idx + 1}" onerror="this.src='assets/product-image.png'">
        </div>
    `).join("");
    const dynamicSettings = StorageService.getSettings();
    const waNum = dynamicSettings?.whatsappNumber || "213676184805";
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
                <span style="background:#ecfdf5;color:#10b981;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">${escapeHTML(t("in_stock"))}</span>
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
                    \u{1F6D2} ${escapeHTML(t("add_to_cart"))}
                </button>
            </div>

            <div style="display:flex;gap:12px;margin-bottom:20px;">
                <a href="${whatsappLink}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="btn-secondary-pill"
                   style="flex:1;text-align:center;">
                   ${escapeHTML(t("order_whatsapp_direct"))}
                </a>
            </div>

            <!-- Point-of-Decision Trust Strip -->
            <div class="product-trust-strip">
                <div class="trust-pill">
                    <span class="trust-pill-icon">\u{1F6E1}\uFE0F</span>
                    <span>${escapeHTML(t("trust_warranty_title") || "\u0636\u0645\u0627\u0646 \u0631\u0633\u0645\u064A \u0645\u0639\u062A\u0645\u062F 12 \u0634\u0647\u0631\u0627\u064B")}</span>
                </div>
                <div class="trust-pill">
                    <span class="trust-pill-icon">\u{1F4E6}</span>
                    <span>${escapeHTML(t("trust_inspect_title") || "\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0637\u0631\u062F \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639")}</span>
                </div>
                <div class="trust-pill">
                    <span class="trust-pill-icon">\u{1F69A}</span>
                    <span>${escapeHTML(t("trust_shipping_title") || "\u062A\u0648\u0635\u064A\u0644 \u0633\u0631\u064A\u0639 \u0644\u0640 69 \u0648\u0644\u0627\u064A\u0629")}</span>
                </div>
                <div class="trust-pill">
                    <span class="trust-pill-icon">\u{1F4B5}</span>
                    <span>${escapeHTML(t("trust_cod_title") || "\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 100%")}</span>
                </div>
            </div>

            <div class="specifications">
                <h2>${escapeHTML(t("product_specs"))}</h2>
                <div class="spec-grid">
                    ${specsHTML}
                </div>
            </div>
        </div>
    `;
    viewContainer.querySelectorAll(".thumb-item").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const fullImg = thumb.getAttribute("data-full-img");
        const mainImg = document.getElementById("main-view-img");
        if (mainImg && fullImg) mainImg.src = decodeURI(fullImg);
        viewContainer.querySelectorAll(".thumb-item").forEach((t2) => t2.classList.remove("active"));
        thumb.classList.add("active");
      });
    });
    let selectedQty = 1;
    const maxStock = typeof p.stock === "number" && p.stock > 0 ? p.stock : 99;
    const qtyValEl = document.getElementById("qty-value");
    const decBtn = document.getElementById("qty-decrease");
    const incBtn = document.getElementById("qty-increase");
    const addBtn = document.getElementById("view-add-to-cart");
    if (decBtn && incBtn && qtyValEl) {
      const refreshQty = () => {
        qtyValEl.textContent = selectedQty;
        decBtn.disabled = selectedQty <= 1;
        decBtn.setAttribute("aria-disabled", String(selectedQty <= 1));
        incBtn.setAttribute("aria-disabled", String(selectedQty >= maxStock));
        incBtn.style.opacity = selectedQty >= maxStock ? "0.45" : "";
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
          showToast(t("toast_stock_limit"), t("toast_stock_limit_msg").replace("{max}", maxStock), "", "\u26A0\uFE0F");
        }
      };
      refreshQty();
    }
    if (addBtn) {
      addBtn.onclick = (e) => {
        e.preventDefault();
        const originalHtml = addBtn.innerHTML;
        addBtn.innerHTML = "\u2713 " + escapeHTML(t("toast_added") || "Added!");
        addBtn.style.transform = "scale(0.96)";
        setTimeout(() => {
          addBtn.innerHTML = originalHtml;
          addBtn.style.transform = "";
        }, 800);
        const localizedName = localize(p.name);
        CartService.addItem({
          id: p.id,
          name: localizedName,
          price: p.price,
          image: imageSrc
        }, selectedQty);
        toggleCart(true);
        showToast(t("toast_added"), `${selectedQty}x ${localizedName}`, imageSrc);
      };
    }
  }
  var cartOverlay = document.getElementById("cart-overlay");
  var cartSidebar = document.getElementById("cart-sidebar");
  var cartItemsContainer = document.getElementById("cart-items-container");
  var cartTotalElement = document.getElementById("cart-total");
  var cartBadgeElements = document.querySelectorAll(".cart-badge");
  function toggleCart(show) {
    if (!cartSidebar || !cartOverlay) return;
    if (show) {
      cartSidebar.classList.add("active");
      cartOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
      const closeBtn = cartSidebar.querySelector("#close-cart");
      if (closeBtn) closeBtn.focus();
    } else {
      cartSidebar.classList.remove("active");
      cartOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
  function updateCartUI(cartItems = CartService.getItems()) {
    const totalCount = CartService.getTotalCount();
    const subtotal = CartService.getSubtotal();
    cartBadgeElements.forEach((badge) => {
      const prevCount = parseInt(badge.textContent, 10) || 0;
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? "inline-flex" : "none";
      if (totalCount > 0 && totalCount !== prevCount) {
        badge.classList.remove("badge-bump");
        void badge.offsetWidth;
        badge.classList.add("badge-bump");
      }
    });
    if (cartTotalElement) {
      cartTotalElement.textContent = formatPrice(subtotal);
    }
    if (!cartSidebar || !cartItemsContainer) return;
    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML = `
            <div style="text-align:center;padding:60px 10px;color:var(--color-black-60);">
                <div style="font-size:3.5rem;margin-bottom:14px;">\u{1F6CD}\uFE0F</div>
                <h3 style="margin-bottom:6px;color:var(--color-black);">${escapeHTML(t("cart_empty"))}</h3>
                <p style="font-size:0.9rem;margin-bottom:20px;">${escapeHTML(t("cart_empty_sub"))}</p>
                <a href="products.html" class="btn-black-pill" style="padding:10px 22px;font-size:0.9rem;">${escapeHTML(t("cart_start_shopping"))}</a>
            </div>
        `;
    } else {
      cartItemsContainer.innerHTML = cartItems.map((item, index) => {
        const name = escapeHTML(item.name);
        const image = sanitizeURL(item.image, "assets/product-image.png");
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
                        <button type="button" class="remove-item" data-index="${index}">${escapeHTML(t("cart_remove"))}</button>
                    </div>
                </div>
            </div>`;
      }).join("");
    }
    let freeShippingBar = document.querySelector(".free-shipping-bar");
    if (!freeShippingBar && cartSidebar) {
      freeShippingBar = document.createElement("div");
      freeShippingBar.className = "free-shipping-bar";
      const header = cartSidebar.querySelector(".cart-header");
      if (header) header.after(freeShippingBar);
    }
    if (freeShippingBar) {
      const { isUnlocked, remaining, percentage } = getFreeShippingStatus(subtotal);
      const prevState = freeShippingBar.dataset.unlocked;
      const nextState = isUnlocked ? "1" : "0";
      if (prevState !== void 0 && prevState !== nextState) {
        freeShippingBar.classList.remove("bar-pulse");
        void freeShippingBar.offsetWidth;
        freeShippingBar.classList.add("bar-pulse");
      }
      freeShippingBar.dataset.unlocked = nextState;
      freeShippingBar.setAttribute("role", "status");
      freeShippingBar.setAttribute("aria-live", "polite");
      let targetTextEl = freeShippingBar.querySelector(".shipping-target-text");
      let progressFillEl = freeShippingBar.querySelector(".shipping-progress-fill");
      if (!targetTextEl || !progressFillEl) {
        freeShippingBar.innerHTML = `
                <div class="shipping-target-text"></div>
                <div class="shipping-progress-bg">
                    <div class="shipping-progress-fill" style="width: 0%;"></div>
                </div>
            `;
        targetTextEl = freeShippingBar.querySelector(".shipping-target-text");
        progressFillEl = freeShippingBar.querySelector(".shipping-progress-fill");
      }
      if (isUnlocked) {
        targetTextEl.innerHTML = `
                <span style="display:inline-flex;align-items:center;gap:6px;">\u2728 ${escapeHTML(t("free_shipping_unlocked"))}</span>
                <span style="font-weight:700;color:#10b981;">100%</span>
            `;
        progressFillEl.style.width = "100%";
        progressFillEl.style.background = "linear-gradient(90deg, #10b981 0%, #059669 100%)";
      } else {
        const formattedDiff = escapeHTML(formatPrice(remaining));
        const addText = escapeHTML(t("free_shipping_add")).replace("{amount}", `<strong>${formattedDiff}</strong>`);
        targetTextEl.innerHTML = `
                <span>${addText}</span>
                <span style="font-weight:700;color:var(--text-secondary);">${percentage}%</span>
            `;
        progressFillEl.style.width = `${percentage}%`;
        progressFillEl.style.background = "linear-gradient(90deg, #10b981 0%, #059669 100%)";
      }
    }
    cartItemsContainer.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const action = btn.getAttribute("data-action");
        if (action === "increase") {
          CartService.increaseQuantity(idx);
        } else if (action === "decrease") {
          CartService.decreaseQuantity(idx);
        }
      };
    });
    cartItemsContainer.querySelectorAll(".remove-item").forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        CartService.removeItem(idx);
      };
    });
    if (typeof window.updateCheckoutUI === "function") {
      window.updateCheckoutUI();
    }
  }
  CartService.subscribe(updateCartUI);
  var checkoutForm = document.getElementById("checkout-form");
  var shippingRadios = document.querySelectorAll('input[name="shipping"]');
  var shippingCostElement = document.getElementById("shipping-cost");
  var checkoutTotalElement = document.getElementById("total-cost");
  var checkoutSubtotalEl = document.getElementById("checkout-subtotal");
  var confirmBtn = document.getElementById("confirmBtn");
  var stateSelect = document.getElementById("state");
  var selectedDeliveryType = "office";
  var deskBadgeEl = document.getElementById("desk-price-badge");
  var homeBadgeEl = document.getElementById("home-price-badge");
  function updateCheckoutUI() {
    if (!checkoutTotalElement) return;
    const subtotal = CartService.getSubtotal();
    const cartItems = CartService.getItems();
    const wilayaVal = stateSelect ? stateSelect.value : "16";
    const deskCost = calculateShippingCost(wilayaVal || "16", "office");
    const homeCost = calculateShippingCost(wilayaVal || "16", "home");
    const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    if (deskBadgeEl) {
      deskBadgeEl.textContent = isFree ? t("free_badge") || "FREE" : formatPrice(deskCost);
    }
    if (homeBadgeEl) {
      homeBadgeEl.textContent = isFree ? t("free_badge") || "FREE" : formatPrice(homeCost);
    }
    const officeLabel = document.getElementById("label-ship-office");
    const homeLabel = document.getElementById("label-ship-home");
    if (officeLabel) officeLabel.classList.toggle("active", selectedDeliveryType === "office");
    if (homeLabel) homeLabel.classList.toggle("active", selectedDeliveryType === "home");
    const wilayaEstimateEl = document.getElementById("wilaya-delivery-estimate");
    if (wilayaEstimateEl) {
      const zone = getWilayaZone(wilayaVal || "16");
      const estimateMsg = zone === 4 ? t("delivery_estimate_south") : t("delivery_estimate_fast");
      wilayaEstimateEl.innerHTML = `<span>${estimateMsg}</span>`;
    }
    let currentShipping = selectedDeliveryType === "home" ? homeCost : deskCost;
    if (isFree) {
      currentShipping = 0;
    }
    const total = subtotal + currentShipping;
    if (shippingCostElement) {
      shippingCostElement.textContent = currentShipping === 0 ? t("free_badge") || "FREE" : formatPrice(currentShipping);
    }
    if (checkoutSubtotalEl) {
      checkoutSubtotalEl.textContent = formatPrice(subtotal);
    }
    checkoutTotalElement.textContent = formatPrice(total);
    let previewBox = document.querySelector(".checkout-items-preview");
    const summarySec = document.querySelector(".summary-section");
    if (!previewBox && summarySec) {
      previewBox = document.createElement("div");
      previewBox.className = "checkout-items-preview";
      const shippingMethods = summarySec.querySelector(".shipping-methods");
      if (shippingMethods) shippingMethods.before(previewBox);
    }
    if (previewBox) {
      if (cartItems.length === 0) {
        previewBox.innerHTML = `<p style="color:var(--color-black-60);font-size:0.88rem;">${escapeHTML(t("cart_empty"))}</p>`;
      } else {
        previewBox.innerHTML = cartItems.map((item) => `
                <div class="checkout-mini-item">
                    <img src="${sanitizeURL(item.image, "assets/product-image.png")}" alt="${escapeHTML(item.name)}" onerror="this.src='assets/product-image.png'">
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.85rem;line-height:1.2;">${escapeHTML(item.name)}</div>
                        <div style="color:var(--color-black-60);font-size:0.8rem;">${escapeHTML(t("checkout_qty"))}: ${item.quantity} \xD7 ${escapeHTML(formatPrice(item.price))}</div>
                    </div>
                </div>
            `).join("");
      }
    }
    const arrowHTML = '<span class="arrow-circle">\u2190</span>';
    if (cartItems.length === 0 && confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = "0.5";
      confirmBtn.innerHTML = `<span>${escapeHTML(t("cart_empty"))}</span>`;
    } else if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
      confirmBtn.innerHTML = `<span>${escapeHTML(t("confirm_whatsapp"))}</span>${arrowHTML}`;
    }
  }
  window.updateCheckoutUI = updateCheckoutUI;
  function initCheckout() {
    if (!checkoutForm) return;
    const nameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const addressInput = document.getElementById("address");
    const nameStatus = document.getElementById("name-status");
    const phoneStatus = document.getElementById("phone-status");
    const groupName = document.getElementById("group-fullName");
    const groupPhone = document.getElementById("group-phone");
    const groupState = document.getElementById("group-state");
    const groupAddress = document.getElementById("group-address");
    updateCheckoutUI();
    if (stateSelect) {
      stateSelect.addEventListener("change", () => {
        groupState?.classList.remove("has-error");
        updateCheckoutUI();
      });
    }
    document.querySelectorAll('.delivery-card input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        selectedDeliveryType = e.target.value === "home" ? "home" : "office";
        updateCheckoutUI();
      });
    });
    function validatePhone(showError = false) {
      const raw = phoneInput ? phoneInput.value.trim() : "";
      let clean = raw.replace(/[\s\-\(\)\.]/g, "");
      if (clean.startsWith("+213")) clean = "0" + clean.slice(4);
      else if (clean.startsWith("213")) clean = "0" + clean.slice(3);
      else if (clean.startsWith("00213")) clean = "0" + clean.slice(5);
      const isValid = /^(0)(5|6|7)[0-9]{8}$/.test(clean);
      if (isValid) {
        groupPhone?.classList.remove("has-error");
        groupPhone?.classList.add("is-valid");
        if (phoneStatus) {
          phoneStatus.textContent = t("phone_valid");
          phoneStatus.classList.add("valid");
        }
        return { isValid: true, cleanPhone: clean };
      } else {
        groupPhone?.classList.remove("is-valid");
        if (phoneStatus) {
          phoneStatus.textContent = "";
          phoneStatus.classList.remove("valid");
        }
        if (showError && raw.length > 0) {
          groupPhone?.classList.add("has-error");
        }
        return { isValid: false, cleanPhone: clean };
      }
    }
    function validateName(showError = false) {
      const name = nameInput ? nameInput.value.trim() : "";
      const isValid = name.length >= 3;
      if (isValid) {
        groupName?.classList.remove("has-error");
        groupName?.classList.add("is-valid");
        if (nameStatus) {
          nameStatus.textContent = t("name_valid");
          nameStatus.classList.add("valid");
        }
        return true;
      } else {
        groupName?.classList.remove("is-valid");
        if (nameStatus) {
          nameStatus.textContent = "";
          nameStatus.classList.remove("valid");
        }
        if (showError && name.length > 0) {
          groupName?.classList.add("has-error");
        }
        return false;
      }
    }
    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        validatePhone(false);
      });
      phoneInput.addEventListener("blur", () => {
        validatePhone(true);
      });
    }
    if (nameInput) {
      nameInput.addEventListener("input", () => {
        validateName(false);
      });
      nameInput.addEventListener("blur", () => {
        validateName(true);
      });
    }
    if (addressInput) {
      addressInput.addEventListener("input", () => {
        if (addressInput.value.trim().length >= 5) {
          groupAddress?.classList.remove("has-error");
        }
      });
      addressInput.addEventListener("blur", () => {
        if (addressInput.value.trim().length < 5 && addressInput.value.trim().length > 0) {
          groupAddress?.classList.add("has-error");
        }
      });
    }
    checkoutForm.onsubmit = (e) => {
      e.preventDefault();
      const cartItems = CartService.getItems();
      if (cartItems.length === 0) {
        showToast(t("toast_cart_empty"), t("cart_empty_sub"), "", "\u26A0\uFE0F");
        return;
      }
      const isNameValid = validateName(true);
      const phoneResult = validatePhone(true);
      const address = addressInput ? addressInput.value.trim() : "";
      const stateVal = stateSelect ? stateSelect.value : "";
      let isValid = true;
      if (!isNameValid) {
        groupName?.classList.add("has-error");
        isValid = false;
      }
      if (!phoneResult.isValid) {
        groupPhone?.classList.add("has-error");
        isValid = false;
      }
      if (!stateVal) {
        groupState?.classList.add("has-error");
        isValid = false;
      }
      if (!address || address.length < 5) {
        groupAddress?.classList.add("has-error");
        isValid = false;
      }
      if (!isValid) {
        const firstErr = document.querySelector(".form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea");
        if (firstErr) {
          firstErr.focus();
          firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        showToast(t("toast_validation_error"), t("err_form_general"), "", "\u26A0\uFE0F");
        return;
      }
      confirmBtn.innerHTML = escapeHTML(t("order_processing") || "Processing Order...");
      confirmBtn.style.opacity = "0.85";
      confirmBtn.style.pointerEvents = "none";
      const fullName = nameInput.value.trim();
      const cleanPhone = phoneResult.cleanPhone;
      const stateText = stateSelect.options[stateSelect.selectedIndex].text;
      const deliveryTxt = selectedDeliveryType === "home" ? t("home_delivery_title") : t("office_pickup_title");
      const totalPrice = checkoutTotalElement.textContent;
      const newOrder = {
        id: "ORD-" + Math.floor(1e5 + Math.random() * 9e5),
        customerName: fullName,
        phone: cleanPhone,
        wilaya: stateText,
        address,
        deliveryMethod: deliveryTxt,
        items: [...cartItems],
        total: totalPrice,
        status: "Pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      StorageService.saveOrder(newOrder);
      let orderItemsStr = "";
      cartItems.forEach((item) => {
        orderItemsStr += `\u25AA ${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}
`;
      });
      const activeLang = getCurrentLang();
      let message = "";
      if (activeLang === "ar") {
        message = `*\u062A\u0623\u0643\u064A\u062F \u0637\u0644\u0628\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 #${newOrder.id}* \u{1F4E6}
-----------------------------------
\u{1F464} *\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0644\u0642\u0628:* ${fullName}
\u{1F4DE} *\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641:* ${cleanPhone}
\u{1F4CD} *\u0627\u0644\u0648\u0644\u0627\u064A\u0629:* ${stateText}
\u{1F3E0} *\u0627\u0644\u0639\u0646\u0648\u0627\u0646:* ${address}
\u{1F69A} *\u0646\u0648\u0639 \u0627\u0644\u062A\u0648\u0635\u064A\u0644:* ${deliveryTxt}
-----------------------------------
\u{1F6CD}\uFE0F *\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629:*
${orderItemsStr}
\u{1F4B0} *\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A:* ${totalPrice}
-----------------------------------
\u064A\u0631\u062C\u0649 \u062A\u0623\u0643\u064A\u062F \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 \u0645\u0639 \u062E\u062F\u0645\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644. \u0634\u0643\u0631\u0627\u064B \u0644\u0643\u0645!`;
      } else if (activeLang === "fr") {
        message = `*Confirmation de Commande #${newOrder.id}* \u{1F4E6}
-----------------------------------
\u{1F464} *Nom & Pr\xE9nom :* ${fullName}
\u{1F4DE} *Num\xE9ro de T\xE9l\xE9phone :* ${cleanPhone}
\u{1F4CD} *Wilaya :* ${stateText}
\u{1F3E0} *Adresse Compl\xE8te :* ${address}
\u{1F69A} *Mode de Livraison :* ${deliveryTxt}
-----------------------------------
\u{1F6CD}\uFE0F *Articles :*
${orderItemsStr}
\u{1F4B0} *Total Commande :* ${totalPrice}
-----------------------------------
Merci de bien vouloir confirmer l'exp\xE9dition de cette commande.`;
      } else {
        message = `*Order Confirmation #${newOrder.id}* \u{1F4E6}
-----------------------------------
\u{1F464} *Name:* ${fullName}
\u{1F4DE} *Phone:* ${cleanPhone}
\u{1F4CD} *Wilaya:* ${stateText}
\u{1F3E0} *Address:* ${address}
\u{1F69A} *Delivery:* ${deliveryTxt}
-----------------------------------
\u{1F6CD}\uFE0F *Items:*
${orderItemsStr}
\u{1F4B0} *Total:* ${totalPrice}
-----------------------------------
Please confirm this order for dispatch. Thank you!`;
      }
      const dynamicSettings = StorageService.getSettings();
      const storeWhatsappNumber = dynamicSettings?.whatsappNumber || "213676184805";
      const whatsappUrl = `https://wa.me/${storeWhatsappNumber}?text=${encodeURIComponent(message)}`;
      confirmBtn.innerHTML = escapeHTML(t("order_redirecting") || "\u2713 Redirecting to WhatsApp...");
      CartService.clearCart();
      updateCheckoutUI();
      setTimeout(() => {
        const newWin = window.open(whatsappUrl, "_blank");
        if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
          window.location.href = whatsappUrl;
        } else {
          setTimeout(() => {
            location.href = "index.html";
          }, 2e3);
        }
      }, 600);
    };
  }
  async function onLanguageChanged() {
    const products = await ProductsService.getAll();
    const count = products ? products.length : 0;
    document.querySelectorAll('[data-i18n="view_all"]').forEach((el) => {
      const rawText = t("view_all") || "View All Products ({count})";
      const dynamicText = /\d+/.test(rawText) ? rawText.replace(/\d+/, count) : `${rawText} (${count})`;
      el.innerHTML = dynamicText;
    });
    const catalogBadge = document.getElementById("catalogCounterBadge");
    if (catalogBadge) {
      const template = t("catalog_counter") || "{count} items available";
      catalogBadge.textContent = template.replace("{count}", count);
    }
    await renderFeaturedProducts();
    await renderShopProducts();
    await renderProductView();
    updateCartUI();
    updateCheckoutUI();
    applyDynamicSiteSettings();
  }
  function applyDynamicSiteSettings() {
    const settings = StorageService.getSettings();
    if (!settings || typeof settings !== "object") return;
    const topBar = document.querySelector(".top-bar");
    if (topBar) {
      if (settings.topBarEnabled === false) {
        topBar.style.display = "none";
      } else {
        topBar.style.display = "";
        if (settings.topBarBadge) {
          const badge = topBar.querySelector(".top-bar-badge");
          if (badge) badge.textContent = settings.topBarBadge;
        }
        if (settings.topBarText) {
          const textSpan = topBar.querySelector("span:not(.top-bar-badge)");
          if (textSpan) textSpan.textContent = settings.topBarText;
        }
      }
    }
    if (settings.brandName) {
      document.querySelectorAll(".logo-name").forEach((el) => el.textContent = settings.brandName);
    }
    if (settings.tagline) {
      document.querySelectorAll(".logo-subtext").forEach((el) => el.textContent = settings.tagline);
    }
    if (settings.whatsappNumber) {
      const cleanWA = String(settings.whatsappNumber).replace(/\D/g, "");
      document.querySelectorAll('a[href*="wa.me/"]').forEach((link) => {
        const oldHref = link.getAttribute("href");
        if (oldHref) {
          link.href = oldHref.replace(/wa\.me\/\d+/, `wa.me/${cleanWA}`);
        }
      });
    }
    if (settings.heroProductImg) {
      const heroImg = document.getElementById("heroProductImg");
      if (heroImg) heroImg.src = sanitizeURL(settings.heroProductImg, "assets/product-image.png");
    }
    if (settings.heroLiveBadge) {
      const liveBadge = document.querySelector(".hero-live-badge span:last-child");
      if (liveBadge) liveBadge.textContent = settings.heroLiveBadge;
    }
    if (settings.heroTicker) {
      const ticker = document.querySelector(".hero-ticker");
      if (ticker) ticker.textContent = settings.heroTicker;
    }
    const marquee = document.querySelector(".marquee-container");
    if (marquee) {
      if (settings.marqueeEnabled === false) {
        marquee.style.display = "none";
      } else {
        marquee.style.display = "block";
      }
    }
    let waFloatBtn = document.getElementById("zirox-wa-float-btn");
    const isWaEnabled = settings.whatsappFloatEnabled !== false;
    if (isWaEnabled) {
      const rawNum = settings.whatsappNumber || "213676184805";
      const cleanWA = String(rawNum).replace(/\D/g, "");
      const defaultMsg = encodeURIComponent("\u0645\u0631\u062D\u0628\u0627\u064B Zirox Store! \u0623\u0631\u063A\u0628 \u0641\u064A \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A.");
      const waLink = `https://wa.me/${cleanWA}?text=${defaultMsg}`;
      if (!waFloatBtn) {
        waFloatBtn = document.createElement("a");
        waFloatBtn.id = "zirox-wa-float-btn";
        waFloatBtn.className = "zirox-wa-float-btn";
        waFloatBtn.target = "_blank";
        waFloatBtn.rel = "noopener noreferrer";
        waFloatBtn.setAttribute("aria-label", "Contact us on WhatsApp");
        waFloatBtn.innerHTML = `
                <div class="wa-float-pulse"></div>
                <div class="wa-float-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.905-.424-1.543-.639-2.518-2.222-2.595-2.324-.076-.102-.622-.829-.622-1.583 0-.754.394-1.127.533-1.282.14-.156.305-.195.407-.195.101 0 .203.001.292.006.093.004.218-.035.34.258.128.307.438 1.068.476 1.145.039.077.064.168.013.27-.051.102-.077.167-.153.257-.076.09-.16.2-.23.268-.078.077-.16.16-.068.318.092.158.408.673.876 1.09.602.535 1.11.701 1.268.78.158.078.25.067.344-.041.094-.108.403-.47.511-.631.108-.161.216-.134.364-.08.148.054.939.443 1.101.524.162.081.27.121.31.19.04.068.04.397-.104.802zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.442 5.176L2 22l4.965-1.303C8.423 21.543 10.154 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    </svg>
                </div>
                <div class="wa-float-label">
                    <span>\u0648\u0627\u062A\u0633\u0627\u0628 \u0645\u0628\u0627\u0634\u0631</span>
                </div>
            `;
        document.body.appendChild(waFloatBtn);
      }
      waFloatBtn.href = waLink;
      waFloatBtn.style.display = "flex";
    } else {
      if (waFloatBtn) waFloatBtn.style.display = "none";
    }
    if (settings.maintenanceMode) {
      let banner = document.getElementById("zirox-maint-banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "zirox-maint-banner";
        banner.style.cssText = "background:#dc2626;color:#ffffff;text-align:center;padding:10px 16px;font-size:0.88rem;font-weight:700;position:sticky;top:0;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,0.2);";
        banner.textContent = settings.maintenanceMessage || "\u0627\u0644\u0645\u062A\u062C\u0631 \u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u0624\u0642\u062A\u0629.";
        document.body.prepend(banner);
      }
    }
  }
  async function bootStoreApp() {
    await ProductsService.seedInitialProducts();
    applyDynamicSiteSettings();
    const themeToggleBtn = document.getElementById("theme-toggle");
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = StorageService.getTheme() || (prefersDarkScheme.matches ? "dark" : "light");
    const syncThemeA11y = () => {
      if (!themeToggleBtn) return;
      const isDark = document.body.getAttribute("data-theme") === "dark";
      themeToggleBtn.setAttribute("aria-pressed", String(isDark));
      themeToggleBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    };
    if (currentTheme === "dark") {
      document.body.setAttribute("data-theme", "dark");
      if (themeToggleBtn) themeToggleBtn.innerHTML = "\u2600\uFE0F";
    }
    syncThemeA11y();
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const isDark = document.body.getAttribute("data-theme") === "dark";
        if (isDark) {
          document.body.removeAttribute("data-theme");
          themeToggleBtn.innerHTML = "\u{1F319}";
          StorageService.setTheme("light");
        } else {
          document.body.setAttribute("data-theme", "dark");
          themeToggleBtn.innerHTML = "\u2600\uFE0F";
          StorageService.setTheme("dark");
        }
        syncThemeA11y();
      });
    }
    document.addEventListener("click", (e) => {
      const langBtn = e.target.closest(".lang-btn");
      if (langBtn) {
        e.preventDefault();
        const lang = langBtn.getAttribute("data-lang");
        if (lang) {
          setLanguage(lang, onLanguageChanged);
        }
      }
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest(".open-cart-btn")) {
        e.preventDefault();
        toggleCart(true);
      }
      if (e.target.closest("#close-cart") || e.target.closest("#cart-overlay")) {
        toggleCart(false);
      }
      const addBtn = e.target.closest(".add-to-cart-btn");
      if (addBtn && addBtn.id !== "view-add-to-cart") {
        e.preventDefault();
        const id = addBtn.getAttribute("data-id");
        const name = addBtn.getAttribute("data-name");
        const price = addBtn.getAttribute("data-price");
        const image = addBtn.getAttribute("data-image");
        if (name && price) {
          const originalHtml = addBtn.innerHTML;
          addBtn.innerHTML = "\u2713 " + escapeHTML(t("toast_added") || "Added!");
          addBtn.style.transform = "scale(0.96)";
          setTimeout(() => {
            addBtn.innerHTML = originalHtml;
            addBtn.style.transform = "";
          }, 800);
          CartService.addItem({ id, name, price, image }, 1);
          toggleCart(true);
          showToast(t("toast_added"), name, image);
        }
      }
    });
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mainNav = document.querySelector(".main-nav");
    if (mobileMenuToggle && mainNav) {
      mobileMenuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = mainNav.classList.toggle("mobile-open");
        mobileMenuToggle.setAttribute("aria-expanded", isOpen);
        mobileMenuToggle.innerHTML = isOpen ? "\u2715" : "\u2630";
      });
      document.addEventListener("click", (e) => {
        if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
          mainNav.classList.remove("mobile-open");
          mobileMenuToggle.setAttribute("aria-expanded", "false");
          mobileMenuToggle.innerHTML = "\u2630";
        }
      });
    }
    initCheckout();
    setLanguage(getCurrentLang(), onLanguageChanged);
    window.__zirox_loaded = true;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootStoreApp);
  } else {
    bootStoreApp();
  }
})();
