/**
 * ZIROX STORE — PRODUCTS REPOSITORY & SERVICE
 * Seed data, catalog queries, filtering, and sorting logic with full multilingual support.
 */

import { StorageService } from './storage.js';
import { isValidProduct } from './security.js';

export const INITIAL_SEED_PRODUCTS = Object.freeze([
    {
        id: 'prod_1',
        categoryKey: 'electronics',
        name: {
            ar: 'سماعات سوني WH-1000XM5 اللاسلكية الاحترافية',
            fr: 'Casque sans fil Sony WH-1000XM5 Premium',
            en: 'Sony WH-1000XM5 Wireless Headphones'
        },
        category: {
            ar: 'صوتيات وإلكترونيات',
            fr: 'Électronique & Audio',
            en: 'Electronics'
        },
        price: 36000,
        oldPrice: 42000,
        badge: {
            ar: 'الأكثر مبيعاً',
            fr: 'Best-seller',
            en: 'BESTSELLER'
        },
        rating: 4.9,
        reviewsCount: 68,
        stock: 12,
        image: 'assets/sony-wh1000xm5.png',
        gallery: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'عزل ضوضاء رائد مع 8 ميكروفونات ومحسن تلقائي ومعالجين مخصصين.',
            fr: 'Réduction de bruit exceptionnelle avec 8 microphones et optimisation automatique.',
            en: 'Industry-leading noise canceling with 8 microphones & Auto NC Optimizer.'
        },
        description: {
            ar: 'عش تجربة غير مسبوقة من النقاء والهدوء المطلق. يتحكم معالجان متخصصان في 8 ميكروفونات لعزل ضوضائي لا مثيل له. بطارية تدوم 30 ساعة مع شحن فائق السرعة ومعاينة مضمونة قبل الدفع.',
            fr: 'Découvrez un nouveau niveau de silence et de pureté sonore. Deux processeurs contrôlent 8 microphones pour une réduction de bruit sans précédent. Autonomie de 30 heures avec charge ultra-rapide.',
            en: 'Experience a new level of silence and sound quality. Two processors control 8 microphones for unprecedented noise cancellation. 30-hour battery life with quick charging.'
        },
        specs: {
            ar: {
                'عمر البطارية': '30 ساعة (مع العزل)',
                'الاتصال': 'بلوتوث 5.2 / LDAC',
                'الميكروفونات': '8 ميكروفونات مدمجة',
                'الضمان': '12 شهراً رسمي معتمد'
            },
            fr: {
                'Autonomie': '30 Heures (ANC activé)',
                'Connectivité': 'Bluetooth 5.2 / LDAC',
                'Microphones': '8 micros intégrés',
                'Garantie': '12 Mois Officielle'
            },
            en: {
                'Battery Life': '30 Hours (ANC On)',
                'Connectivity': 'Bluetooth 5.2 / LDAC',
                'Microphones': '8 Built-in beamforming mics',
                'Warranty': '12 Months Official'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'prod_2',
        categoryKey: 'electronics',
        name: {
            ar: 'ساعة آبل الترا 2 هيكل تيتانيوم فاخر',
            fr: 'Apple Watch Ultra 2 Boîtier Titane',
            en: 'Apple Watch Ultra 2 Titanium Case'
        },
        category: {
            ar: 'إلكترونيات وساعات ذكية',
            fr: 'Électronique & Montres',
            en: 'Electronics'
        },
        price: 84000,
        oldPrice: 94000,
        badge: {
            ar: 'إصدار جديد',
            fr: 'Nouveauté',
            en: 'NEW'
        },
        rating: 5.0,
        reviewsCount: 42,
        stock: 4,
        image: 'assets/apple-watch-ultra.png',
        gallery: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'هيكل تيتانيوم 49 مم متين، نظام GPS دقيق مزدوج التردد وبطارية تدوم حتى 72 ساعة.',
            fr: 'Boîtier en titane de 49 mm, GPS double fréquence haute précision et autonomie jusqu\'à 72h.',
            en: 'Rugged 49mm titanium case, precision dual-frequency GPS & 36h battery.'
        },
        description: {
            ar: 'أقوى ساعات آبل وأكثرها قدرة للمغامرات والرياضات المتقدمة. مزودة بشريحة S9 SiP وشاشة ريتينا الأكثر سطوعاً ومقاومة للماء حتى عمق 100 متر.',
            fr: 'La montre Apple la plus robuste repousse les limites. Dotée de la puce S9 SiP, du nouvel écran Retina ultra-lumineux et d\'une étanchéité jusqu\'à 100 m.',
            en: 'The most rugged and capable Apple Watch pushes the limits again. Featuring the all-new S9 SiP, the brightest Apple display ever, and precision dual-frequency GPS.'
        },
        specs: {
            ar: {
                'مادة الهيكل': 'تيتانيوم فئة الطيران والفضاء',
                'مقاومة الماء': '100 متر (غوص وسباحة)',
                'البطارية': '36 ساعة قياسي / 72 ساعة توفير',
                'الشاشة': 'شاشة ريتينا 3000 شمعة'
            },
            fr: {
                'Boîtier': 'Titane de qualité aérospatiale',
                'Étanchéité': '100 m (Plongée & Natation)',
                'Autonomie': 'Jusqu\'à 36h standard / 72h éco',
                'Écran': 'Retina Always-On 3000 nits'
            },
            en: {
                'Case Material': 'Aerospace-Grade Titanium',
                'Water Resistance': '100m (Swim & Dive ready)',
                'Battery': 'Up to 36 Hours standard / 72h low power',
                'Display': '3000 nits Always-On Retina'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
        id: 'prod_3',
        categoryKey: 'fashion',
        name: {
            ar: 'حذاء نايكي اير فورس 1 ‘07 أبيض ناصع',
            fr: 'Nike Air Force 1 ‘07 Triple White',
            en: 'Nike Air Force 1 ‘07 Triple White'
        },
        category: {
            ar: 'أزياء وأحذية',
            fr: 'Mode & Chaussures',
            en: 'Fashion'
        },
        price: 16500,
        oldPrice: 19800,
        badge: {
            ar: 'تخفيض 20%',
            fr: '-20%',
            en: '-20%'
        },
        rating: 4.8,
        reviewsCount: 115,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'تصميم أيقوني كلاسيكي من الجلد الطبيعي المخيط ووسادة نايكي الهوائية المريحة.',
            fr: 'Silhouette emblématique en cuir cousu et amorti légendaire Nike Air.',
            en: 'Timeless silhouette crafted from crisp stitched leather and Nike Air cushioning.'
        },
        description: {
            ar: 'يواصل حذاء نايكي إير فورس 1 تألقه بأسلوبه الخالد، خامات جلدية أصلية ولمسات كلاسيكية نقية مع متانة استثنائية لجميع الإطلالات اليومية.',
            fr: 'Le classique indémodable du streetwear : cuir pleine fleur impeccable, finitions soignées et amorti Nike Air pour un confort absolu tout au long de la journée.',
            en: 'The radiance lives on in the Nike Air Force 1 ’07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold details and the perfect amount of flash.'
        },
        specs: {
            ar: {
                'الخامة العلوية': 'جلد طبيعي نقي 100% مخيط',
                'النعل': 'مطاط متين مانع للانزلاق',
                'وسادة القدم': 'وحدة Nike Air المدمجة',
                'المقاس': 'مطابق للقياس القياسي'
            },
            fr: {
                'Tige': '100% Cuir véritable cousu',
                'Semelle': 'Caoutchouc anti-trace résistant',
                'Amorti': 'Unité Nike Air encapsulée',
                'Pointure': 'Fidèle à la taille'
            },
            en: {
                'Upper Material': '100% Genuine Stitched Leather',
                'Sole': 'Non-marking rubber outsole',
                'Cushioning': 'Nike Air Encapsulated Unit',
                'Fit': 'True to size'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
        id: 'prod_4',
        categoryKey: 'fashion',
        name: {
            ar: 'عطر ديور سوفاج إكسير الفاخر (60 مل)',
            fr: 'Parfum de Luxe Dior Sauvage Elixir (60ml)',
            en: 'Dior Sauvage Elixir Luxury Perfume (60ml)'
        },
        category: {
            ar: 'أزياء وعطور فاخرة',
            fr: 'Mode & Parfumerie',
            en: 'Fashion'
        },
        price: 21500,
        oldPrice: 25000,
        badge: {
            ar: 'الأكثر طلباً',
            fr: 'Tendance',
            en: 'HOT'
        },
        rating: 4.9,
        reviewsCount: 89,
        stock: 3,
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'عطر ذو تركيز استثنائي غني بانتعاش سوفاج الأيقوني وتوابل دافئة آسرة.',
            fr: 'Une fragrance d\'une concentration extraordinaire imprégnée de la fraîcheur iconique de Sauvage.',
            en: 'An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage.'
        },
        description: {
            ar: 'سوفاج إكسير هو عطر بتركيز غير مسبوق يجمع بين انتعاش سوفاج الشهير وقلب آسر من التوابل الفاخرة، وخلاصة اللافندر الحصرية، مع خشب الصندل الدافئ. ثبات يدوم طويلاً.',
            fr: 'Sauvage Elixir est un parfum d\'une concentration unique où la fraîcheur emblématique rencontre un cœur d\'épices enivrantes, une essence de lavande sur mesure et des bois riches.',
            en: 'Sauvage Elixir is an extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage with an intoxicating heart of spices and rich woods.'
        },
        specs: {
            ar: {
                'التركيز': 'إكسير / عطر خالص (Pure Parfum)',
                'الحجم': '60 مل أصلي معتمد',
                'درجة الثبات': 'أكثر من 16 ساعة متواصلة',
                'المنشأ': 'صنع في فرنسا (Made in France)'
            },
            fr: {
                'Concentration': 'Élixir / Pur Parfum',
                'Volume': '60 ml officiel scellé',
                'Tenue': 'Supérieure à 16 heures',
                'Origine': 'Fabriqué en France'
            },
            en: {
                'Concentration': 'Elixir / Pure Parfum',
                'Volume': '60 ml / 2.0 fl.oz',
                'Longevity': 'Over 16+ Hours',
                'Origin': 'Made in France'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
        id: 'prod_5',
        categoryKey: 'electronics',
        name: {
            ar: 'لوحة مفاتيح ميكانيكية كيتشرون Q1 Pro اللاسلكية',
            fr: 'Clavier Mécanique Sans Fil Keychron Q1 Pro',
            en: 'Keychron Q1 Pro Wireless Mechanical Keyboard'
        },
        category: {
            ar: 'إلكترونيات واكسسوارات حاسوب',
            fr: 'Électronique & Informatique',
            en: 'Electronics'
        },
        price: 24500,
        oldPrice: 28000,
        badge: {
            ar: 'رائج',
            fr: 'Populaire',
            en: 'POPULAR'
        },
        rating: 4.9,
        reviewsCount: 34,
        stock: 7,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'هيكل ألومنيوم CNC كامل، مفاتيح قابلة للتبديل السريع وقابلة للبرمجة بـ QMK/VIA.',
            fr: 'Châssis en aluminium CNC, commutateurs remplaçables à chaud et entièrement programmable via QMK/VIA.',
            en: 'Full CNC aluminum body, hot-swappable switches and QMK/VIA programmable.'
        },
        description: {
            ar: 'لوحة المفاتيح الميكانيكية المخصصة المصنوعة بالكامل من الألمنيوم المصقول والمزودة ببلوتوث 5.1 وتصميم الحشية المزدوجة العازلة للصوت لتجربة كتابة ناعمة وفائقة الرقي.',
            fr: 'Le Keychron Q1 Pro est un clavier mécanique sans fil d\'exception entièrement en aluminium CNC avec Bluetooth 5.1, conception à double joint et rétroéclairage RVB orienté sud.',
            en: 'Meet the Keychron Q1 Pro, an all-metal wireless custom mechanical keyboard upgraded with Bluetooth 5.1, double-gasket design, and South-facing RGB lighting.'
        },
        specs: {
            ar: {
                'الهيكل': 'ألومنيوم 6063 CNC بالكامل',
                'الاتصال': 'بلوتوث 5.1 وسلكي Type-C',
                'نوع المفاتيح': 'Gateron Jupiter Brown (تبديل سريع)',
                'التوافق': 'macOS / Windows / Linux'
            },
            fr: {
                'Châssis': '100% Aluminium 6063 CNC',
                'Connectivité': 'Bluetooth 5.1 & Câble Type-C',
                'Switches': 'Gateron Jupiter Brown (Hot-swap)',
                'Compatibilité': 'macOS / Windows / Linux'
            },
            en: {
                'Body': 'Full CNC 6063 Aluminum',
                'Connectivity': 'Bluetooth 5.1 & Type-C Wired',
                'Switch Type': 'Gateron Jupiter Brown (Hot-swappable)',
                'Compatibility': 'macOS / Windows / Linux'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
        id: 'prod_6',
        categoryKey: 'fashion',
        name: {
            ar: 'نظارات ريبان أفياتور الكلاسيكية المستقطبة',
            fr: 'Lunettes de Soleil Ray-Ban Aviator Classic Polarisées',
            en: 'Ray-Ban Aviator Classic Polarized'
        },
        category: {
            ar: 'أزياء وإكسسوارات',
            fr: 'Mode & Accessoires',
            en: 'Fashion'
        },
        price: 15500,
        oldPrice: 18000,
        badge: {
            ar: 'كلاسيكي',
            fr: 'Classique',
            en: 'CLASSIC'
        },
        rating: 4.8,
        reviewsCount: 57,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'إطار دمعي معدني مذهب كلاسيكي مع عدسات كريستال خضراء G-15 مانعة للتوهج.',
            fr: 'Monture métallique dorée emblématique avec verres minéraux verts G-15 polarisés.',
            en: 'Timeless teardrop frame with crystal green G-15 polarized anti-glare lenses.'
        },
        description: {
            ar: 'تعد نظارات ريبان أفياتور الكلاسيكية النموذج الأكثر شهرة في العالم، صُممت أصلاً للطيارين في عام 1937 وتجمع اليوم بين الأناقة الرفيعة والأداء البصري المريح والحماية الكاملة من الأشعة فوق البنفسجية.',
            fr: 'Modèle le plus emblématique au monde, la Ray-Ban Aviator combine allure intemporelle, verres polarisés haute performance et protection 100% UV400 pour un confort visuel exceptionnel.',
            en: 'Currently one of the most iconic sunglass models in the world, Ray-Ban Aviator Classic combines great styling with exceptional quality and comfort.'
        },
        specs: {
            ar: {
                'الإطار': 'معدن ذهبي مصقول متين',
                'العدسات': 'كريستال أخضر G-15 مستقطب',
                'الحماية': 'حماية كاملة 100% UV400',
                'المحتويات': 'حافظة جلدية أصلية وقطعة تنظيف'
            },
            fr: {
                'Monture': 'Métal doré poli haute qualité',
                'Verres': 'Verts classiques G-15 polarisés',
                'Protection': '100% Protection UV400',
                'Packaging': 'Étui cuir d\'origine et chiffonnette'
            },
            en: {
                'Frame': 'Polished Gold Metal',
                'Lens': 'Green Classic G-15 Polarized',
                'UV Protection': '100% UV400 Protection',
                'Package': 'Original Leather Case & Cloth'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 12).toISOString()
    },
    {
        id: 'prod_7',
        categoryKey: 'home',
        name: {
            ar: 'ماكينة قهوة نسبريسو فيرتو نيكست الأوتوماتيكية',
            fr: 'Machine à Café Nespresso Vertuo Next',
            en: 'Nespresso Vertuo Next Coffee Machine'
        },
        category: {
            ar: 'المنزل الراقي والمطبخ',
            fr: 'Maison & Cuisine',
            en: 'Home'
        },
        price: 27500,
        oldPrice: 32000,
        badge: {
            ar: 'عرض خاص',
            fr: 'En Promo',
            en: 'SALE'
        },
        rating: 4.7,
        reviewsCount: 46,
        stock: 9,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'تقنية الاستخلاص الدوراني Centrifusion مع تحضير بزر واحد لـ 5 أحجام أكواب مختلفة.',
            fr: 'Technologie d\'extraction Centrifusion avec préparation en une touche pour 5 tailles de tasses.',
            en: 'Centrifusion extraction technology with one-touch brewing for 5 cup sizes.'
        },
        description: {
            ar: 'ماكينة فيرتو نيكست ترتقي بتجربة قهوة نسبريسو إلى أفق جديد. تقرأ الماكينة الرمز الشريطي للكبسولة تلقائياً لضبط المعايير المثالية وتقديم قوام كريمي غني بنقرة زر واحدة.',
            fr: 'Vertuo Next réinvente la dégustation du café Nespresso. Elle lit le code-barres de chaque capsule pour adapter automatiquement la température et l\'infusion afin de révéler tous les arômes.',
            en: 'Vertuo Next takes the full range of Nespresso coffee styles even further. The machine reads the barcode integrated in each capsule to offer you its hidden treasures at the touch of a button.'
        },
        specs: {
            ar: {
                'خزان المياه': '1.1 لتر قابل للفك',
                'زمن التسخين': '30 ثانية فقط',
                'أحجام القهوة': 'إسبريسو، دبل، غران لونغو، موغ، ألتو',
                'إيقاف التشغيل': 'أوتوماتيكي بعد دقيقتين'
            },
            fr: {
                'Réservoir d\'eau': '1,1 Litre amovible',
                'Temps de chauffe': '30 Secondes',
                'Tailles de tasse': 'Espresso, Double, Gran Lungo, Mug, Alto',
                'Arrêt automatique': 'Après 2 minutes'
            },
            en: {
                'Water Tank': '1.1 Liters',
                'Heat-up Time': '30 Seconds',
                'Cup Sizes': 'Espresso, Double, Gran Lungo, Mug, Alto',
                'Auto-off': 'After 2 Minutes of non-use'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 14).toISOString()
    },
    {
        id: 'prod_8',
        categoryKey: 'health',
        name: {
            ar: 'مجفف شعر دايسون سوبرسونيك الإصدار الاحترافي',
            fr: 'Sèche-Cheveux Dyson Supersonic Édition Pro',
            en: 'Dyson Supersonic Hair Dryer Pro Edition'
        },
        category: {
            ar: 'الصحة والجمال والعناية',
            fr: 'Beauté & Soins',
            en: 'Health'
        },
        price: 48000,
        oldPrice: 55000,
        badge: {
            ar: 'الأعلى تقييماً',
            fr: 'Mieux Noté',
            en: 'TOP RATED'
        },
        rating: 4.9,
        reviewsCount: 78,
        stock: 2,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80'
        ],
        shortDesc: {
            ar: 'تحكم ذكي في درجة الحرارة لحماية لمعان الشعر مع محرك رقمي سريع V9 وتجفيف فائق.',
            fr: 'Contrôle intelligent de la chaleur pour préserver la brillance avec moteur numérique Dyson V9.',
            en: 'Intelligent heat control to protect hair shine with fast drying digital motor V9.'
        },
        description: {
            ar: 'صُمم لجميع أنواع الشعر. بمحرك رقمي فائق القوة ومستشعر حراري يقيس درجة الحرارة أكثر من 40 مرة في الثانية لمنع أضرار الحرارة المفرطة والحفاظ على اللمعان الطبيعي.',
            fr: 'Conçu pour tous les types de cheveux. Moteur numérique puissant pour un séchage rapide et contrôle intelligent de la chaleur pour préserver l\'éclat naturel de la chevelure.',
            en: 'Engineered for different hair types. With a powerful digital motor for fast drying, and intelligent heat control to help protect your shine.'
        },
        specs: {
            ar: {
                'المحرك': 'محرك Dyson V9 الرقمي (110,000 دورة/د)',
                'إعدادات الحرارة': '4 درجات حرارة دقيقة (من 28°م إلى 100°م)',
                'تدفق الهواء': '41 لتر في الثانية',
                'الملحقات': '5 رؤوس تصفيف مغناطيسية متطورة'
            },
            fr: {
                'Moteur': 'Moteur numérique Dyson V9 (110 000 tr/min)',
                'Réglages température': '4 réglages précis (de 28°C à 100°C)',
                'Débit d\'air': '41 Litres par seconde',
                'Accessoires': '5 embouts de coiffage magnétiques'
            },
            en: {
                'Motor': 'Dyson Digital Motor V9 (110,000 RPM)',
                'Heat Settings': '4 Precise Heat Settings (28°C to 100°C)',
                'Airflow': '41 Liters per second',
                'Attachments': '5 Magnetic styling attachments'
            }
        },
        addedAt: new Date(Date.now() - 86400000 * 16).toISOString()
    }
]);

/**
 * Contract / Base Interface for Product Data Adapters
 */
export class ProductAdapter {
    /**
     * Get all products
     * @returns {Array<object>|Promise<Array<object>>}
     */
    getAll() {
        throw new Error('getAll() must be implemented by adapter');
    }

    /**
     * Get single product by ID
     * @param {string} id
     * @returns {object|null|Promise<object|null>}
     */
    getById(id) {
        throw new Error('getById(id) must be implemented by adapter');
    }

    /**
     * Save (create or update) a single product
     * @param {object} product
     * @returns {object|Promise<object>}
     */
    save(product) {
        throw new Error('save(product) must be implemented by adapter');
    }

    /**
     * Save an entire collection of products
     * @param {Array<object>} products
     * @returns {Array<object>|Promise<Array<object>>}
     */
    saveAll(products) {
        throw new Error('saveAll(products) must be implemented by adapter');
    }

    /**
     * Delete product by unique ID
     * @param {string} id
     * @returns {boolean|Promise<boolean>}
     */
    delete(id) {
        throw new Error('delete(id) must be implemented by adapter');
    }

    /**
     * Seed catalog initial data
     * @param {Array<object>} initialProducts
     * @returns {Array<object>|Promise<Array<object>>}
     */
    seed(initialProducts) {
        throw new Error('seed(initialProducts) must be implemented by adapter');
    }
}

/**
 * LocalStorage Adapter — Handles browser storage persistence and schema migration
 */
export class LocalStorageProductAdapter extends ProductAdapter {
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
        return all.find(p => p.id === id) || null;
    }

    save(product) {
        if (!isValidProduct(product)) {
            throw new Error('Invalid product schema');
        }
        const all = this.getAll();
        const index = all.findIndex(p => p.id === product.id);
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
        const filtered = all.filter(p => p.id !== id);
        this.storage.setProducts(filtered);
        return filtered.length < all.length;
    }

    seed(initialProducts) {
        const stored = this.storage.getProducts();

        // Check if missing, empty, or outdated schema (without categoryKey or multilingual name)
        if (!Array.isArray(stored) || stored.length === 0 || !stored[0]?.stock || !stored[0]?.categoryKey || typeof stored[0]?.name !== 'object') {
            this.storage.setProducts(initialProducts);
            return [...initialProducts];
        }

        // Maintain local assets integrity if legacy URLs were stored
        let hasUpdated = false;
        stored.forEach(p => {
            if (p.id === 'prod_1' && (p.image?.includes('unsplash') || !p.image)) {
                p.image = 'assets/sony-wh1000xm5.png';
                p.gallery = ['assets/sony-wh1000xm5.png', ...(p.gallery || []).slice(1)];
                hasUpdated = true;
            }
            if (p.id === 'prod_2' && (p.image?.includes('unsplash') || !p.image)) {
                p.image = 'assets/apple-watch-ultra.png';
                p.gallery = ['assets/apple-watch-ultra.png', ...(p.gallery || []).slice(1)];
                hasUpdated = true;
            }
        });

        if (hasUpdated) {
            this.storage.setProducts(stored);
        }

        return stored;
    }
}

/**
 * REST API / Database Adapter (For future backend integration: Node.js, Express, Supabase, Firebase)
 */
export class ApiProductAdapter extends ProductAdapter {
    constructor({ baseUrl = '/api/products', headers = {} } = {}) {
        super();
        this.baseUrl = baseUrl;
        this.headers = { 'Content-Type': 'application/json', ...headers };
        this._cache = [];
    }

    async getAll() {
        try {
            const res = await fetch(this.baseUrl, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const data = await res.json();
            this._cache = Array.isArray(data) ? data : [];
            return this._cache;
        } catch (err) {
            console.error('[ApiProductAdapter] Fetch failed:', err);
            return this._cache;
        }
    }

    async getById(id) {
        try {
            const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}`, { headers: this.headers });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.error('[ApiProductAdapter] getById failed:', err);
            return null;
        }
    }

    async save(product) {
        const isUpdate = Boolean(product.id && this._cache.some(p => p.id === product.id));
        const url = isUpdate ? `${this.baseUrl}/${encodeURIComponent(product.id)}` : this.baseUrl;
        const method = isUpdate ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: this.headers,
            body: JSON.stringify(product)
        });
        return await res.json();
    }

    async saveAll(products) {
        const res = await fetch(`${this.baseUrl}/bulk`, {
            method: 'PUT',
            headers: this.headers,
            body: JSON.stringify(products)
        });
        return await res.json();
    }

    async delete(id) {
        const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: this.headers
        });
        return res.ok;
    }

    async seed(initialProducts) {
        return this.saveAll(initialProducts);
    }
}

/**
 * Products Repository — The single source of truth managing the active data adapter
 */
let currentProductAdapter = new LocalStorageProductAdapter();

export const ProductsRepository = {
    /**
     * Switch the storage adapter with a single line of code
     * @param {ProductAdapter} adapter
     */
    setAdapter(adapter) {
        if (!adapter || typeof adapter.getAll !== 'function') {
            throw new Error('[ProductsRepository] Invalid adapter provided.');
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

/**
 * Products Service — High-level Domain Service handling business logic, filtering, and catalog queries
 */
export class ProductsService {
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
    static filterAndSort(products, { category = 'all', searchQuery = '', sortOrder = 'featured' } = {}) {
        const catKey = (category || 'all').toLowerCase();
        let result = catKey === 'all'
            ? [...products]
            : products.filter(p => {
                const k = (p.categoryKey || '').toLowerCase();
                if (k && k === catKey) return true;
                const c = p.category;
                if (typeof c === 'string') return c.toLowerCase() === catKey;
                if (typeof c === 'object' && c !== null) {
                    return Object.values(c).some(v => String(v).toLowerCase() === catKey);
                }
                return false;
            });

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            result = result.filter(p => {
                const matchVal = (val) => {
                    if (!val) return false;
                    if (typeof val === 'string') return val.toLowerCase().includes(query);
                    if (typeof val === 'object' && val !== null) {
                        return Object.values(val).some(v => matchVal(v));
                    }
                    return false;
                };
                return matchVal(p.name) ||
                       matchVal(p.category) ||
                       matchVal(p.categoryKey) ||
                       matchVal(p.shortDesc) ||
                       matchVal(p.description) ||
                       matchVal(p.badge);
            });
        }

        if (sortOrder === 'low') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'high') {
            result.sort((a, b) => b.price - a.price);
        } else if (sortOrder === 'newest') {
            result.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
        }

        return result;
    }
}
