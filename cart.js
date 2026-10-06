/**
 * ZIROX STORE — CART SERVICE & STATE MANAGEMENT
 * Encapsulated reactive cart with Observer pattern and safe persistence.
 */

import { StorageService } from './storage.js';
import { sanitizeCartItems, safePrice } from './security.js';

class CartServiceClass {
    constructor() {
        this.items = sanitizeCartItems(StorageService.getCart());
        this.subscribers = new Set();
    }

    /**
     * Subscribe to cart state changes
     * @param {Function} callback Receives updated items array
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.add(callback);
            // Immediately run callback with current state
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
        this.subscribers.forEach(cb => {
            try {
                cb(currentItems);
            } catch (err) {
                console.error('CartService: Subscriber error', err);
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
        return this.items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
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
        const name = String(product.name || '').slice(0, 200);
        if (!name) return;

        const existing = this.items.find(i => (product.id && i.id === product.id) || i.name === name);

        if (existing) {
            existing.quantity = Math.min(99, existing.quantity + qty);
        } else {
            this.items.push({
                id: product.id || ('item_' + Date.now()),
                name,
                price,
                image: product.image || 'assets/product-image.png',
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
}

// Export singleton instance for app-wide single source of truth
export const CartService = new CartServiceClass();
