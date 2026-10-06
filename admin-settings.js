/**
 * ZIROX STORE — ADMIN SETTINGS, SHIPPING & BACKUP CONTROLLER
 * Covers Section 4 (Shipping & Zones), Section 5 (Site Settings), and Section 6 (Backup / Restore).
 */

import { StorageService, STORAGE_KEYS } from './storage.js';
import {
    FREE_SHIPPING_THRESHOLD,
    WILAYA_ZONES,
    SHIPPING_RATES,
    getWilayaZone,
    calculateShippingCost,
    getFreeShippingStatus,
    getEffectiveThreshold,
    getEffectiveRates,
    getEffectiveZones
} from './shipping.js';
import { ProductsService, INITIAL_SEED_PRODUCTS } from './products.js';
import { escapeHTML, sanitizeURL } from './security.js';
import { formatPrice } from './i18n.js';

export const ALGERIA_WILAYAS_DATA = Object.freeze([
    { code: 1, nameAr: 'أدرار', nameEn: 'Adrar' },
    { code: 2, nameAr: 'الشلف', nameEn: 'Chlef' },
    { code: 3, nameAr: 'الأغواط', nameEn: 'Laghouat' },
    { code: 4, nameAr: 'أم البواقي', nameEn: 'Oum El Bouaghi' },
    { code: 5, nameAr: 'باتنة', nameEn: 'Batna' },
    { code: 6, nameAr: 'بجاية', nameEn: 'Béjaïa' },
    { code: 7, nameAr: 'بسكرة', nameEn: 'Biskra' },
    { code: 8, nameAr: 'بشار', nameEn: 'Béchar' },
    { code: 9, nameAr: 'البليدة', nameEn: 'Blida' },
    { code: 10, nameAr: 'البويرة', nameEn: 'Bouira' },
    { code: 11, nameAr: 'تمنراست', nameEn: 'Tamanrasset' },
    { code: 12, nameAr: 'تبسة', nameEn: 'Tébessa' },
    { code: 13, nameAr: 'تلمسان', nameEn: 'Tlemcen' },
    { code: 14, nameAr: 'تيارت', nameEn: 'Tiaret' },
    { code: 15, nameAr: 'تيزي وزو', nameEn: 'Tizi Ouzou' },
    { code: 16, nameAr: 'الجزائر العاصمة', nameEn: 'Algiers' },
    { code: 17, nameAr: 'الجلفة', nameEn: 'Djelfa' },
    { code: 18, nameAr: 'جيجل', nameEn: 'Jijel' },
    { code: 19, nameAr: 'سطيف', nameEn: 'Sétif' },
    { code: 20, nameAr: 'سعيدة', nameEn: 'Saïda' },
    { code: 21, nameAr: 'سكيكدة', nameEn: 'Skikda' },
    { code: 22, nameAr: 'سيدي بلعباس', nameEn: 'Sidi Bel Abbès' },
    { code: 23, nameAr: 'عنابة', nameEn: 'Annaba' },
    { code: 24, nameAr: 'قالمة', nameEn: 'Guelma' },
    { code: 25, nameAr: 'قسنطينة', nameEn: 'Constantine' },
    { code: 26, nameAr: 'المدية', nameEn: 'Médéa' },
    { code: 27, nameAr: 'مستغانم', nameEn: 'Mostaganem' },
    { code: 28, nameAr: 'المسيلة', nameEn: "M'Sila" },
    { code: 29, nameAr: 'معسكر', nameEn: 'Mascara' },
    { code: 30, nameAr: 'ورقلة', nameEn: 'Ouargla' },
    { code: 31, nameAr: 'وهران', nameEn: 'Oran' },
    { code: 32, nameAr: 'البيض', nameEn: 'El Bayadh' },
    { code: 33, nameAr: 'إليزي', nameEn: 'Illizi' },
    { code: 34, nameAr: 'برج بوعريريج', nameEn: 'Bordj Bou Arréridj' },
    { code: 35, nameAr: 'بومرداس', nameEn: 'Boumerdès' },
    { code: 36, nameAr: 'الطارف', nameEn: 'El Tarf' },
    { code: 37, nameAr: 'تندوف', nameEn: 'Tindouf' },
    { code: 38, nameAr: 'تسمسيلت', nameEn: 'Tissemsilt' },
    { code: 39, nameAr: 'الوادي', nameEn: 'El Oued' },
    { code: 40, nameAr: 'خنشلة', nameEn: 'Khenchela' },
    { code: 41, nameAr: 'سوق أهراس', nameEn: 'Souk Ahras' },
    { code: 42, nameAr: 'تيبازة', nameEn: 'Tipaza' },
    { code: 43, nameAr: 'ميلة', nameEn: 'Mila' },
    { code: 44, nameAr: 'عين الدفلى', nameEn: 'Aïn Defla' },
    { code: 45, nameAr: 'النعامة', nameEn: 'Naâma' },
    { code: 46, nameAr: 'عين تموشنت', nameEn: 'Aïn Témouchent' },
    { code: 47, nameAr: 'غرداية', nameEn: 'Ghardaïa' },
    { code: 48, nameAr: 'غليزان', nameEn: 'Relizane' },
    { code: 49, nameAr: 'تيميمون', nameEn: 'Timimoun' },
    { code: 50, nameAr: 'برج باجي مختار', nameEn: 'Bordj Badji Mokhtar' },
    { code: 51, nameAr: 'أولاد جلال', nameEn: 'Ouled Djellal' },
    { code: 52, nameAr: 'بني عباس', nameEn: 'Béni Abbès' },
    { code: 53, nameAr: 'عين صالح', nameEn: 'In Salah' },
    { code: 54, nameAr: 'عين قزام', nameEn: 'In Guezzam' },
    { code: 55, nameAr: 'تقرت', nameEn: 'Touggourt' },
    { code: 56, nameAr: 'جانت', nameEn: 'Djanet' },
    { code: 57, nameAr: 'المغير', nameEn: "El M'Ghair" },
    { code: 58, nameAr: 'المنيعة', nameEn: 'El Meniaa' },
    { code: 59, nameAr: 'أفلو', nameEn: 'Aflou' },
    { code: 60, nameAr: 'بريكة', nameEn: 'Barika' },
    { code: 61, nameAr: 'القنطرة', nameEn: 'El Kantara' },
    { code: 62, nameAr: 'بئر العاتر', nameEn: 'Bir El Ater' },
    { code: 63, nameAr: 'العريشة', nameEn: 'El Aricha' },
    { code: 64, nameAr: 'قصر الشلالة', nameEn: 'Ksar Chellala' },
    { code: 65, nameAr: 'عين وسارة', nameEn: 'Ain Oussera' },
    { code: 66, nameAr: 'مسعد', nameEn: 'Messaad' },
    { code: 67, nameAr: 'قصر البخاري', nameEn: 'Ksar El Boukhari' },
    { code: 68, nameAr: 'بوسعادة', nameEn: 'Bou-Saada' },
    { code: 69, nameAr: 'الأبيض سيدي الشيخ', nameEn: 'El Abiodh Sidi Cheikh' }
]);

