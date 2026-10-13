/* Home page: category tiles and featured products */
(function () {
    "use strict";

    var categoryGrid = document.getElementById("category-grid");
    var featuredGrid = document.getElementById("featured-grid");

    if (categoryGrid) {
        var tiles = Shop.categories().map(function (category) {
            return '' +
                '<a class="category-tile" href="products.html?category=' + encodeURIComponent(category.name) + '">' +
                    '<span class="category-thumb"><img src="' + Shop.esc(category.image) + '" alt="" loading="lazy"></span>' +
                    '<span class="category-text">' +
                        '<strong>' + Shop.esc(category.label) + '</strong>' +
                        '<span>' + Shop.plural(category.count, "item") + '</span>' +
                    '</span>' +
                '</a>';
        });

        tiles.push('' +
            '<a class="category-tile category-tile-all" href="products.html">' +
                '<span class="category-text">' +
                    '<strong>All products</strong>' +
                    '<span>' + Shop.plural(products.length, "item") + '</span>' +
                '</span>' +
            '</a>');

        categoryGrid.innerHTML = tiles.join("");
    }

    if (featuredGrid) {
        featuredGrid.innerHTML = products
            .filter(function (product) { return product.featured; })
            .map(Shop.productCardHTML)
            .join("");
    }
})();
