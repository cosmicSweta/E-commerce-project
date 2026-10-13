/* Products page: search, category filter and sorting */
(function () {
    "use strict";

    var grid = document.getElementById("products-container");
    var searchInput = document.getElementById("search-input");
    var sortSelect = document.getElementById("sort-select");
    var chipBar = document.getElementById("category-chips");
    var resultCount = document.getElementById("result-count");
    var emptyState = document.getElementById("empty-state");
    var emptyText = document.getElementById("empty-text");
    var resetButton = document.getElementById("reset-filters");

    var categories = Shop.categories();
    var state = { q: "", category: "All", sort: "featured" };

    /* ----- read the starting state from the URL (?category=Shoes&q=bag) ----- */
    (function readUrl() {
        var params = new URLSearchParams(window.location.search);
        var category = params.get("category");
        var valid = categories.some(function (item) { return item.name === category; });
        if (valid) { state.category = category; }
        state.q = (params.get("q") || "").trim();
        var sort = params.get("sort");
        if (["price-asc", "price-desc", "name-asc"].indexOf(sort) !== -1) { state.sort = sort; }
    })();

    function writeUrl() {
        var params = new URLSearchParams();
        if (state.category !== "All") { params.set("category", state.category); }
        if (state.q) { params.set("q", state.q); }
        if (state.sort !== "featured") { params.set("sort", state.sort); }
        var query = params.toString();
        try {
            history.replaceState(null, "", window.location.pathname + (query ? "?" + query : ""));
        } catch (error) { /* some browsers block this on file:// pages */ }
    }

    /* ----- category chips ----- */
    function renderChips() {
        var chips = [{ name: "All", label: "All", count: products.length }].concat(categories);
        chipBar.innerHTML = chips.map(function (chip) {
            var pressed = chip.name === state.category;
            return '<button type="button" class="chip" data-category="' + Shop.esc(chip.name) + '" aria-pressed="' + pressed + '">' +
                Shop.esc(chip.label) + ' <span class="chip-count">' + chip.count + '</span></button>';
        }).join("");
    }

    /* ----- filtering and sorting ----- */
    function getVisibleProducts() {
        var text = state.q.toLowerCase();
        var list = products.filter(function (product) {
            var inCategory = state.category === "All" || product.category === state.category;
            var matches = !text ||
                product.name.toLowerCase().indexOf(text) !== -1 ||
                Shop.categoryLabel(product.category).toLowerCase().indexOf(text) !== -1;
            return inCategory && matches;
        });

        if (state.sort === "price-asc") {
            list.sort(function (a, b) { return a.price - b.price; });
        } else if (state.sort === "price-desc") {
            list.sort(function (a, b) { return b.price - a.price; });
        } else if (state.sort === "name-asc") {
            list.sort(function (a, b) { return a.name.localeCompare(b.name); });
        }
        return list;
    }

    function describeResults(count) {
        var text = Shop.plural(count, "product");
        if (state.category !== "All") { text += " in " + Shop.categoryLabel(state.category); }
        if (state.q) { text += " matching \u201C" + state.q + "\u201D"; }
        return text;
    }

    function render() {
        var list = getVisibleProducts();

        grid.innerHTML = list.map(Shop.productCardHTML).join("");
        grid.hidden = list.length === 0;
        emptyState.hidden = list.length !== 0;
        resultCount.textContent = describeResults(list.length);

        if (list.length === 0) {
            emptyText.textContent = state.q
                ? "We couldn\u2019t find anything for \u201C" + state.q + "\u201D. Try a different word or clear the filters."
                : "There are no products in this category yet.";
        }
        writeUrl();
    }

    /* ----- events ----- */
    searchInput.value = state.q;
    sortSelect.value = state.sort;
    renderChips();
    render();

    searchInput.addEventListener("input", function () {
        state.q = searchInput.value.trim();
        render();
    });

    sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        render();
    });

    chipBar.addEventListener("click", function (event) {
        var chip = event.target.closest(".chip");
        if (!chip) { return; }
        state.category = chip.getAttribute("data-category");
        renderChips();
        render();
    });

    resetButton.addEventListener("click", function () {
        state.q = "";
        state.category = "All";
        state.sort = "featured";
        searchInput.value = "";
        sortSelect.value = "featured";
        renderChips();
        render();
        searchInput.focus();
    });
})();