export const DEFAULT_SITE_SETTINGS = Object.freeze({
    brandName: 'ZIROX',
    tagline: 'متجر النخبة الفاخر • DZ',
    logoUrl: '',
    faviconUrl: 'favicon.ico',
    whatsappNumber: '213676184805',
    phoneDisplay: '+213 676 18 48 05',
    email: 'contact@zirox-store.com',
    city: 'الجزائر العاصمة',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    topBarEnabled: true,
    topBarBadge: '69 Wilayas',
    topBarText: 'توصيل سريع لكافة الـ 69 ولاية • معاينة وفحص الطرد قبل الدفع عند الاستلام • شحن مجاني للطلبات فوق 20 000 دج',
    heroLiveBadge: '🇩🇿 المنصة الرسمية الأولى للتقنية الفاخرة • الجزائر 2026',
    heroTicker: 'ALGIERS / ORAN / CONSTANTINE / 69 WILAYAS',
    heroTitle: 'اقتنِ قمة التكنولوجيا العالمية\nبأمان سيادي مطلق.',
    heroDesc: 'منصة التسوّق الأولى في الجزائر للأجهزة الفائقة الأصلية 100%. معاينة واختبار فوري قبل الدفع، وضمان استبدال مباشر لجميع الـ 69 ولاية.',
    heroProductImg: 'assets/sony-wh1000xm5.png',
    heroChipTop: 'MASTER SOUND 2026',
    heroChipAcoustics: '360° PRECISION ACOUSTICS',
    heroChipCod: 'COD VERIFIED • 36 000 DZD',
    marqueeEnabled: true,
    whatsappFloatEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: 'المتجر يخضع حالياً لتحديثات دورية لتحسين تجربة التسوق. سنعود قريباً!'
});

let wilayaFilterQuery = '';
let activeSettingsTab = 'brand';

// =============================================================================
// SECTION 4: SHIPPING & ZONES
// =============================================================================

