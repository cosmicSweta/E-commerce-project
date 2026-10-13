/* Cart page: quantities, totals and free-shipping progress */
(function () {
    "use strict";

    // If common.js is missing (an old cart.html, or a file that was not uploaded), say so
    // on the page instead of leaving it blank.
    if (typeof Shop === "undefined") {
        var holder = document.querySelector("main") || document.body;
        holder.innerHTML = '<div class="container"><div class="card empty">' +
            '<h2>This page needs an update</h2>' +
            '<p>common.js did not load. Upload common.js next to cart.html, then refresh with Ctrl+F5.</p>' +
            '<a class="btn btn-primary" href="products.html">Browse products</a></div></div>';
        return;
    }

    // If an old copy of cart.html is cached, rebuild the page structure this script needs.
    function ensureStructure() {
        var ids = ["cart-items", "cart-summary", "cart-layout", "cart-empty", "cart-subtitle"];
        var complete = ids.every(function (id) { return document.getElementById(id); });
        if (complete) { return; }
        var holder = document.querySelector("main") || document.body;
        holder.innerHTML = '' +
            '<div class="container">' +
                '<div class="page-head"><h1>Your cart</h1><p id="cart-subtitle"></p></div>' +
                '<div class="cart-layout" id="cart-layout" hidden>' +
                    '<ul class="card cart-list" id="cart-items"></ul>' +
                    '<aside class="card summary" id="cart-summary"></aside>' +
                '</div>' +
                '<div class="card empty" id="cart-empty" hidden>' +
                    '<h2>Your cart is empty</h2><p>Add something you like and it will show up here.</p>' +
                    '<a class="btn btn-primary" href="products.html">Browse products</a>' +
                '</div>' +
            '</div>';
    }
    ensureStructure();

    var itemsContainer = document.getElementById("cart-items");
    var summaryContainer = document.getElementById("cart-summary");
    var layout = document.getElementById("cart-layout");
    var emptyState = document.getElementById("cart-empty");
    var subtitle = document.getElementById("cart-subtitle");

    function rowHTML(line) {
        var product = line.product;
        return '' +
            '<li class="cart-row" data-id="' + product.id + '">' +
                '<a class="cart-thumb" href="products.html?category=' + encodeURIComponent(product.category) + '" tabindex="-1" aria-hidden="true">' +
                    '<img src="' + Shop.esc(product.image) + '" alt="" loading="lazy">' +
                '</a>' +
                '<div class="cart-info">' +
                    '<h3>' + Shop.esc(product.name) + '</h3>' +
                    '<p class="muted">' + Shop.formatPrice(product.price) + ' each</p>' +
                    '<button type="button" class="link-button" data-remove="' + product.id + '">Remove</button>' +
                '</div>' +
                '<div class="cart-controls">' +
                    '<div class="stepper" role="group" aria-label="Quantity for ' + Shop.esc(product.name) + '">' +
                        '<button type="button" data-dec="' + product.id + '" aria-label="Decrease quantity">\u2212</button>' +
                        '<span aria-live="polite">' + line.qty + '</span>' +
                        '<button type="button" data-inc="' + product.id + '" aria-label="Increase quantity"' + (line.qty >= Shop.MAX_QTY ? ' disabled' : '') + '>+</button>' +
                    '</div>' +
                    '<p class="line-total">' + Shop.formatPrice(line.lineTotal) + '</p>' +
                '</div>' +
            '</li>';
    }

    function summaryHTML(totals) {
        var progress = Math.min(100, Math.round((totals.subtotal / Shop.FREE_SHIPPING_MIN) * 100));
        var unlocked = totals.freeShippingGap === 0;

        return '' +
            '<h2>Order summary</h2>' +
            '<div class="ship-progress' + (unlocked ? ' unlocked' : '') + '">' +
                '<p>' + (unlocked
                    ? 'You\u2019ve unlocked free shipping.'
                    : 'Add <strong>' + Shop.formatPrice(totals.freeShippingGap) + '</strong> more for free shipping.') + '</p>' +
                '<div class="bar" aria-hidden="true"><span style="width:' + progress + '%"></span></div>' +
            '</div>' +
            '<dl class="totals">' +
                '<div><dt>' + Shop.plural(totals.count, "item") + '</dt><dd>' + Shop.formatPrice(totals.subtotal) + '</dd></div>' +
                '<div><dt>Shipping</dt><dd>' + (totals.shipping === 0 ? 'Free' : Shop.formatPrice(totals.shipping)) + '</dd></div>' +
                '<div class="totals-final"><dt>Total</dt><dd>' + Shop.formatPrice(totals.total) + '</dd></div>' +
            '</dl>' +
            '<a class="btn btn-primary btn-block" href="checkout.html">Go to checkout</a>' +
            '<a class="btn btn-outline btn-block" href="products.html">Keep shopping</a>';
    }

    function render() {
        try {
            draw();
        } catch (error) {
            if (window.console) { console.error("Cart could not be drawn:", error); }
            layout.hidden = true;
            emptyState.hidden = true;
            subtitle.textContent = "We couldn\u2019t load your cart. Refresh the page and try again.";
        }
    }

    function draw() {
        var totals = Shop.cartTotals();
        var isEmpty = totals.lines.length === 0;

        layout.hidden = isEmpty;
        emptyState.hidden = !isEmpty;
        subtitle.textContent = isEmpty
            ? "Nothing here yet."
            : "Check your items and quantities before you pay.";

        if (isEmpty) { return; }
        itemsContainer.innerHTML = totals.lines.map(rowHTML).join("");
        summaryContainer.innerHTML = summaryHTML(totals);
    }

    function currentQty(id) {
        var found = 0;
        Shop.readCart().forEach(function (item) {
            if (item.id === id) { found = item.qty; }
        });
        return found;
    }

    itemsContainer.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button) { return; }

        var inc = button.getAttribute("data-inc");
        var dec = button.getAttribute("data-dec");
        var remove = button.getAttribute("data-remove");

        if (inc) {
            Shop.setQty(inc, currentQty(Number(inc)) + 1);
            keepFocus("inc", inc, "dec");
        } else if (dec) {
            var id = Number(dec);
            var qty = currentQty(id);
            if (qty <= 1) {
                removeWithUndo(id);
            } else {
                Shop.setQty(id, qty - 1);
                keepFocus("dec", dec, "inc");
            }
        } else if (remove) {
            removeWithUndo(Number(remove));
        }
    });

    // The list is redrawn after every change, so put keyboard focus back.
    function keepFocus(attr, id, fallbackAttr) {
        var next = itemsContainer.querySelector('[data-' + attr + '="' + id + '"]');
        if (!next || next.disabled) {
            next = itemsContainer.querySelector('[data-' + fallbackAttr + '="' + id + '"]');
        }
        if (next) { next.focus(); }
    }

    function removeWithUndo(id) {
        var product = Shop.getProduct(id);
        var qty = currentQty(id);
        Shop.removeFromCart(id);
        Shop.toast(product.name + " removed from cart.", {
            kind: "info",
            duration: 6000,
            action: {
                label: "Undo",
                onClick: function () { Shop.addToCart(id, qty); }
            }
        });
    }

    document.addEventListener("cart:change", render);
    window.addEventListener("pageshow", function (event) { if (event.persisted) { render(); } });
    render();
})();
