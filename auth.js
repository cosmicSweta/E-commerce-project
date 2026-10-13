/* =========================================================
   E-Shop demo accounts
   There is no server on GitHub Pages, so accounts live in this
   browser's localStorage. Passwords are never stored as text:
   they are salted and hashed (PBKDF2 where the browser allows).
   This is a learning project, not real account security.
   ========================================================= */
(function () {
    "use strict";

    var USERS_KEY = "users";
    var SESSION_KEY = "session";
    var ITERATIONS = 100000;
    var ALLOWED_NEXT = ["index.html", "products.html", "cart.html", "checkout.html", "contact.html", "account.html"];

    /* ---------- storage ---------- */

    function readUsers() {
        try {
            var list = JSON.parse(localStorage.getItem(USERS_KEY));
            return Array.isArray(list) ? list : [];
        } catch (error) {
            return [];
        }
    }

    function writeUsers(list) {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(list));
            return true;
        } catch (error) {
            return false;
        }
    }

    function normalizeEmail(email) {
        return String(email).trim().toLowerCase();
    }

    function findUser(email) {
        email = normalizeEmail(email);
        var users = readUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].email === email) { return users[i]; }
        }
        return null;
    }

    function publicUser(user) {
        return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    }

    function setSession(email) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ email: email }));
        } catch (error) { /* storage blocked */ }
    }

    function currentUser() {
        var email = null;
        try {
            var session = JSON.parse(localStorage.getItem(SESSION_KEY));
            email = session && session.email;
        } catch (error) {
            email = null;
        }
        if (!email) { return null; }
        var user = findUser(email);
        return user ? publicUser(user) : null;
    }

    function logout() {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (error) { /* storage blocked */ }
    }

    /* ---------- password hashing ---------- */

    function toHex(buffer) {
        var bytes = new Uint8Array(buffer);
        var out = "";
        for (var i = 0; i < bytes.length; i++) {
            out += ("0" + bytes[i].toString(16)).slice(-2);
        }
        return out;
    }

    function randomSalt() {
        var bytes = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (var i = 0; i < bytes.length; i++) { bytes[i] = Math.floor(Math.random() * 256); }
        }
        return toHex(bytes);
    }

    function hasSubtleCrypto() {
        return !!(window.crypto && window.crypto.subtle && window.TextEncoder);
    }

    // Fallback for browsers without Web Crypto (very old or insecure pages).
    function basicHash(text) {
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (var i = 0; i < text.length; i++) {
            var ch = text.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    }

    function hashPassword(password, salt, algo) {
        if (algo === "pbkdf2") {
            var encoder = new TextEncoder();
            return window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
                .then(function (key) {
                    return window.crypto.subtle.deriveBits(
                        { name: "PBKDF2", salt: encoder.encode(salt), iterations: ITERATIONS, hash: "SHA-256" },
                        key, 256
                    );
                })
                .then(toHex);
        }
        return Promise.resolve(basicHash(salt + ":" + password));
    }

    /* ---------- register and log in ---------- */

    function register(name, email, password) {
        email = normalizeEmail(email);
        if (findUser(email)) {
            return Promise.resolve({ ok: false, field: "email", error: "An account with this email already exists. Try logging in." });
        }

        var salt = randomSalt();
        var algo = hasSubtleCrypto() ? "pbkdf2" : "basic";

        return hashPassword(password, salt, algo).then(function (hash) {
            var user = {
                id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name: name,
                email: email,
                salt: salt,
                algo: algo,
                hash: hash,
                createdAt: new Date().toISOString()
            };
            var users = readUsers();
            users.push(user);
            if (!writeUsers(users)) {
                return { ok: false, error: "Your browser blocked saving the account. Check your privacy settings." };
            }
            setSession(user.email);
            return { ok: true, user: publicUser(user) };
        }).catch(function () {
            return { ok: false, error: "Something went wrong while creating the account. Please try again." };
        });
    }

    function login(email, password) {
        var wrong = { ok: false, error: "Incorrect email or password." };
        var user = findUser(email);
        if (!user) { return Promise.resolve(wrong); }

        if (user.algo === "pbkdf2" && !hasSubtleCrypto()) {
            return Promise.resolve({ ok: false, error: "This browser can\u2019t check that password. Try a different browser." });
        }

        return hashPassword(password, user.salt, user.algo).then(function (hash) {
            if (hash !== user.hash) { return wrong; }
            setSession(user.email);
            return { ok: true, user: publicUser(user) };
        }).catch(function () {
            return { ok: false, error: "Something went wrong while logging in. Please try again." };
        });
    }

    /* ---------- helpers for the pages ---------- */

    // Only allow redirects to this site's own pages.
    function safeNext(raw, fallback) {
        if (ALLOWED_NEXT.indexOf(raw) !== -1) { return raw; }
        return fallback === undefined ? "index.html" : fallback;
    }

    function nextFromUrl(fallback) {
        var params = new URLSearchParams(window.location.search);
        return safeNext(params.get("next"), fallback);
    }

    function updateNav() {
        var user = currentUser();
        Array.prototype.forEach.call(document.querySelectorAll("[data-logged-out]"), function (node) {
            node.hidden = !!user;
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-auth-link]"), function (link) {
            if (user) {
                var first = user.name.split(" ")[0];
                link.textContent = "Hi, " + (first.length > 14 ? first.slice(0, 14) + "\u2026" : first);
                link.setAttribute("href", "account.html");
            } else {
                link.textContent = "Log in";
                link.setAttribute("href", "login.html");
            }
        });
    }

    document.addEventListener("click", function (event) {
        var button = event.target && event.target.closest ? event.target.closest("[data-toggle-password]") : null;
        if (!button) { return; }
        var input = document.getElementById(button.getAttribute("data-toggle-password"));
        if (!input) { return; }
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        button.textContent = show ? "Hide" : "Show";
        button.setAttribute("aria-pressed", show ? "true" : "false");
        button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });

    window.addEventListener("storage", function (event) {
        if (event.key === SESSION_KEY || event.key === USERS_KEY) { updateNav(); }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", updateNav);
    } else {
        updateNav();
    }

    window.Auth = {
        register: register,
        login: login,
        logout: logout,
        currentUser: currentUser,
        safeNext: safeNext,
        nextFromUrl: nextFromUrl,
        updateNav: updateNav
    };
})();
