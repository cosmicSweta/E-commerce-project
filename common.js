/* =========================================================
   E-Shop shared script
   Loaded on every page after data.js.
   Handles: cart storage, price formatting, toasts, the
   mobile menu, the quick-view dialog and image fallbacks.
   ========================================================= */
(function () {
    "use strict";

    var CART_KEY = "cart";
    var ORDERS_KEY = "orders";
    var MAX_QTY = 10;
    var FREE_SHIPPING_MIN = 500;
    var SHIPPING_FEE = 49;
    var CATEGORY_LABELS = { Home: "Home & Living" };

    var PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
        '<rect width="120" height="120" fill="#eef1f7"/>' +
        '<g fill="none" stroke="#9aa5b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="30" y="34" width="60" height="52" rx="6"/><circle cx="48" cy="52" r="6"/>' +
        '<path d="M34 82l20-20 14 14 10-10 12 12"/></g></svg>'
    );

    /* ---------- helpers ---------- */

    function esc(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatPrice(amount) {
        return "\u20B9" + Number(amount).toLocaleString("en-IN");
    }

    function categoryLabel(name) {
        return CATEGORY_LABELS[name] || name;
    }

    function getProduct(id) {
        id = Number(id);
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === id) { return products[i]; }
        }
        return null;
    }

    function categories() {
        var seen = {};
        var list = [];
        products.forEach(function (product) {
            if (!seen[product.category]) {
                seen[product.category] = {
                    name: product.category,
                    label: categoryLabel(product.category),
                    count: 0,
                    image: product.image
                };
                list.push(seen[product.category]);
            }
            seen[product.category].count += 1;
        });
        return list;
    }

    function plural(count, singular, pluralWord) {
        return count + " " + (count === 1 ? singular : (pluralWord || singular + "s"));
    }

    /* ---------- cart storage ---------- */

    // Cart format: [{ id, qty }]. Older versions stored one full product
    // object per click, so those entries are merged into quantities here.
    function readCart() {
        var raw = [];
        try {
            raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch (error) {
            raw = [];
        }
        if (!Array.isArray(raw)) { raw = []; }

        var totals = {};
        var order = [];
        raw.forEach(function (item) {
            var id = item ? Number(item.id) : 0;
            if (!id || !getProduct(id)) { return; }
            var qty = Math.floor(Number(item.qty));
            if (!qty || qty < 1) { qty = 1; }
            if (!(id in totals)) { totals[id] = 0; order.push(id); }
            totals[id] += qty;
        });

        return order.map(function (id) {
            return { id: id, qty: Math.min(totals[id], MAX_QTY) };
        });
    }

    function writeCart(items) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(items));
        } catch (error) {
            toast("Your browser blocked saving the cart. Check your privacy settings.", { kind: "error" });
        }
        updateBadges(true);
        document.dispatchEvent(new CustomEvent("cart:change"));
    }

    function addToCart(id, qty) {
        id = Number(id);
        qty = qty || 1;
        if (!getProduct(id)) { return false; }

        var items = readCart();
        var existing = null;
        items.forEach(function (item) {
            if (item.id === id) { existing = item; }
        });

        if (existing) {
            if (existing.qty >= MAX_QTY) {
                toast("You can buy up to " + MAX_QTY + " of the same item.", { kind: "info" });
                return false;
            }
            existing.qty = Math.min(MAX_QTY, existing.qty + qty);
        } else {
            items.push({ id: id, qty: Math.min(MAX_QTY, qty) });
        }
        writeCart(items);
        return true;
    }

    function setQty(id, qty) {
        id = Number(id);
        qty = Math.floor(Number(qty));
        var items = readCart();
        if (!qty || qty < 1) {
            writeCart(items.filter(function (item) { return item.id !== id; }));
            return;
        }
        items.forEach(function (item) {
            if (item.id === id) { item.qty = Math.min(MAX_QTY, qty); }
        });
        writeCart(items);
    }

    function removeFromCart(id) {
        id = Number(id);
        writeCart(readCart().filter(function (item) { return item.id !== id; }));
    }

    function clearCart() {
        writeCart([]);
    }

    function cartCount() {
        return readCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
    }

    function cartTotals() {
        var lines = readCart().map(function (item) {
            var product = getProduct(item.id);
            return {
                product: product,
                qty: item.qty,
                lineTotal: product.price * item.qty
            };
        });
        var subtotal = lines.reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
        var count = lines.reduce(function (sum, line) { return sum + line.qty; }, 0);
        var shipping = (subtotal === 0 || subtotal >= FREE_SHIPPING_MIN) ? 0 : SHIPPING_FEE;
        return {
            lines: lines,
            count: count,
            subtotal: subtotal,
            shipping: shipping,
            total: subtotal + shipping,
            freeShippingGap: Math.max(0, FREE_SHIPPING_MIN - subtotal)
        };
    }

    function getOrders() {
        var orders = [];
        try {
            orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
        } catch (error) {
            orders = [];
        }
        return Array.isArray(orders) ? orders : [];
    }

    // A flash message is shown once, on the next page that loads.
    function flash(message, kind) {
        try {
            sessionStorage.setItem("flash", JSON.stringify({ message: message, kind: kind || "success" }));
        } catch (error) { /* storage blocked: skip the message */ }
    }

    function showFlash() {
        var raw = null;
        try {
            raw = sessionStorage.getItem("flash");
            sessionStorage.removeItem("flash");
        } catch (error) { return; }
        if (!raw) { return; }
        try {
            var data = JSON.parse(raw);
            toast(data.message, { kind: data.kind });
        } catch (error) { /* ignore a damaged message */ }
    }

    function saveOrder(order) {
        var orders = [];
        try {
            orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
        } catch (error) {
            orders = [];
        }
        if (!Array.isArray(orders)) { orders = []; }
        orders.unshift(order);
        try {
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 20)));
        } catch (error) { /* storage blocked: the confirmation still shows */ }
    }

    /* ---------- cart badge ---------- */

    function updateBadges(animate) {
        var count = cartCount();
        var badges = document.querySelectorAll("[data-cart-count]");
        Array.prototype.forEach.call(badges, function (badge) {
            badge.textContent = count;
            var link = badge.closest ? badge.closest(".cart-link") : null;
            if (link) { link.setAttribute("aria-label", "Cart, " + plural(count, "item")); }
            if (animate) {
                badge.classList.remove("bump");
                void badge.offsetWidth; // restart the animation
                badge.classList.add("bump");
            }
        });
    }

    /* ---------- toast messages ---------- */

    function toast(message, options) {
        options = options || {};
        var region = document.getElementById("toast-region");
        if (!region) {
            region = document.createElement("div");
            region.id = "toast-region";
            region.className = "toast-region";
            region.setAttribute("role", "status");
            region.setAttribute("aria-live", "polite");
            document.body.appendChild(region);
        }

        var item = document.createElement("div");
        item.className = "toast toast-" + (options.kind || "success");

        var text = document.createElement("span");
        text.textContent = message;
        item.appendChild(text);

        function dismiss() {
            if (item.parentNode) { item.parentNode.removeChild(item); }
        }

        if (options.action) {
            var action;
            if (options.action.href) {
                action = document.createElement("a");
                action.href = options.action.href;
            } else {
                action = document.createElement("button");
                action.type = "button";
                action.addEventListener("click", function () {
                    options.action.onClick();
                    dismiss();
                });
            }
            action.className = "toast-action";
            action.textContent = options.action.label;
            item.appendChild(action);
        }

        region.appendChild(item);
        while (region.children.length > 3) { region.removeChild(region.firstChild); }
        window.setTimeout(dismiss, options.duration || 4000);
    }

    /* ---------- product card markup (shared by home + products) ---------- */

    function productCardHTML(product) {
        return '' +
            '<article class="product-card">' +
                '<button type="button" class="product-media" data-quick-view="' + product.id + '" aria-label="View details for ' + esc(product.name) + '">' +
                    '<img src="' + esc(product.image) + '" alt="" loading="lazy" width="480" height="360">' +
                '</button>' +
                '<div class="product-body">' +
                    '<span class="product-category">' + esc(categoryLabel(product.category)) + '</span>' +
                    '<h3 class="product-name">' + esc(product.name) + '</h3>' +
                    '<p class="product-price">' + formatPrice(product.price) + '</p>' +
                    '<button type="button" class="btn btn-primary btn-block" data-add-to-cart="' + product.id + '">Add to cart</button>' +
                '</div>' +
            '</article>';
    }

    /* ---------- quick view dialog ---------- */

    function getDialog() {
        var dialog = document.getElementById("quick-view");
        if (dialog) { return dialog; }

        dialog = document.createElement("dialog");
        dialog.id = "quick-view";
        dialog.className = "modal";
        dialog.setAttribute("aria-labelledby", "quick-view-title");
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) { dialog.close(); }
        });
        document.body.appendChild(dialog);
        return dialog;
    }

    function openQuickView(id) {
        var product = getProduct(id);
        if (!product) { return; }
        var dialog = getDialog();

        dialog.innerHTML = '' +
            '<div class="modal-grid">' +
                '<div class="modal-media"><img src="' + esc(product.image) + '" alt="' + esc(product.name) + '"></div>' +
                '<div class="modal-info">' +
                    '<span class="product-category">' + esc(categoryLabel(product.category)) + '</span>' +
                    '<h2 id="quick-view-title">' + esc(product.name) + '</h2>' +
                    '<p class="modal-price">' + formatPrice(product.price) + '</p>' +
                    '<p class="modal-desc">' + esc(product.description || "") + '</p>' +
                    '<p class="modal-note">' +
                        (product.price >= FREE_SHIPPING_MIN ? "Ships free." : "Free shipping on orders over " + formatPrice(FREE_SHIPPING_MIN) + ".") +
                    '</p>' +
                    '<div class="modal-actions">' +
                        '<button type="button" class="btn btn-primary" data-add-to-cart="' + product.id + '">Add to cart</button>' +
                        '<button type="button" class="btn btn-outline" data-close-dialog>Close</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        if (typeof dialog.showModal === "function") {
            if (!dialog.open) { dialog.showModal(); }
        } else {
            dialog.setAttribute("open", "");
        }
    }

    /* ---------- page-wide events ---------- */

    document.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || !target.closest) { return; }

        var addButton = target.closest("[data-add-to-cart]");
        if (addButton) {
            var product = getProduct(addButton.getAttribute("data-add-to-cart"));
            if (product && addToCart(product.id)) {
                toast(product.name + " added to cart.", {
                    action: { label: "View cart", href: "cart.html" }
                });
            }
            var openDialog = addButton.closest("dialog");
            if (openDialog && openDialog.close) { openDialog.close(); }
            return;
        }

        var quickView = target.closest("[data-quick-view]");
        if (quickView) {
            openQuickView(quickView.getAttribute("data-quick-view"));
            return;
        }

        var closeButton = target.closest("[data-close-dialog]");
        if (closeButton) {
            var parentDialog = closeButton.closest("dialog");
            if (parentDialog && parentDialog.close) { parentDialog.close(); }
        }
    });

    // Broken product images fall back to a neutral placeholder.
    document.addEventListener("error", function (event) {
        var img = event.target;
        if (img && img.tagName === "IMG" && !img.getAttribute("data-fallback")) {
            img.setAttribute("data-fallback", "1");
            img.src = PLACEHOLDER;
        }
    }, true);

    // Keep the cart badge right when another tab changes the cart.
    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY) {
            updateBadges(false);
            document.dispatchEvent(new CustomEvent("cart:change"));
        }
    });

    // Going Back to a page can show an old copy from the browser's cache.
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            updateBadges(false);
            document.dispatchEvent(new CustomEvent("cart:change"));
        }
    });

    function setupMenu() {
        var header = document.getElementById("site-header");
        var toggle = document.getElementById("nav-toggle");
        if (!header || !toggle) { return; }

        function setOpen(open) {
            header.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        }

        toggle.addEventListener("click", function () {
            setOpen(!header.classList.contains("open"));
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && header.classList.contains("open")) {
                setOpen(false);
                toggle.focus();
            }
        });
        Array.prototype.forEach.call(header.querySelectorAll(".site-nav a"), function (link) {
            link.addEventListener("click", function () { setOpen(false); });
        });
    }

    function init() {
        setupMenu();
        updateBadges(false);
        showFlash();
        Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (node) {
            node.textContent = new Date().getFullYear();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.Shop = {
        MAX_QTY: MAX_QTY,
        FREE_SHIPPING_MIN: FREE_SHIPPING_MIN,
        SHIPPING_FEE: SHIPPING_FEE,
        esc: esc,
        formatPrice: formatPrice,
        categoryLabel: categoryLabel,
        categories: categories,
        plural: plural,
        getProduct: getProduct,
        readCart: readCart,
        addToCart: addToCart,
        setQty: setQty,
        removeFromCart: removeFromCart,
        clearCart: clearCart,
        cartCount: cartCount,
        cartTotals: cartTotals,
        saveOrder: saveOrder,
        getOrders: getOrders,
        flash: flash,
        toast: toast,
        productCardHTML: productCardHTML
    };
})();