export function renderShippingSection(container) {
    if (!container) return;

    const currentThreshold = getEffectiveThreshold();
    const currentRates = getEffectiveRates();
    const currentZones = getEffectiveZones();

    const filteredWilayas = ALGERIA_WILAYAS_DATA.filter(w => {
        if (!wilayaFilterQuery) return true;
        const q = wilayaFilterQuery.toLowerCase();
        return String(w.code).includes(q) || w.nameAr.toLowerCase().includes(q) || w.nameEn.toLowerCase().includes(q);
    });

    container.innerHTML = `
        <!-- Sub-section A: Free Shipping Threshold -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">🎁 عتبة الشحن المجاني (Free Shipping Threshold)</h3>
                <span style="font-size:0.8rem;color:var(--text-muted);">تحديد قيمة السلة المؤهلة للتوصيل المجاني</span>
            </div>
            <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
                <div style="flex:1;min-width:240px;">
                    <label class="form-label">القيمة بالدينار الجزائري (DZD)</label>
                    <input type="number" class="admin-input" id="inp-free-shipping-threshold" value="${currentThreshold}" min="0" step="1000">
                </div>
                <div style="margin-top:20px;display:flex;gap:10px;">
                    <button class="btn-pill" id="btn-save-threshold">حفظ العتبة</button>
                    <button class="btn-secondary-pill" id="btn-reset-threshold">استعادة الافتراضي (20,000 دج)</button>
                </div>
            </div>
        </div>

        <!-- Sub-section B: Shipping Rates Table -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">🚚 جدول تسعيرات الشحن حسب المناطق (Zone × Mode)</h3>
                <button class="btn-secondary-pill" id="btn-reset-rates">استعادة الأسعار الافتراضية</button>
            </div>
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>المنطقة اللوجستية</th>
                            <th>الوصف الجغرافي</th>
                            <th>توصيل للمكتب (Stop Desk / Office)</th>
                            <th>توصيل للمنزل (Home Delivery)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Zone 1</strong></td>
                            <td>العاصمة والمتيجة (الجزائر، البليدة، تيبازة، بومرداس)</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="1" data-mode="office" value="${currentRates[1]?.office || 300}" style="width:110px;"> دج</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="1" data-mode="home" value="${currentRates[1]?.home || 450}" style="width:110px;"> دج</td>
                        </tr>
                        <tr>
                            <td><strong>Zone 2</strong></td>
                            <td>الولايات الشمالية والساحلية (الافتراضية)</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="2" data-mode="office" value="${currentRates[2]?.office || 400}" style="width:110px;"> دج</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="2" data-mode="home" value="${currentRates[2]?.home || 600}" style="width:110px;"> دج</td>
                        </tr>
                        <tr>
                            <td><strong>Zone 3</strong></td>
                            <td>الهضاب العليا والولايات الداخلية الشمالية</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="3" data-mode="office" value="${currentRates[3]?.office || 500}" style="width:110px;"> دج</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="3" data-mode="home" value="${currentRates[3]?.home || 750}" style="width:110px;"> دج</td>
                        </tr>
                        <tr>
                            <td><strong>Zone 4</strong></td>
                            <td>الجنوب والصحراء الكبرى (بما فيها مسعد 66 والأبيض سيدي الشيخ 69)</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="4" data-mode="office" value="${currentRates[4]?.office || 750}" style="width:110px;"> دج</td>
                            <td><input type="number" class="admin-input rate-inp" data-zone="4" data-mode="home" value="${currentRates[4]?.home || 1100}" style="width:110px;"> دج</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="margin-top:16px;text-align:left;">
                <button class="btn-pill" id="btn-save-rates">حفظ جدول التسعيرات</button>
            </div>
        </div>

        <!-- Sub-section C: Zone Assignments for 69 Wilayas -->
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h3 class="admin-card-title">📍 تصنيف الـ 69 ولاية في المناطق (Zone 1 - 4)</h3>
                    <span style="font-size:0.8rem;color:var(--text-muted);">تعديل تصنيف أي ولاية وفق عقود شركات التوصيل</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <input type="text" class="admin-search-input" id="inp-search-wilayas" placeholder="🔍 بحث عن ولاية بالاسم أو الرقم..." value="${escapeHTML(wilayaFilterQuery)}" style="min-width:240px;">
                    <button class="btn-secondary-pill" id="btn-reset-zones">استعادة التصنيف الرسمي الافتراضي</button>
                </div>
            </div>
            <div class="table-responsive" style="max-height:420px;overflow-y:auto;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th style="width:70px;">الرقم</th>
                            <th>الاسم بالعربية</th>
                            <th>الاسم بالفرنسية/اللاتينية</th>
                            <th>المنطقة الحالية</th>
                            <th>تعديل المنطقة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredWilayas.map(w => {
                            const zone = getWilayaZone(w.code);
                            return `
                                <tr>
                                    <td><strong>${w.code}</strong></td>
                                    <td>${escapeHTML(w.nameAr)}</td>
                                    <td>${escapeHTML(w.nameEn)}</td>
                                    <td>
                                        <span class="status-pill ${zone === 4 ? 'out-of-stock' : (zone === 1 ? 'in-stock' : 'low-stock')}">
                                            Zone ${zone}
                                        </span>
                                    </td>
                                    <td>
                                        <select class="admin-select wilaya-zone-select" data-code="${w.code}" style="padding:4px 8px;font-size:0.8rem;">
                                            <option value="1" ${zone === 1 ? 'selected' : ''}>Zone 1 (العاصمة والمتيجة)</option>
                                            <option value="2" ${zone === 2 ? 'selected' : ''}>Zone 2 (الساحل والشمال)</option>
                                            <option value="3" ${zone === 3 ? 'selected' : ''}>Zone 3 (الهضاب العليا والداخل)</option>
                                            <option value="4" ${zone === 4 ? 'selected' : ''}>Zone 4 (الجنوب والصحراء)</option>
                                        </select>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:16px;text-align:left;">
                <button class="btn-pill" id="btn-save-wilaya-zones">حفظ تصنيفات الولايات</button>
            </div>
        </div>

        <!-- Sub-section D: Preview Live Shipping Calculator -->
        <div class="admin-card">
            <div class="admin-card-header">
                <h3 class="admin-card-title">🧮 حاسبة محاكاة كلفة التوصيل المباشرة (Live Preview)</h3>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;align-items:flex-end;">
                <div class="form-group">
                    <label class="form-label">اختر الولاية</label>
                    <select class="admin-select" id="calc-wilaya-select" style="border-radius:var(--radius-md);">
                        ${ALGERIA_WILAYAS_DATA.map(w => `<option value="${w.code}">${w.code} - ${w.nameAr} (${w.nameEn})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">نوع التوصيل</label>
                    <select class="admin-select" id="calc-mode-select" style="border-radius:var(--radius-md);">
                        <option value="office">استلام من المكتب (Stop Desk)</option>
                        <option value="home">توصيل للعنوان والمنزل (Home)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">قيمة السلة (دج)</label>
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
    // Save threshold
    const saveThreshBtn = container.querySelector('#btn-save-threshold');
    const threshInp = container.querySelector('#inp-free-shipping-threshold');
    if (saveThreshBtn && threshInp) {
        saveThreshBtn.onclick = () => {
            const val = parseInt(threshInp.value, 10);
            StorageService.setFreeShippingThreshold(val);
            window.adminToast?.('تم حفظ عتبة الشحن المجاني بنجاح!', 'success');
            updateCalculatorPreview(container);
        };
    }

    // Reset threshold
    const resetThreshBtn = container.querySelector('#btn-reset-threshold');
    if (resetThreshBtn) {
        resetThreshBtn.onclick = () => {
            StorageService.removeItem(STORAGE_KEYS.FREE_SHIPPING_THRESHOLD);
            window.adminToast?.('تمت استعادة العتبة الافتراضية (20,000 دج)', 'success');
            renderShippingSection(container);
        };
    }

    // Save rates
    const saveRatesBtn = container.querySelector('#btn-save-rates');
    if (saveRatesBtn) {
        saveRatesBtn.onclick = () => {
            const newRates = { 1: {}, 2: {}, 3: {}, 4: {} };
            container.querySelectorAll('.rate-inp').forEach(inp => {
                const z = inp.getAttribute('data-zone');
                const m = inp.getAttribute('data-mode');
                const v = Math.max(0, parseInt(inp.value, 10) || 0);
                newRates[z][m] = v;
            });
            StorageService.setShippingRates(newRates);
            window.adminToast?.('تم حفظ جدول تسعيرات الشحن بنجاح!', 'success');
            updateCalculatorPreview(container);
        };
    }

    // Reset rates
    const resetRatesBtn = container.querySelector('#btn-reset-rates');
    if (resetRatesBtn) {
        resetRatesBtn.onclick = () => {
            StorageService.removeItem(STORAGE_KEYS.SHIPPING_RATES);
            window.adminToast?.('تمت استعادة التسعيرات الافتراضية', 'success');
            renderShippingSection(container);
        };
    }

    // Wilaya search filter
    const wilayaSearchInp = container.querySelector('#inp-search-wilayas');
    if (wilayaSearchInp) {
        wilayaSearchInp.addEventListener('input', (e) => {
            wilayaFilterQuery = e.target.value;
            renderShippingSection(container);
            const refocused = container.querySelector('#inp-search-wilayas');
            if (refocused) {
                refocused.focus();
                refocused.setSelectionRange(refocused.value.length, refocused.value.length);
            }
        });
    }

    // Save Wilaya Zones
    const saveZonesBtn = container.querySelector('#btn-save-wilaya-zones');
    if (saveZonesBtn) {
        saveZonesBtn.onclick = () => {
            const zones = {
                ZONE_1: [],
                ZONE_3: [],
                ZONE_4: []
            };
            container.querySelectorAll('.wilaya-zone-select').forEach(sel => {
                const code = parseInt(sel.getAttribute('data-code'), 10);
                const val = parseInt(sel.value, 10);
                if (val === 1) zones.ZONE_1.push(code);
                else if (val === 3) zones.ZONE_3.push(code);
                else if (val === 4) zones.ZONE_4.push(code);
                // Zone 2 is default North/Coastal
            });
            StorageService.setWilayaZones(zones);
            window.adminToast?.('تم حفظ تصنيفات الولايات اللوجستية بنجاح!', 'success');
            updateCalculatorPreview(container);
        };
    }

    // Reset Zones
    const resetZonesBtn = container.querySelector('#btn-reset-zones');
    if (resetZonesBtn) {
        resetZonesBtn.onclick = () => {
            StorageService.removeItem(STORAGE_KEYS.WILAYA_ZONES);
            window.adminToast?.('تمت استعادة تصنيفات الولايات الرسمية', 'success');
            renderShippingSection(container);
        };
    }

    // Calculator inputs
    const calcWilaya = container.querySelector('#calc-wilaya-select');
    const calcMode = container.querySelector('#calc-mode-select');
    const calcSubtotal = container.querySelector('#calc-subtotal-inp');

    [calcWilaya, calcMode, calcSubtotal].forEach(el => {
        if (el) el.addEventListener('input', () => updateCalculatorPreview(container));
    });
}

function updateCalculatorPreview(container) {
    const calcWilaya = container.querySelector('#calc-wilaya-select');
    const calcMode = container.querySelector('#calc-mode-select');
    const calcSubtotal = container.querySelector('#calc-subtotal-inp');
    const resultBox = container.querySelector('#calc-result-box');
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
            <div style="font-size:0.75rem;color:var(--text-muted);">المنطقة المحددة</div>
            <div style="font-size:1.2rem;font-weight:800;">Zone ${zone}</div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">كلفة الشحن العادية</div>
            <div style="font-size:1.2rem;font-weight:800;">${formatPrice(cost)}</div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">مؤهل للشحن المجاني؟</div>
            <div style="font-size:1.1rem;font-weight:800;color:${isUnlocked ? '#16a34a' : '#ea580c'};">
                ${isUnlocked ? '✓ نعم (شحن مجاني)' : `لا (باقي ${formatPrice(remaining)})`}
            </div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">كلفة الشحن المحتسبة</div>
            <div style="font-size:1.2rem;font-weight:800;color:${isUnlocked ? '#16a34a' : 'inherit'};">
                ${formatPrice(finalShipping)}
            </div>
        </div>
        <div>
            <div style="font-size:0.75rem;color:var(--text-muted);">المبلغ الإجمالي المتوقع</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">${formatPrice(totalOrder)}</div>
        </div>
    `;
}

// =============================================================================
// SECTION 5: SITE SETTINGS
// =============================================================================

export function renderSettingsSection(container) {
    if (!container) return;

    const saved = StorageService.getSettings() || {};
    const s = { ...DEFAULT_SITE_SETTINGS, ...saved };

    container.innerHTML = `
        <div class="admin-card">
            <div class="admin-card-header">
                <div>
                    <h2 class="admin-card-title">⚙️ إعدادات الموقع والمتجر (Site Settings)</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">التحكم بهوية المتجر، معلومات الاتصال، نصوص الواجهة والفوتر، والشارات</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="btn-pill" id="btn-save-site-settings">حفظ التغييرات</button>
                    <button class="btn-secondary-pill" id="btn-reset-site-settings">استعادة الافتراضيات</button>
                </div>
            </div>

            <!-- Settings Sub Tabs -->
            <div class="admin-modal-tabs" style="background:var(--surface-white);margin-bottom:20px;padding:0;border-bottom:1px solid var(--border-light);">
                <button class="admin-tab-btn ${activeSettingsTab === 'brand' ? 'active' : ''}" data-stab="brand">🏷️ الهوية والبراند</button>
                <button class="admin-tab-btn ${activeSettingsTab === 'contact' ? 'active' : ''}" data-stab="contact">📞 بيانات الاتصال والواتساب</button>
                <button class="admin-tab-btn ${activeSettingsTab === 'topbar' ? 'active' : ''}" data-stab="topbar">📢 الشريط العلوي (Top Bar)</button>
                <button class="admin-tab-btn ${activeSettingsTab === 'hero' ? 'active' : ''}" data-stab="hero">🌟 واجهة الـ Hero</button>
                <button class="admin-tab-btn ${activeSettingsTab === 'footer' ? 'active' : ''}" data-stab="footer">📄 الفوتر وروابط التواصل</button>
                <button class="admin-tab-btn ${activeSettingsTab === 'advanced' ? 'active' : ''}" data-stab="advanced">⚡ خيارات متقدمة</button>
            </div>

            <!-- Tab 1: Brand -->
            <div id="spane-brand" style="display:${activeSettingsTab === 'brand' ? 'block' : 'none'};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">اسم المتجر (Brand Name)</label>
                        <input type="text" class="admin-input" id="set-brand-name" value="${escapeHTML(s.brandName)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">الشعار الفرعي (Tagline)</label>
                        <input type="text" class="admin-input" id="set-tagline" value="${escapeHTML(s.tagline)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">رابط أيقونة المتجر (Favicon URL)</label>
                        <input type="text" class="admin-input" id="set-favicon" value="${escapeHTML(s.faviconUrl)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">رابط شعار مخصص (Logo Image URL)</label>
                        <input type="text" class="admin-input" id="set-logo-url" value="${escapeHTML(s.logoUrl)}" placeholder="اتركه فارغاً للاحتفاظ برمز SVG الملكي">
                    </div>
                </div>
            </div>

            <!-- Tab 2: Contact -->
            <div id="spane-contact" style="display:${activeSettingsTab === 'contact' ? 'block' : 'none'};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">رقم الواتساب الرسمي (بدون مسافات أو +) *</label>
                        <input type="text" class="admin-input" id="set-wa-num" value="${escapeHTML(s.whatsappNumber)}" placeholder="213676184805">
                        <span style="font-size:0.75rem;color:var(--text-muted);">يُستخدم في جميع روابط وتأكيدات طلبات الواتساب في المتجر</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف للعرض</label>
                        <input type="text" class="admin-input" id="set-phone-disp" value="${escapeHTML(s.phoneDisplay)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">البريد الإلكتروني للدعم</label>
                        <input type="email" class="admin-input" id="set-email" value="${escapeHTML(s.email)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">المدينة / المقر الرئيسي</label>
                        <input type="text" class="admin-input" id="set-city" value="${escapeHTML(s.city)}">
                    </div>
                </div>
            </div>

            <!-- Tab 3: Top Bar -->
            <div id="spane-topbar" style="display:${activeSettingsTab === 'topbar' ? 'block' : 'none'};">
                <div class="form-group" style="margin-bottom:20px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-topbar-enable" ${s.topBarEnabled ? 'checked' : ''} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;">تفعيل الشريط الإعلاني العلوي (Top Bar)</span>
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group" style="max-width:200px;">
                        <label class="form-label">شارة الشريط (Badge)</label>
                        <input type="text" class="admin-input" id="set-topbar-badge" value="${escapeHTML(s.topBarBadge)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">نص الرسالة الترويجية</label>
                        <input type="text" class="admin-input" id="set-topbar-text" value="${escapeHTML(s.topBarText)}">
                    </div>
                </div>
            </div>

            <!-- Tab 4: Hero -->
            <div id="spane-hero" style="display:${activeSettingsTab === 'hero' ? 'block' : 'none'};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">شارة الهيدر النشطة (Live Badge)</label>
                        <input type="text" class="admin-input" id="set-hero-live" value="${escapeHTML(s.heroLiveBadge)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">شريط التيكر العلوي (Ticker Text)</label>
                        <input type="text" class="admin-input" id="set-hero-ticker" value="${escapeHTML(s.heroTicker)}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">العنوان الرئيسي H1</label>
                    <textarea class="admin-textarea" id="set-hero-title" style="min-height:60px;">${escapeHTML(s.heroTitle)}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">الوصف الترحيبي</label>
                    <textarea class="admin-textarea" id="set-hero-desc" style="min-height:70px;">${escapeHTML(s.heroDesc)}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">رابط صورة المنتج المعروض في Hero</label>
                        <input type="text" class="admin-input" id="set-hero-img" value="${escapeHTML(s.heroProductImg)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">شارة المنتج العلوية (Top Chip)</label>
                        <input type="text" class="admin-input" id="set-hero-chiptop" value="${escapeHTML(s.heroChipTop)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">شارة المواصفات (Acoustics Chip)</label>
                        <input type="text" class="admin-input" id="set-hero-chipacoustics" value="${escapeHTML(s.heroChipAcoustics)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">شارة الدفع (COD Chip)</label>
                        <input type="text" class="admin-input" id="set-hero-chipcod" value="${escapeHTML(s.heroChipCod)}">
                    </div>
                </div>
            </div>

            <!-- Tab 5: Footer & Social -->
            <div id="spane-footer" style="display:${activeSettingsTab === 'footer' ? 'block' : 'none'};">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">رابط صفحة Facebook</label>
                        <input type="text" class="admin-input" id="set-fb" value="${escapeHTML(s.facebookUrl)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">رابط حساب Instagram</label>
                        <input type="text" class="admin-input" id="set-ig" value="${escapeHTML(s.instagramUrl)}">
                    </div>
                </div>
            </div>

            <!-- Tab 6: Advanced -->
            <div id="spane-advanced" style="display:${activeSettingsTab === 'advanced' ? 'block' : 'none'};">
                <div class="form-group" style="margin-bottom:20px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-marquee-enable" ${s.marqueeEnabled ? 'checked' : ''} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;">تفعيل شريط التمرير المتحرك (Marquee Ticker)</span>
                    </label>
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-wa-float-enable" ${s.whatsappFloatEnabled ? 'checked' : ''} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;">تفعيل زر واتساب العائم السريع</span>
                    </label>
                </div>
                <div class="form-group" style="margin-bottom:20px;border-top:1px solid var(--border-light);padding-top:16px;">
                    <label class="admin-switch-wrap">
                        <input type="checkbox" id="set-maint-mode" ${s.maintenanceMode ? 'checked' : ''} style="display:none;">
                        <span class="admin-switch"></span>
                        <span style="font-weight:700;font-size:0.9rem;color:#dc2626;">تفعيل وضع الصيانة المؤقت للمتجر</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">رسالة وضع الصيانة المعروضة للزبائن</label>
                    <textarea class="admin-textarea" id="set-maint-msg">${escapeHTML(s.maintenanceMessage)}</textarea>
                </div>
            </div>
        </div>
    `;

    bindSettingsSectionEvents(container);
}

function bindSettingsSectionEvents(container) {
    // Tab switching
    container.querySelectorAll('.admin-modal-tabs .admin-tab-btn').forEach(btn => {
        btn.onclick = () => {
            activeSettingsTab = btn.getAttribute('data-stab');
            renderSettingsSection(container);
        };
    });

    // Save site settings
    const saveBtn = container.querySelector('#btn-save-site-settings');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const getVal = id => container.querySelector('#' + id)?.value?.trim();
            const getChecked = id => container.querySelector('#' + id)?.checked;

            const newSettings = {
                brandName: getVal('set-brand-name'),
                tagline: getVal('set-tagline'),
                logoUrl: getVal('set-logo-url'),
                faviconUrl: getVal('set-favicon'),
                whatsappNumber: getVal('set-wa-num'),
                phoneDisplay: getVal('set-phone-disp'),
                email: getVal('set-email'),
                city: getVal('set-city'),
                facebookUrl: getVal('set-fb'),
                instagramUrl: getVal('set-ig'),
                topBarEnabled: getChecked('set-topbar-enable'),
                topBarBadge: getVal('set-topbar-badge'),
                topBarText: getVal('set-topbar-text'),
                heroLiveBadge: getVal('set-hero-live'),
                heroTicker: getVal('set-hero-ticker'),
                heroTitle: getVal('set-hero-title'),
                heroDesc: getVal('set-hero-desc'),
                heroProductImg: getVal('set-hero-img'),
                heroChipTop: getVal('set-hero-chiptop'),
                heroChipAcoustics: getVal('set-hero-chipacoustics'),
                heroChipCod: getVal('set-hero-chipcod'),
                marqueeEnabled: getChecked('set-marquee-enable'),
                whatsappFloatEnabled: getChecked('set-wa-float-enable'),
                maintenanceMode: getChecked('set-maint-mode'),
                maintenanceMessage: getVal('set-maint-msg')
            };

            StorageService.setSettings(newSettings);
            window.adminToast?.('تم حفظ إعدادات الموقع بنجاح وسيتم تطبيقها على المتجر!', 'success');
        };
    }

    // Reset site settings
    const resetBtn = container.querySelector('#btn-reset-site-settings');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية للمتجر؟')) {
                StorageService.setSettings({ ...DEFAULT_SITE_SETTINGS });
                window.adminToast?.('تمت استعادة الإعدادات الافتراضية للمتجر', 'success');
                renderSettingsSection(container);
            }
        };
    }
}

