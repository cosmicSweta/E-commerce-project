/* Account page: profile and order history */
(function () {
    "use strict";

    var user = Auth.currentUser();

    // Not logged in: send the visitor to the login page and come back here.
    if (!user) {
        window.location.replace("login.html?next=account.html");
        return;
    }

    var view = document.getElementById("account-view");
    var greeting = document.getElementById("account-greeting");
    greeting.textContent = "Welcome back, " + user.name.split(" ")[0] + ".";

    function formatDate(iso) {
        var date = new Date(iso);
        if (isNaN(date.getTime())) { return ""; }
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }

    function orderHTML(order) {
        var items = order.items.map(function (item) {
            return '<li><span>' + Shop.esc(item.name) + ' <span class="muted">\u00D7 ' + item.qty + '</span></span>' +
                '<span>' + Shop.formatPrice(item.price * item.qty) + '</span></li>';
        }).join("");

        return '' +
            '<article class="card order-card">' +
                '<header class="order-head">' +
                    '<div><h3>Order ' + Shop.esc(order.id) + '</h3><p class="muted">' + formatDate(order.date) + '</p></div>' +
                    '<span class="status-pill">Placed</span>' +
                '</header>' +
                '<ul class="summary-list">' + items + '</ul>' +
                '<p class="order-total"><span>' + (order.payment === "upi" ? "UPI on delivery" : "Cash on delivery") + '</span>' +
                    '<strong>' + Shop.formatPrice(order.total) + '</strong></p>' +
            '</article>';
    }

    var orders = Shop.getOrders().filter(function (order) {
        return String(order.userEmail || "").toLowerCase() === user.email;
    });

    var ordersHTML = orders.length
        ? orders.map(orderHTML).join("")
        : '<div class="card empty">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>' +
              '<h2>No orders yet</h2><p>When you place an order it will show up here.</p>' +
              '<a class="btn btn-primary" href="products.html">Browse products</a></div>';

    view.innerHTML = '' +
        '<div class="account-grid">' +
            '<aside class="card profile-card" aria-labelledby="profile-title">' +
                '<h2 id="profile-title">Your details</h2>' +
                '<dl class="profile-list">' +
                    '<div><dt>Name</dt><dd>' + Shop.esc(user.name) + '</dd></div>' +
                    '<div><dt>Email</dt><dd>' + Shop.esc(user.email) + '</dd></div>' +
                    '<div><dt>Member since</dt><dd>' + formatDate(user.createdAt) + '</dd></div>' +
                '</dl>' +
                '<button type="button" class="btn btn-outline btn-block" id="logout-button">Log out</button>' +
            '</aside>' +
            '<section aria-labelledby="orders-title">' +
                '<h2 id="orders-title" class="orders-title">Your orders</h2>' +
                ordersHTML +
            '</section>' +
        '</div>';

    document.getElementById("logout-button").addEventListener("click", function () {
        Auth.logout();
        Shop.flash("You\u2019ve been logged out.", "info");
        window.location.href = "index.html";
    });
})();
