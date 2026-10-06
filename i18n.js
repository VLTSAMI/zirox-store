/**
 * ZIROX STORE — INTERNATIONALIZATION (i18n) MODULE
 * Multi-Language support for Arabic (RTL), French, and English.
 */

import { StorageService } from './storage.js';

export const TRANSLATIONS = {
    en: {
        // Sovereign Aesthetic Keys
        logo_sub: "Luxury Tech Platform • DZ",
        hero_ticker: "ALGIERS / ORAN / CONSTANTINE / 69 WILAYAS",
        hero_live_badge: "🇩🇿 Algeria's #1 Sovereign Luxury Tech Platform • 2026",
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
        top_bar: "Nationwide Fast Shipping • Cash on Delivery • Free Shipping over 20,000 DA",
        nav_home: "Home",
        nav_catalog: "Catalog",
        nav_about: "Ecosystem",
        cart_btn: "Cart",
        hero_eyebrow: "Premium Algerian Retail • Edition 2026",
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
        hero_chip_acoustics: "360° PRECISION ACOUSTICS",
        hero_chip_cod: "COD VERIFIED • 36 000 DZD",
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
        view_all: "View All Products (8) →",
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
        cart_checkout: "Proceed to Checkout →",
        free_shipping_unlocked: "🎉 You unlocked FREE SHIPPING!",
        free_shipping_add: "Add {amount} for Free Shipping 🚚",
        shipping_details: "Shipping & Delivery Details",
        full_name: "Full Name",
        phone_number: "Phone Number",
        wilaya: "Wilaya",
        select_wilaya: "— Select your Wilaya (69 Wilayas) —",
        address: "Full Address (Street & Commune)",
        delivery_mode: "Delivery Mode",
        office_pickup: "📦 Office Pickup (Stop Desk)",
        home_delivery: "🏠 Home Delivery",
        order_summary: "Order Summary",
        items_subtotal: "Items Subtotal:",
        shipping_fee: "Shipping Fee:",
        confirm_whatsapp: "Confirm Order via WhatsApp",
        catalog_counter: "{count} items available",
        inspection_note: "Open and verify items before paying.",
        instant_note: "Order will be confirmed with our team via WhatsApp immediately.",
        add_to_cart: "+ Add",
        view_details: "View Details ↗",
        in_stock: "✓ In Stock & Ready to Ship",
        product_specs: "Product Specifications",
        order_whatsapp_direct: "💬 Order Directly on WhatsApp",
        toast_added: "Added to Cart! 🛒",
        currency: "DA",

        // Footer
        footer_desc: "Your premier destination for quality goods in Algeria.",
        footer_network: "Network",
        footer_care: "Customer Care",
        footer_logistics: "Logistics",
        footer_assurance: "Assurance",
        footer_rights: "© 2026 Zirox Store. All rights reserved.",
        footer_contact_phone: "Phone: 0676 18 48 05",
        footer_contact_email: "Email: contact@ziroxstore.dz",
        footer_contact_city: "Algiers, Algeria",
        footer_coverage: "69 Wilayas Coverage • Yalidine Express",
        footer_inspect_note: "💵 Cash on Delivery upon inspection.",
        footer_replace_note: "🔄 Free 7-day replacement guarantee.",

        // About Page
        about_eyebrow: "Identity & Purpose",
        about_title: "About Zirox Store.",
        about_desc: "A modern e-commerce ecosystem built from the ground up to bring world-class retail standards to Algerian shoppers.",
        about_vision_title: "Our Vision",
        about_vision_desc: "At Zirox Store, we believe that authentic quality and transparent service should be accessible everywhere in Algeria. Founded in Algiers in 2026, our platform curates high-performance electronics, genuine lifestyle goods, and smart home appliances with guaranteed nationwide delivery.",
        about_trust_title: "Why Shoppers Trust Us",
        about_trust_desc: "• <strong>Strict Product Curation:</strong> We only list products that pass our durability and performance benchmarks.<br>• <strong>Package Inspection:</strong> You inspect the product in your hands before paying the courier.<br>• <strong>All 69 Wilayas:</strong> Fast dispatch with trusted logistics networks (Yalidine, Kazi Tour).<br>• <strong>WhatsApp Support:</strong> Real-time human assistance before and after your order.",
        about_contact_title: "Headquarters & Contact",
        about_contact_desc: "📍 Algiers, Algeria<br>📞 Phone: <strong>0676 18 48 05</strong><br>✉️ Email: <strong>contact@ziroxstore.dz</strong><br>💬 WhatsApp: Instant chat available 7 days a week.",

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
        office_pickup_title: "📦 Office Pickup (Stop Desk)",
        office_pickup_desc: "Flexible pickup at your nearest Yalidine agency",
        home_delivery_title: "🏠 Home Delivery",
        home_delivery_desc: "Hand-delivered directly to your doorstep",
        delivery_estimate_fast: "⚡ Express Dispatch: Arrives in <strong>24 to 48 Hours</strong> via Yalidine",
        delivery_estimate_south: "⚡ Standard Dispatch: Arrives in <strong>3 to 5 Business Days</strong>",

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
        phone_valid: "✓ Valid Algerian phone number",
        name_hint: "First and last name",
        name_valid: "✓ Full name entered",
        address_hint: "Commune, neighborhood, street",

        // Validation & Messages
        err_name: "Please enter your full name (at least 3 characters).",
        err_phone: "Enter a valid 10-digit Algerian phone number (05, 06, or 07).",
        err_state: "Please select your Wilaya to calculate shipping.",
        err_address: "Please enter a detailed street/commune address.",
        err_form_general: "Please correct the highlighted fields before proceeding.",
        order_processing: "Processing Order...",
        order_redirecting: "✓ Opening WhatsApp...",
        free_badge: "FREE",
        stock_low_badge: "🔥 Only {stock} left!",
        cart_remove: "Remove",
        sold_out: "✕ Sold Out",
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
        logo_sub: "Plateforme de Luxe • DZ",
        hero_ticker: "ALGER / ORAN / CONSTANTINE / 69 WILAYAS",
        hero_live_badge: "🇩🇿 1ère Plateforme Officielle de Tech Luxe • Algérie 2026",
        hero_title_sovereign: "Acquérez la Haute Technologie<br>avec Confiance Souveraine.",
        hero_desc_sovereign: "Première plateforme en Algérie pour la tech 100% originale. Inspection physique avant paiement et garantie de remplacement dans 69 wilayas.",
        hero_cta_vip: "Conciergerie VIP WhatsApp",
        trust_eyebrow: "ARCHITECTURE DE CONFIANCE // ENGINEERED TRUST",
        trust_heading: "Une vie sublimée par la précision et la rigueur",
        trust_sub: "Conçue pour dépasser les défis habituels : inspection physique complète avant tout paiement.",
        bento_1_title: "Droit d'Inspection Immédiate",
        bento_1_desc: "Ouvrez le colis et vérifiez votre produit avant de payer le livreur. Sérénité absolue et risque zéro.",
        bento_2_title: "Livraison Souveraine 69 Wilayas",
        bento_2_desc: "Expédition express 24-48h partout en Algérie avec numéro de suivi instantané.",
        bento_3_title: "100% Authentique Certifié",
        bento_3_desc: "Produits officiels scellés avec numéro de série vérifiable et garantie 12 mois.",
        bento_4_title: "Service Conciergerie Dédié 24/7",
        bento_4_desc: "Assistance personnalisée et suivi en temps réel via WhatsApp.",
        drops_eyebrow: "ARRIVAGES LIMITÉS // LIMITED DROPS",
        drops_heading: "Éditions Exclusives Disponibles",
        logistics_tag: "PROTOCOLE LOGISTIQUE OFFICIEL",
        logistics_title: "Livraison souveraine dans toutes les communes d'Algérie",
        logistics_desc: "Grâce à un réseau logistique de haute précision, vos articles arrivent intacts à votre porte.",
        stat_wilayas: "69 Wilayas",
        stat_wilayas_label: "Couverture totale nationale",
        stat_58: "69 Wilayas",
        stat_58_label: "Couverture totale nationale",
        stat_time: "24-48 Heures",
        stat_time_label: "Délai moyen de livraison",
        stat_zero: "0 DZD",
        stat_zero_label: "Frais nuls en cas de refus",
        reviews_eyebrow: "AVIS CLIENTS // TESTIMONIALS",
        reviews_heading: "Témoignages de nos Clients Privilégiés",
        custom_order_title: "Vous cherchez un modèle non listé ?",
        custom_order_desc: "Service de commande sur mesure directement depuis l'Europe jusqu'à votre domicile.",
        custom_order_cta: "Contacter le Concierge sur WhatsApp",
        top_bar: "Livraison rapide dans 69 wilayas • Paiement à la livraison • Livraison gratuite dès 20 000 DA",
        nav_home: "Accueil",
        nav_catalog: "Catalogue",
        nav_about: "Écosystème",
        cart_btn: "Panier",
        hero_eyebrow: "Commerce haut de gamme en Algérie • Édition 2026",
        hero_title: "Votre qualité<br>de vie commence ici.",
        hero_desc: "Une expérience d'achat soignée et fiable, conçue pour la découverte sans effort, des produits authentiques et le paiement à la livraison dans les 69 wilayas.",
        hero_cta_explore: "Explorer la boutique",
        hero_cta_more: "En savoir plus",
        marquee_wilayas: "69 Wilayas couvertes",
        marquee_58: "69 Wilayas couvertes",
        marquee_cod: "Paiement à la livraison après inspection",
        marquee_dispatch: "Expédition express 24-48h",
        marquee_authentic: "100% Produits Authentiques Garantis",
        marquee_partner: "Partenaire officiel Yalidine Express",
        marquee_whatsapp: "Confirmation directe sur WhatsApp",
        hero_chip_top: "AUDIO MASTER 2026",
        hero_chip_acoustics: "ACOUSTIQUE DE PRÉCISION 360°",
        hero_chip_cod: "VÉRIFIÉ LIVRAISON • 36 000 DA",
        info_title: "Découvrez Zirox Store.",
        info_cta: "Découvrir",
        info_desc: "Zirox Store est une marketplace algérienne axée sur le client, vous permettant d'élever votre style de vie avec des technologies haut de gamme et une livraison locale fiable.",
        bento_card1_title: "Un quotidien qui s'épanouit avec perfection",
        bento_card1_desc: "Découvrez des sélections testées pour leur performance, leur durabilité et leur confort au quotidien.",
        bento_card2_title: "Toujours fluide,\ntoujours vérifié.",
        bento_card2_desc: "Inspectez votre colis de vos propres mains avant de payer le moindre dinar. Zéro stress, confiance totale.",
        bento_card3_title: "Totalement\nautomatisé.",
        bento_card3_desc: "Commandez en ligne, confirmez par WhatsApp en quelques secondes et suivez votre colis jusqu'à votre porte.",
        curated_title: "Collection Sélectionnée",
        curated_desc: "Explorez les produits les plus populaires actuellement.",
        view_all: "Voir tous les produits (8) →",
        catalog_eyebrow: "Catalogue Soigné",
        catalog_title: "Tous les Produits.",
        catalog_desc: "Sélection rigoureuse d'appareils haut de gamme, d'accessoires de luxe et d'articles pour la maison avec livraison nationale fiable.",
        all_filter: "Tous",
        search_placeholder: "Rechercher par nom, catégorie, marque...",
        sort_featured: "Collection Vedette",
        sort_low: "Prix : Croissant",
        sort_high: "Prix : Décroissant",
        sort_newest: "Nouveautés",
        cart_title: "Votre Panier",
        cart_empty: "Votre panier est vide",
        cart_empty_sub: "Explorez notre catalogue et trouvez de superbes offres !",
        cart_start_shopping: "Commencer les achats",
        cart_total: "Total",
        cart_checkout: "Passer la commande →",
        free_shipping_unlocked: "🎉 Vous bénéficiez de la LIVRAISON GRATUITE !",
        free_shipping_add: "Ajoutez {amount} pour la livraison gratuite 🚚",
        shipping_details: "Détails de Livraison & Expédition",
        full_name: "Nom et Prénom",
        phone_number: "Numéro de Téléphone",
        wilaya: "Wilaya",
        select_wilaya: "— Choisissez votre Wilaya (69 wilayas) —",
        address: "Adresse complète (Rue, Commune)",
        delivery_mode: "Mode de livraison",
        office_pickup: "📦 Point Relais (Bureau Stop Desk)",
        home_delivery: "🏠 Livraison à Domicile",
        order_summary: "Résumé de la commande",
        items_subtotal: "Sous-total articles :",
        shipping_fee: "Frais de livraison :",
        confirm_whatsapp: "Confirmer la commande sur WhatsApp",
        catalog_counter: "{count} pièces disponibles",
        inspection_note: "Ouvrez et vérifiez vos articles avant de payer.",
        instant_note: "La commande sera confirmée immédiatement avec notre équipe sur WhatsApp.",
        add_to_cart: "+ Ajouter",
        view_details: "Voir Détails ↗",
        in_stock: "✓ En stock & Prêt à être expédié",
        product_specs: "Caractéristiques du produit",
        order_whatsapp_direct: "💬 Commander directement sur WhatsApp",
        toast_added: "Ajouté au panier ! 🛒",
        currency: "DA",

        // Footer
        footer_desc: "Votre destination privilégiée pour des produits de qualité en Algérie.",
        footer_network: "Navigation",
        footer_care: "Service Client",
        footer_logistics: "Logistique",
        footer_assurance: "Garanties",
        footer_rights: "© 2026 Zirox Store. Tous droits réservés.",
        footer_contact_phone: "Tél : 0676 18 48 05",
        footer_contact_email: "Email : contact@ziroxstore.dz",
        footer_contact_city: "Alger, Algérie",
        footer_coverage: "Couverture 69 Wilayas • Yalidine Express",
        footer_inspect_note: "💵 Paiement à la livraison après inspection.",
        footer_replace_note: "🔄 Garantie de remplacement sous 7 jours.",

        // About Page
        about_eyebrow: "Identité & Mission",
        about_title: "À propos de Zirox Store.",
        about_desc: "Un écosystème e-commerce moderne conçu pour offrir les meilleurs standards de vente aux acheteurs algériens.",
        about_vision_title: "Notre Vision",
        about_vision_desc: "Chez Zirox Store, nous croyons qu'une qualité authentique et un service transparent doivent être accessibles partout en Algérie. Fondée à Alger en 2026, notre plateforme sélectionne des produits électroniques performants, des articles de mode et des appareils connectés avec livraison garantie dans tout le pays.",
        about_trust_title: "Pourquoi nos clients nous font confiance",
        about_trust_desc: "• <strong>Sélection rigoureuse :</strong> Seuls les produits testés et validés pour leur durabilité sont proposés.<br>• <strong>Inspection du colis :</strong> Vous vérifiez le produit de vos propres mains avant de régler le livreur.<br>• <strong>69 Wilayas couvertes :</strong> Expédition rapide avec nos partenaires logistiques fiables (Yalidine, Kazi Tour).<br>• <strong>Support WhatsApp :</strong> Assistance humaine continue en direct avant et après votre commande.",
        about_contact_title: "Siège & Contact",
        about_contact_desc: "📍 Alger, Algérie<br>📞 Téléphone : <strong>0676 18 48 05</strong><br>✉️ Email : <strong>contact@ziroxstore.dz</strong><br>💬 WhatsApp : Assistance disponible 7j/7.",

        // Product View Bento Trust
        pv_warranty_title: "Garantie Officielle<br>12 Mois.",
        pv_warranty_desc: "Tous nos équipements sont couverts par une garantie constructeur contre les défauts.",
        pv_inspection_title: "Inspection du Colis<br>Garantie.",
        pv_inspection_desc: "Ouvrez et vérifiez votre article avant de remettre l'argent au livreur.",
        pv_chat_title: "Support WhatsApp Direct",
        pv_chat_desc: "Une question sur les caractéristiques ou l'expédition ? Notre équipe vous répond sur WhatsApp.",
        pv_chat_cta: "Discuter en Direct",

        // Category Filters
        filter_all: "Tous",
        filter_electronics: "Électronique",
        filter_fashion: "Mode & Accessoires",
        filter_home: "Maison",
        filter_health: "Santé & Beauté",

        // Delivery Modes & Estimates
        office_pickup_title: "📦 Point Relais (Stop Desk)",
        office_pickup_desc: "Retrait flexible au bureau Yalidine de votre commune",
        home_delivery_title: "🏠 Livraison à Domicile",
        home_delivery_desc: "Remise en main propre directement à votre porte",
        delivery_estimate_fast: "⚡ Expédition Express : Arrivée en <strong>24h à 48h</strong> via Yalidine",
        delivery_estimate_south: "⚡ Expédition : Arrivée en <strong>3 à 5 jours ouvrables</strong>",

        // Trust Pillars
        trust_inspect_title: "Inspection Complète Avant Paiement",
        trust_inspect_desc: "Ouvrez le colis et vérifiez votre produit avant de payer le livreur.",
        trust_cod_title: "Paiement à la Livraison 100%",
        trust_cod_desc: "Zéro paiement à l'avance, zéro risque. Inspectez d'abord, réglez ensuite.",
        trust_shipping_title: "Logistique 69 Wilayas Express",
        trust_shipping_desc: "Distribution nationale officielle avec suivi en temps réel.",
        trust_warranty_title: "Garantie Remplacement 7 Jours",
        trust_warranty_desc: "Échange immédiat en cas de défaut de fabrication.",

        // Validation & Hints
        phone_hint: "10 chiffres débutant par 05, 06 ou 07",
        phone_valid: "✓ Numéro algérien valide",
        name_hint: "Nom et prénom complets",
        name_valid: "✓ Nom complet valide",
        address_hint: "Commune, quartier, rue",

        // Validation & Messages
        err_name: "Veuillez entrer votre nom complet (au moins 3 caractères).",
        err_phone: "Numéro algérien invalide à 10 chiffres (05, 06 ou 07).",
        err_state: "Veuillez sélectionner votre Wilaya pour le calcul de livraison.",
        err_address: "Veuillez préciser votre adresse complète.",
        err_form_general: "Veuillez corriger les champs indiqués.",
        order_processing: "Traitement de la commande...",
        order_redirecting: "✓ Ouverture de WhatsApp...",
        free_badge: "GRATUIT",
        stock_low_badge: "🔥 Plus que {stock} en stock !",
        cart_remove: "Supprimer",
        sold_out: "✕ Épuisé",
        product_not_found: "Produit introuvable",
        browse_all: "Voir tous les produits",
        catalog_empty: "Le catalogue est actuellement vide.",
        toast_stock_limit: "Limite de stock",
        toast_stock_limit_msg: "Quantité maximale disponible : {max}",
        toast_cart_empty: "Panier vide",
        toast_validation_error: "Erreur de validation",
        checkout_qty: "Qté"
    },
    ar: {
        // Sovereign Aesthetic Keys
        logo_sub: "متجر النخبة الفاخر • DZ",
        hero_ticker: "الجزائر / وهران / قسنطينة / 69 ولاية",
        hero_live_badge: "🇩🇿 المنصة الرسمية الأولى للتقنية الفاخرة • الجزائر 2026",
        hero_title_sovereign: "اقتنِ قمة التكنولوجيا العالمية<br>بأمان سيادي مطلق.",
        hero_desc_sovereign: "منصة التسوّق الأولى في الجزائر للأجهزة الفائقة الأصلية 100%. معاينة واختبار فوري قبل الدفع، وضمان استبدال مباشر لجميع الـ 69 ولاية.",
        hero_cta_vip: "طلب مخصص عبر واتساب",
        trust_eyebrow: "هندسة الثقة والموثوقية // ENGINEERED TRUST",
        trust_heading: "حياة ترتقي بالإتقان والموثوقية",
        trust_sub: "صممنا تجربة الشراء من الصفر لتتجاوز التحديات التقليدية؛ فحص كامل ومباشر قبل تسليم أي مبلغ.",
        bento_1_title: "حق المعاينة والتجربة المباشرة",
        bento_1_desc: "افتح الطرد وافحص منتجك بعناية قبل دفع أي دينار للمندوب. ثقة مطلقة وتجربة تسوق بلا مخاطرة.",
        bento_2_title: "توصيل سيادي لـ 69 ولاية",
        bento_2_desc: "شبكة شحن متكاملة تصلك أينما كنت خلال 24 إلى 48 ساعة مع رقم تتبع فوري حتى باب منزلك.",
        bento_3_title: "أصالة مطلقة 100% مسجلة بالرقم التسلسلي",
        bento_3_desc: "جميع الأجهزة أصلية معتمدة ومفحوصة مع ضمان رسمي معتمد لمدة 12 شهراً.",
        bento_4_title: "خدمة كونسيرج ومساعدة شخصية 24/7",
        bento_4_desc: "فريق متخصص لمرافقتك والإجابة عن كافة استفساراتك وتنسيق شحنتك لحظة بلحظة عبر واتساب.",
        drops_eyebrow: "إصدارات متوفرة حالياً // LIMITED DROPS",
        drops_heading: "إصدارات فاخرة متوفرة حالياً",
        logistics_tag: "بروتوكول الشحن السيادي",
        logistics_title: "توصيل سيادي لجميع الدوائر والبلديات عبر الجزائر",
        logistics_desc: "عبر أسطول لوجستي عالي الدقة، نضمن وصول أجهزتك الفاخرة بحالتها المصنعية الكاملة حتى عتبة منزلك.",
        stat_wilayas: "69 ولاية",
        stat_wilayas_label: "تغطية لوجستية شاملة",
        stat_58: "69 ولاية",
        stat_58_label: "تغطية لوجستية شاملة",
        stat_time: "24-48 ساعة",
        stat_time_label: "متوسط زمن التسليم",
        stat_zero: "0 دج",
        stat_zero_label: "رسوم الإرجاع عند الرفض",
        reviews_eyebrow: "تجارب العملاء // TESTIMONIALS",
        reviews_heading: "شهادات نخبة عملاء زيروكس",
        custom_order_title: "هل تبحث عن جهاز غير متوفر في الكتالوج؟",
        custom_order_desc: "نوفر خدمة الطلب المخصص لكافة المنتجات التقنية الفاخرة من المتاجر الأوروبية مباشرة لباب دارك.",
        custom_order_cta: "تواصل مع الكونسيرج عبر واتساب",
        top_bar: "توصيل سريع لكافة الـ 69 ولاية • الدفع عند الاستلام بعد المعاينة • شحن مجاني للطلبات فوق 20,000 دج",
        nav_home: "الرئيسية",
        nav_catalog: "المتجر",
        nav_about: "عن المتجر",
        cart_btn: "السلة",
        hero_eyebrow: "تجارة التجزئة الفاخرة في الجزائر • إصدار 2026",
        hero_title: "حياتك اليومية<br>بجودة استثنائية تبدأ هنا.",
        hero_desc: "تجربة تسوق راقية وموثوقة صُممت لتسهيل اكتشاف أحدث المنتجات الأصلية مع الدفع عند الاستلام والتوصيل لكافة الـ 69 ولاية في الجزائر.",
        hero_cta_explore: "استكشف المتجر",
        hero_cta_more: "تعرف علينا",
        marquee_wilayas: "توصيل لكافة الـ 69 ولاية",
        marquee_58: "توصيل لكافة الـ 69 ولاية",
        marquee_cod: "معاينة الطرد قبل الدفع عند الاستلام",
        marquee_dispatch: "تجهيز وشحن سريع خلال 24-48 ساعة",
        marquee_authentic: "منتجات أصلية ومضمونة 100%",
        marquee_partner: "شريك رسمي مع ياليدين إكسبريس",
        marquee_whatsapp: "تأكيد مباشر وفوري عبر الواتساب",
        hero_chip_top: "الصوت الاحترافي 2026",
        hero_chip_acoustics: "صوتيات فائقة الدقة 360°",
        hero_chip_cod: "دفع بعد المعاينة • 36 000 دج",
        info_title: "تعرف على متجر Zirox.",
        info_cta: "اكتشف المزيد",
        info_desc: "متجر Zirox هو وجهتكم الجزائرية الموثوقة التي ترتقي بحياتكم اليومية بأحدث المنتجات التقنية، الأزياء، ومستلزمات المنزل مع توصيل محلي مضمون.",
        bento_card1_title: "حياة ترتقي بأعلى درجات الإتقان",
        bento_card1_desc: "اختيارات مدروسة ومجربة لضمان الأداء، المتانة، والراحة اليومية الحقيقية.",
        bento_card2_title: "دائماً موثوق،\nدائماً مفحوص.",
        bento_card2_desc: "افحص طردك بيدك وتأكد منه بنفسك قبل دفع أي دينار. تسوق بثقة تامة وبلا أي مخاطرة.",
        bento_card3_title: "مؤتمت\nبالكامل.",
        bento_card3_desc: "اطلب عبر الموقع، أكد طلبك عبر الواتساب في ثوانٍ، وتابع شحنتك مباشرة حتى باب منزلك.",
        curated_title: "مختارات حصرية",
        curated_desc: "استكشف المنتجات الأكثر طلباً ورواجاً في متجرنا الآن.",
        view_all: "عرض جميع المنتجات (8) ←",
        catalog_eyebrow: "دليل المنتجات المختارة",
        catalog_title: "جميع المنتجات.",
        catalog_desc: "تشكيلة منتقاة بعناية من أفضل الأجهزة الذكية، الإكسسوارات الفاخرة، ومستلزمات المنزل مع توصيل موثوق لكافة أنحاء الوطن.",
        all_filter: "الكل",
        search_placeholder: "ابحث باسم المنتج، الفئة، أو الماركة...",
        sort_featured: "المختارات المميزة",
        sort_low: "السعر: من الأقل للأعلى",
        sort_high: "السعر: من الأعلى للأقل",
        sort_newest: "الأحدث وصولاً",
        cart_title: "سلة المشتريات",
        cart_empty: "سلتك فارغة حالياً",
        cart_empty_sub: "تصفح متجرنا واستمتع بأقوى العروض والمنتجات!",
        cart_start_shopping: "ابدأ التسوق الآن",
        cart_total: "المجموع الكلي",
        cart_checkout: "متابعة إتمام الطلب ←",
        free_shipping_unlocked: "🎉 تهانينا! حصلت على توصيل مجاني!",
        free_shipping_add: "أضف {amount} للحصول على شحن مجاني 🚚",
        shipping_details: "معلومات الشحن والتوصيل",
        full_name: "الاسم واللقب",
        phone_number: "رقم الهاتف",
        wilaya: "الولاية",
        select_wilaya: "— اختر ولايتك من القائمة (69 ولاية) —",
        address: "العنوان الكامل (البلدية والشارع)",
        delivery_mode: "طريقة الاستلام",
        office_pickup: "📦 استلام من مكتب التوصيل (Stop Desk)",
        home_delivery: "🏠 توصيل لباب المنزل",
        order_summary: "ملخص الطلبية",
        items_subtotal: "مجموع المنتجات:",
        shipping_fee: "كلفة التوصيل:",
        confirm_whatsapp: "تأكيد الطلب عبر الواتساب",
        catalog_counter: "{count} قطع متاحة",
        inspection_note: "افحص طردك وتأكد من محتواه قبل الدفع.",
        instant_note: "سيتم فتح محادثة WhatsApp مباشرة مع فريقنا لتأكيد شحنتك.",
        add_to_cart: "+ أضف",
        view_details: "عرض التفاصيل ↖",
        in_stock: "✓ متوفر وجاهز للشحن الفوري",
        product_specs: "المواصفات الفنية للمنتج",
        order_whatsapp_direct: "💬 اطلب مباشرة عبر الواتساب",
        toast_added: "تمت الإضافة للسلة! 🛒",
        currency: "دج",

        // Footer
        footer_desc: "وجهتك الأولى لاقتناء أرقى المنتجات الموثوقة في الجزائر.",
        footer_network: "روابط المتجر",
        footer_care: "خدمة العملاء",
        footer_logistics: "الشحن والتوصيل",
        footer_assurance: "الضمان والثقة",
        footer_rights: "© 2026 متجر Zirox. جميع الحقوق محفوظة.",
        footer_contact_phone: "الهاتف: 0676 18 48 05",
        footer_contact_email: "البريد: contact@ziroxstore.dz",
        footer_contact_city: "الجزائر العاصمة، الجزائر",
        footer_coverage: "تغطية كامل الـ 69 ولاية • ياليدين إكسبريس",
        footer_inspect_note: "💵 الدفع عند الاستلام بعد معاينة الطرد.",
        footer_replace_note: "🔄 ضمان استبدال مجاني خلال 7 أيام.",

        // About Page
        about_eyebrow: "الهوية والرؤية",
        about_title: "عن متجر Zirox.",
        about_desc: "منظومة تجارة إلكترونية عصرية متكاملة صُممت لتقديم أفضل معايير التسوق للمستهلك الجزائري.",
        about_vision_title: "رؤيتنا",
        about_vision_desc: "في متجر Zirox، نؤمن بأن الجودة الأصلية والخدمة الشفافة يجب أن تكون في متناول الجميع في الجزائر. تأسست منصتنا بالجزائر العاصمة عام 2026، لننتقي بعناية أفضل الأجهزة الإلكترونية ومستلزمات الحياة العصرية مع توصيل مضمون لكافة ربوع الوطن.",
        about_trust_title: "لماذا يثق بنا المتسوقون",
        about_trust_desc: "• <strong>انتقاء صارم للمنتجات:</strong> نعرض فقط المنتجات التي تجتاز اختبارات الجودة والمتانة العالية.<br>• <strong>معاينة الطرد:</strong> تفحص منتجك بيدك وتتأكد منه تماماً قبل تسليم المبلغ لموزع التوصيل.<br>• <strong>تغطية الـ 69 ولاية:</strong> إرسال سريع عبر شبكات لوجستية موثوقة (ياليدين، كازي تور).<br>• <strong>دعم فوري عبر واتساب:</strong> مساعدة بشرية حقيقية وتواصل دائم قبل وبعد استلام طلبيتك.",
        about_contact_title: "المقر والتواصل",
        about_contact_desc: "📍 الجزائر العاصمة، الجزائر<br>📞 الهاتف: <strong>0676 18 48 05</strong><br>✉️ البريد الإلكتروني: <strong>contact@ziroxstore.dz</strong><br>💬 واتساب: محادثة فورية متاحة 7 أيام في الأسبوع.",

        // Product View Bento Trust
        pv_warranty_title: "ضمان رسمي<br>لمدة 12 شهراً.",
        pv_warranty_desc: "كافة الأجهزة والمقتنيات التقنية مشمولة بضمان معتمد ضد أي عيوب مصنعية.",
        pv_inspection_title: "معاينة الطرد<br>مضمونة قبل الدفع.",
        pv_inspection_desc: "افحص وتأكد من سلامة طلبك بيدك قبل تسليم المبلغ لموزع التوصيل.",
        pv_chat_title: "دعم مباشر عبر واتساب",
        pv_chat_desc: "هل لديك أي استفسار حول المواصفات أو الشحن؟ فريقنا متواجد لخدمتك عبر واتساب.",
        pv_chat_cta: "تواصل معنا",

        // Category Filters
        filter_all: "الكل",
        filter_electronics: "إلكترونيات",
        filter_fashion: "أزياء وإكسسوارات",
        filter_home: "المنزل والمعيشة",
        filter_health: "الصحة والجمال",

        // Delivery Modes & Estimates
        office_pickup_title: "📦 استلام من مكتب ياليدين (Stop Desk)",
        office_pickup_desc: "استلام مرن من أقرب مكتب في بلديتك في الوقت الذي يناسبك",
        home_delivery_title: "🏠 توصيل لباب المنزل",
        home_delivery_desc: "تسليم شخصي مباشر وسريع حتى عتبة بابك",
        delivery_estimate_fast: "⚡ شحن سريع: يصلك خلال <strong>24 إلى 48 ساعة</strong> مع ياليدين إكسبريس",
        delivery_estimate_south: "⚡ شحن الجنوب والهضاب: يصلك خلال <strong>3 إلى 5 أيام عمل</strong>",

        // Trust Pillars
        trust_inspect_title: "حق المعاينة والتجربة قبل الدفع",
        trust_inspect_desc: "افتح الطرد وافحص جهازك وتأكد من محتواه أمام الموزع قبل تسليم أي دينار.",
        trust_cod_title: "دفع نقدي آمن عند الاستلام 100%",
        trust_cod_desc: "تسوق براحة بال، لا دفع إلكتروني مسبق ولا أي مخاطرة. عاين أولاً وادفع لاحقاً.",
        trust_shipping_title: "شحن مؤمن لـ 69 ولاية",
        trust_shipping_desc: "توزيع رسمي معتمد عبر شبكة ياليدين إكسبريس مع رقم تتبع فوري.",
        trust_warranty_title: "ضمان استبدال رسمي 7 أيام",
        trust_warranty_desc: "استبدال فوري ومجاني ومباشر في حال وجود أي عيب مصنعي.",

        // Validation & Hints
        phone_hint: "10 أرقام تبدأ بـ 05 أو 06 أو 07",
        phone_valid: "✓ رقم هاتف جزائري صالح",
        name_hint: "الاسم واللقب كاملاً",
        name_valid: "✓ الاسم واللقب مكتمل",
        address_hint: "البلدية والحي أو الشارع",

        // Validation & Messages
        err_name: "يرجى إدخال الاسم واللقب بوضوح (3 أحرف على الأقل).",
        err_phone: "يرجى إدخال رقم هاتف جزائري صالح مكون من 10 أرقام (05، 06، أو 07).",
        err_state: "يرجى اختيار الولاية من القائمة لتحديد كلفة الشحن.",
        err_address: "يرجى إدخال عنوان دقيق (البلدية والشارع).",
        err_form_general: "يرجى مراجعة وتصحيح الحقول المحددة للمتابعة.",
        order_processing: "جارٍ تجهيز الطلبية...",
        order_redirecting: "✓ جارٍ فتح الواتساب للتأكيد...",
        free_badge: "مجاني",
        stock_low_badge: "🔥 بقي {stock} قطع فقط!",
        cart_remove: "حذف",
        sold_out: "✕ نفدت الكمية",
        product_not_found: "المنتج غير متوفر",
        browse_all: "تصفح جميع المنتجات",
        catalog_empty: "الكتالوج فارغ حالياً.",
        toast_stock_limit: "حد المخزون",
        toast_stock_limit_msg: "الكمية القصوى المتاحة: {max}",
        toast_cart_empty: "السلة فارغة",
        toast_validation_error: "خطأ في البيانات",
        checkout_qty: "الكمية"
    }
};

