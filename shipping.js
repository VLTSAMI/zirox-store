import { StorageService } from './storage.js';

export const FREE_SHIPPING_THRESHOLD = 20000;

export const WILAYA_ZONES = Object.freeze({
    // Capital & Mitidja (Fast Northern Hubs)
    ZONE_1: [16, 9, 42, 35],
    // High Plateaus, Interior & Northern New Wilayas (Law 26-06)
    ZONE_3: [3, 4, 5, 7, 14, 17, 20, 28, 29, 32, 38, 40, 45, 51,
             59, 60, 61, 62, 63, 64, 65, 67, 68],
    // Southern & Great Desert Wilayas (including 66 Messaad & 69 El Abiodh Sidi Cheikh)
    ZONE_4: [1, 8, 11, 30, 33, 37, 39, 47, 49, 50, 52, 53, 54, 55, 56, 57, 58,
             66, 69]
    // Default: ZONE 2 (Coastal & Standard North)
});

export const SHIPPING_RATES = Object.freeze({
    1: { office: 300, home: 450 },
    2: { office: 400, home: 600 },
    3: { office: 500, home: 750 },
    4: { office: 750, home: 1100 }
});

export function getEffectiveThreshold() {
    const custom = StorageService.getFreeShippingThreshold();
    return (typeof custom === 'number' && custom >= 0) ? custom : FREE_SHIPPING_THRESHOLD;
}

export function getEffectiveZones() {
    const custom = StorageService.getWilayaZones();
    return (custom && typeof custom === 'object') ? custom : WILAYA_ZONES;
}

export function getEffectiveRates() {
    const custom = StorageService.getShippingRates();
    return (custom && typeof custom === 'object') ? custom : SHIPPING_RATES;
}

/**
 * Determine the logistic zone for a given Algerian Wilaya number (1 to 69)
 * @param {number|string} wilayaNumber
 * @returns {number} Zone number (1, 2, 3, or 4)
 */
export function getWilayaZone(wilayaNumber) {
    const zones = getEffectiveZones();
    const num = parseInt(wilayaNumber, 10);
    if (zones.ZONE_1 && zones.ZONE_1.includes(num)) return 1;
    if (zones.ZONE_4 && zones.ZONE_4.includes(num)) return 4;
    if (zones.ZONE_3 && zones.ZONE_3.includes(num)) return 3;
    return 2;
}

/**
 * Calculate the shipping fee based on Wilaya code and delivery mode
 * @param {number|string} wilayaNumber
 * @param {'office'|'home'} deliveryType
 * @returns {number} Shipping fee in Algerian Dinars (DZD)
 */
export function calculateShippingCost(wilayaNumber, deliveryType = 'office') {
    const zone = getWilayaZone(wilayaNumber);
    const mode = deliveryType === 'home' ? 'home' : 'office';
    const rates = getEffectiveRates();
    const rate = rates[zone] || rates[2] || { office: 400, home: 600 };
    return rate[mode];
}

/**
 * Check if a subtotal qualifies for free shipping
 * @param {number} subtotal
 * @returns {boolean}
 */
export function isFreeShipping(subtotal) {
    return subtotal >= getEffectiveThreshold();
}

/**
 * Calculate progress toward the free shipping goal
 * @param {number} subtotal
 * @returns {{ isUnlocked: boolean, remaining: number, percentage: number, threshold: number }}
 */
export function getFreeShippingStatus(subtotal) {
    const threshold = getEffectiveThreshold();
    const isUnlocked = isFreeShipping(subtotal);
    const remaining = Math.max(0, threshold - subtotal);
    const percentage = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
    return { isUnlocked, remaining, percentage, threshold };
}
