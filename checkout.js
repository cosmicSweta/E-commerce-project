/* Checkout page: validated delivery form and order confirmation */
(function () {
    "use strict";

    var layout = document.getElementById("checkout-layout");
    var emptyState = document.getElementById("checkout-empty");
    var gate = document.getElementById("checkout-gate");
    var confirmation = document.getElementById("confirmation");
    var summary = document.getElementById("checkout-summary");
    var form = document.getElementById("checkout-form");
    var subtitle = document.getElementById("checkout-subtitle");
    var placed = false;
    var prefilled = false;

    function summaryHTML(totals) {
        var rows = totals.lines.map(function (line) {
            return '' +
                '<li>' +
                    '<span class="summary-name">' + Shop.esc(line.product.name) + ' <span class="muted">\u00D7 ' + line.qty + '</span></span>' +
                    '<span>' + Shop.formatPrice(line.lineTotal) + '</span>' +
                '</li>';
        }).join("");

        return '' +
            '<h2>Your order</h2>' +
            '<ul class="summary-list">' + rows + '</ul>' +
            '<dl class="totals">' +
                '<div><dt>Subtotal</dt><dd>' + Shop.formatPrice(totals.subtotal) + '</dd></div>' +
                '<div><dt>Shipping</dt><dd>' + (totals.shipping === 0 ? 'Free' : Shop.formatPrice(totals.shipping)) + '</dd></div>' +
                '<div class="totals-final"><dt>Total</dt><dd>' + Shop.formatPrice(totals.total) + '</dd></div>' +
            '</dl>' +
            '<a class="link-button" href="cart.html">Edit cart</a>';
    }

    function render() {
        if (placed) { return; }
        var totals = Shop.cartTotals();
        var user = Auth.currentUser();
        var isEmpty = totals.lines.length === 0;

        emptyState.hidden = !isEmpty;
        gate.hidden = isEmpty || !!user;
        layout.hidden = isEmpty || !user;

        if (isEmpty) {
            subtitle.textContent = "Your cart is empty.";
        } else if (!user) {
            subtitle.textContent = "Log in to place your order.";
        } else {
            subtitle.textContent = "Enter your delivery details to place the order.";
            summary.innerHTML = summaryHTML(totals);
            if (!prefilled) {
                prefilled = true;
                if (!form.elements.name.value) { form.elements.name.value = user.name; }
                if (!form.elements.email.value) { form.elements.email.value = user.email; }
            }
        }
    }

    function makeOrderId() {
        var now = new Date();
        function pad(n) { return String(n).padStart(2, "0"); }
        var random = Math.floor(1000 + Math.random() * 9000);
        return "ES" + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + random;
    }

    function formatDay(offsetDays) {
        var date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }

    function showConfirmation(order) {
        var items = order.items.map(function (item) {
            return '<li><span>' + Shop.esc(item.name) + ' <span class="muted">\u00D7 ' + item.qty + '</span></span>' +
                '<span>' + Shop.formatPrice(item.price * item.qty) + '</span></li>';
        }).join("");

        confirmation.innerHTML = '' +
            '<div class="confirm-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
            '</div>' +
            '<h2 id="confirm-title" tabindex="-1">Thank you, ' + Shop.esc(order.customer.name.split(" ")[0]) + '. Your order is placed.</h2>' +
            '<p class="muted">Order number <strong>' + Shop.esc(order.id) + '</strong></p>' +
            '<div class="confirm-grid">' +
                '<div><h3>Delivery</h3><p>' + Shop.esc(order.customer.address) + '<br>' + Shop.esc(order.customer.city) + ' ' + Shop.esc(order.customer.pincode) + '</p>' +
                    '<p class="muted">Estimated delivery ' + formatDay(3) + ' to ' + formatDay(5) + '.</p></div>' +
                '<div><h3>Payment</h3><p>' + (order.payment === "upi" ? "UPI on delivery" : "Cash on delivery") + '</p>' +
                    '<p class="muted">You pay ' + Shop.formatPrice(order.total) + ' when it arrives.</p></div>' +
            '</div>' +
            '<ul class="summary-list">' + items + '</ul>' +
            '<p class="demo-note">This is a demo store. No payment is taken, and your order is saved only in this browser.</p>' +
            '<div class="confirm-actions">' +
                '<a class="btn btn-primary" href="products.html">Continue shopping</a>' +
                '<a class="btn btn-outline" href="account.html">View my orders</a>' +
            '</div>';

        confirmation.hidden = false;
        var title = document.getElementById("confirm-title");
        if (title) { title.focus(); }
    }

    FormKit.attach(form, {
        name: FormKit.validators.name,
        phone: FormKit.validators.phone,
        email: FormKit.validators.email,
        address: FormKit.validators.address,
        city: FormKit.validators.city,
        pincode: FormKit.validators.pincode
    }, function (values) {
        var totals = Shop.cartTotals();
        var user = Auth.currentUser();
        if (totals.lines.length === 0 || !user) { render(); return; }

        var payment = form.elements.payment.value || "cod";
        var order = {
            id: makeOrderId(),
            userEmail: user.email,
            date: new Date().toISOString(),
            items: totals.lines.map(function (line) {
                return { id: line.product.id, name: line.product.name, price: line.product.price, qty: line.qty };
            }),
            subtotal: totals.subtotal,
            shipping: totals.shipping,
            total: totals.total,
            payment: payment,
            customer: {
                name: values.name,
                phone: FormKit.normalizePhone(values.phone),
                email: values.email,
                address: values.address,
                city: values.city,
                pincode: values.pincode
            }
        };

        placed = true;
        Shop.saveOrder(order);
        Shop.clearCart();

        layout.hidden = true;
        emptyState.hidden = true;
        gate.hidden = true;
        subtitle.textContent = "We\u2019ve got your order.";
        showConfirmation(order);
    });

    document.addEventListener("cart:change", render);
    window.addEventListener("pageshow", function (event) { if (event.persisted) { render(); } });
    render();
})();