// =============================================================================
// SECTION 6: BACKUP & RESTORE
// =============================================================================

export function renderBackupSection(container) {
    if (!container) return;

    // Calculate approximate usage
    const allKeys = StorageService.getAllKeys();
    let totalBytes = 0;
    const keyBreakdown = [];

    for (const [k, v] of Object.entries(allKeys)) {
        const str = JSON.stringify(v || '');
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
                    <h2 class="admin-card-title">💾 النسخ الاحتياطي والاستعادة (Backup & Restore)</h2>
                    <span style="font-size:0.8rem;color:var(--text-muted);">تأمين بيانات المتجر محلياً بدون خادم، وتصدير واستيراد قواعد البيانات</span>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
                <!-- Export Card -->
                <div style="border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;background:var(--surface-subtle);display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <h3 style="margin:0 0 8px 0;font-size:1.1rem;font-weight:800;">📥 تحميل نسخة احتياطية كاملة (Full Backup)</h3>
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0 0 16px 0;">
                            تصدير كامل كتالوج المنتجات، سجل الطلبيات، إعدادات الشحن والمناطق، وتخصيصات المتجر في ملف JSON مشفر ومنظم.
                        </p>
                    </div>
                    <button class="btn-pill" id="btn-download-full-backup" style="align-self:flex-start;">
                        تحميل النسخة الاحتياطية (.JSON)
                    </button>
                </div>

                <!-- Import Card -->
                <div style="border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;background:var(--surface-subtle);display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <h3 style="margin:0 0 8px 0;font-size:1.1rem;font-weight:800;">📤 استيراد واسترجاع نسخة سابقة</h3>
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0 0 16px 0;">
                            اختر ملف نسخة احتياطية صالح لاستعادة كافة البيانات فوراً مع مراجعة وفحص سلامة الملف.
                        </p>
                    </div>
                    <label class="btn-secondary-pill" style="align-self:flex-start;cursor:pointer;display:inline-flex;align-items:center;">
                        اختر ملف النسخة الاحتياطية
                        <input type="file" id="inp-import-full-backup" accept=".json" style="display:none;">
                    </label>
                </div>
            </div>

            <!-- Storage Analytics -->
            <div style="margin-bottom:28px;">
                <h3 style="font-size:0.95rem;font-weight:800;margin-bottom:12px;">📊 حجم استهلاك التخزين المحلي (LocalStorage: ${totalKB} KB)</h3>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>المفتاح (Storage Key)</th>
                                <th>النوع / العناصر</th>
                                <th>الحجم التقريبي (KB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${keyBreakdown.map(b => `
                                <tr>
                                    <td><code style="font-size:0.8rem;background:var(--surface-container-low);padding:2px 6px;border-radius:4px;">${escapeHTML(b.key)}</code></td>
                                    <td>${b.count !== null ? `<strong>${b.count}</strong> عناصر` : 'كائن إعدادات'}</td>
                                    <td><strong>${b.kb} KB</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Danger Zone -->
            <div style="border:1px solid #f87171;background:rgba(220, 38, 38, 0.04);border-radius:var(--radius-lg);padding:24px;">
                <h3 style="color:#dc2626;font-size:1.05rem;font-weight:800;margin:0 0 8px 0;">⚠️ منطقة الإجراءات الحرجة (Danger Zone)</h3>
                <p style="font-size:0.84rem;color:var(--text-muted);margin:0 0 20px 0;">
                    هذه الإجراءات تؤدي إلى مسح وتعديل البيانات نهائياً. يرجى توخي الحذر قبل تنفيذ أي إجراء.
                </p>

                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="btn-secondary-pill" id="btn-reset-seed-products" style="color:#dc2626;border-color:#fca5a5;">
                        🔄 استعادة المنتجات الافتراضية (8 منتجات)
                    </button>
                    <button class="btn-secondary-pill" id="btn-clear-cart" style="color:#dc2626;border-color:#fca5a5;">
                        🛒 إفراغ سلة المشتريات
                    </button>
                    <button class="btn-secondary-pill" id="btn-clear-orders" style="color:#dc2626;border-color:#fca5a5;">
                        🗑️ مسح سجل الطلبيات
                    </button>
                    <button class="btn-pill" id="btn-factory-reset" style="background:#dc2626;color:#fff;">
                        ⚡ ضبط المصنع (مسح كل بيانات المتجر)
                    </button>
                </div>
            </div>
        </div>
    `;

    bindBackupSectionEvents(container);
}

function bindBackupSectionEvents(container) {
    // Download full backup
    const downloadBtn = container.querySelector('#btn-download-full-backup');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const backupPayload = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                data: StorageService.getAllKeys()
            };
            const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zirox-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            window.adminToast?.('تم تحميل النسخة الاحتياطية الكاملة للمتجر بنجاح!', 'success');
        };
    }

    // Import full backup
    const importInput = container.querySelector('#inp-import-full-backup');
    if (importInput) {
        importInput.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    const data = parsed.data || parsed;

                    if (!data || typeof data !== 'object') {
                        throw new Error('هيكل ملف النسخة الاحتياطية غير متوافق.');
                    }

                    if (confirm('تنبيه: استعادة هذه النسخة سيستبدل البيانات الحالية في المتجر. هل تود المتابعة؟')) {
                        for (const [key, val] of Object.entries(data)) {
                            if (val !== null && val !== undefined) {
                                StorageService.setItem(key, val);
                            }
                        }
                        window.adminToast?.('تمت استعادة كافة البيانات بنجاح!', 'success');
                        renderBackupSection(container);
                    }
                } catch (err) {
                    console.error('Backup restore failed', err);
                    window.adminToast?.('فشل استعادة النسخة: ' + (err.message || 'الملف تالف'), 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        };
    }

    // Reset Products
    const resetProductsBtn = container.querySelector('#btn-reset-seed-products');
    if (resetProductsBtn) {
        resetProductsBtn.onclick = async () => {
            if (confirm('هل أنت متأكد من استعادة كتالوج المنتجات الافتراضي الأصلي (8 منتجات)؟ سيتم استبدال المنتجات الحالية.')) {
                await ProductsService.seedInitialProducts();
                window.adminToast?.('تمت استعادة كتالوج المنتجات الأصلي بنجاح!', 'success');
                renderBackupSection(container);
            }
        };
    }

    // Clear Cart
    const clearCartBtn = container.querySelector('#btn-clear-cart');
    if (clearCartBtn) {
        clearCartBtn.onclick = () => {
            if (confirm('هل أنت متأكد من رغبتك في إفراغ سلة المشتريات بالكامل؟')) {
                StorageService.setCart([]);
                window.adminToast?.('تم إفراغ سلة المشتريات بنجاح', 'success');
                renderBackupSection(container);
            }
        };
    }

    // Clear Orders
    const clearOrdersBtn = container.querySelector('#btn-clear-orders');
    if (clearOrdersBtn) {
        clearOrdersBtn.onclick = () => {
            if (confirm('تحذير: سيتم حذف كافة الطلبيات السابقة نهائياً! هل أنت متأكد؟')) {
                StorageService.setOrders([]);
                window.adminToast?.('تم مسح سجل الطلبيات بالكامل', 'success');
                renderBackupSection(container);
            }
        };
    }

    // Factory Reset
    const factoryResetBtn = container.querySelector('#btn-factory-reset');
    if (factoryResetBtn) {
        factoryResetBtn.onclick = async () => {
            const code = prompt('إجراء خطير للغاية! لحذف جميع بيانات المتجر واستعادة حالة الصفر، اكتب "RESET" بالإنجليزية للتأكيد:');
            if (code === 'RESET') {
                Object.values(STORAGE_KEYS).forEach(k => StorageService.removeItem(k));
                // Reseed initial products so store isn't broken
                await ProductsService.seedInitialProducts();
                window.adminToast?.('تمت إعادة تعيين ضبط المصنع بنجاح!', 'success');
                renderBackupSection(container);
            } else if (code !== null) {
                window.adminToast?.('تم إلغاء الإجراء (الرمز غير مطابق)', 'warning');
            }
        };
    }
}