let currentLang = StorageService.getLanguage('ar');

/**
 * Get current active language code ('ar', 'fr', 'en')
 * @returns {string}
 */
export function getCurrentLang() {
    return currentLang;
}

/**
 * Translate a key according to current or specified language
 * @param {string} key
 * @param {string|null} lang
 * @returns {string}
 */
export function t(key, lang = null) {
    const active = lang || currentLang || 'ar';
    const dict = TRANSLATIONS[active] || TRANSLATIONS.ar;
    return dict[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Localize a multilingual field or string
 * @param {string|object} field
 * @param {string|null} lang
 * @returns {string}
 */
export function localize(field, lang = null) {
    if (field === null || field === undefined) return '';
    if (typeof field === 'string') return field;
    const active = lang || currentLang || 'ar';
    return field[active] || field.ar || field.en || field.fr || '';
}

/**
 * Format numeric price with Algerian space separators and localized currency
 * @param {number|string} price
 * @param {string|null} lang
 * @returns {string}
 */
export function formatPrice(price, lang = null) {
    const num = Math.round(parseFloat(price) || 0);
    const active = lang || currentLang || 'ar';
    const curr = t('currency', active) || (active === 'ar' ? 'دج' : 'DA');
    // Use non-breaking space (\u00A0) as thousands separator to treat digits as a single numeric token
    const formattedNum = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    if (active === 'ar') {
        // Enclose in LRM marks to prevent reverse ordering (e.g. '000 84' -> '84 000') in RTL
        return `\u200E${formattedNum}\u200E\u00A0${curr}`;
    }
    return `${formattedNum} ${curr}`;
}

/**
 * Apply language to DOM elements and trigger dynamic refresh
 * @param {string} lang
 * @param {Function|null} onLanguageChange
 */
export function setLanguage(lang, onLanguageChange = null) {
    if (!TRANSLATIONS[lang]) lang = 'ar';
    currentLang = lang;
    StorageService.setLanguage(lang);

    const isRtl = (lang === 'ar');
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // Update active class on language toggle buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ar;

    // Translate static elements with [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = dict[key];
            } else {
                // If translation contains HTML like <br> or <strong>, set innerHTML safely from trusted dictionary
                el.innerHTML = dict[key];
            }
        }
    });

    // Translate input placeholders with [data-i18n-ph]
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    if (typeof onLanguageChange === 'function') {
        onLanguageChange(lang);
    }
}

// Global exports for backward-compatibility with inline HTML or scripts
if (typeof window !== 'undefined') {
    window.t = t;
    window.localize = localize;
    window.formatPrice = formatPrice;
    window.setLanguage = setLanguage;
}
