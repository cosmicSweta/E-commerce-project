/* Small form helper: inline validation messages for checkout and contact */
(function () {
    "use strict";

    var validators = {
        name: function (value) {
            if (!value) { return "Enter your full name."; }
            if (!/^[\p{L}][\p{L}\p{M} .'-]{1,59}$/u.test(value)) { return "Use letters only, at least 2 characters."; }
            return "";
        },
        email: function (value) {
            if (!value) { return "Enter your email address."; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { return "Enter a valid email, like name@example.com."; }
            return "";
        },
        phone: function (value) {
            if (!value) { return "Enter your mobile number."; }
            if (!/^[6-9]\d{9}$/.test(normalizePhone(value))) { return "Enter a 10-digit Indian mobile number."; }
            return "";
        },
        address: function (value) {
            if (!value) { return "Enter your delivery address."; }
            if (value.length < 10) { return "Add more detail, like house number and street."; }
            return "";
        },
        city: function (value) {
            if (!value) { return "Enter your city."; }
            if (value.length < 2) { return "Enter a valid city name."; }
            return "";
        },
        pincode: function (value) {
            if (!value) { return "Enter your PIN code."; }
            if (!/^[1-9]\d{5}$/.test(value)) { return "Enter a valid 6-digit PIN code."; }
            return "";
        },
        password: function (value) {
            if (!value) { return "Create a password."; }
            if (value.length < 8) { return "Use at least 8 characters."; }
            if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) { return "Include at least one letter and one number."; }
            return "";
        },
        loginPassword: function (value) {
            return value ? "" : "Enter your password.";
        },
        confirm: function (value, form) {
            if (!value) { return "Enter your password again."; }
            if (value !== form.elements.password.value) { return "The passwords don\u2019t match."; }
            return "";
        },
        message: function (value) {
            if (!value) { return "Write a short message."; }
            if (value.length < 10) { return "Please write at least 10 characters."; }
            return "";
        }
    };

    function normalizePhone(value) {
        var digits = String(value).replace(/[\s-]/g, "");
        if (digits.indexOf("+91") === 0) { digits = digits.slice(3); }
        else if (digits.charAt(0) === "0") { digits = digits.slice(1); }
        return digits;
    }

    function showError(input, message) {
        var error = document.getElementById(input.name + "-error");
        input.setAttribute("aria-invalid", message ? "true" : "false");
        if (error) {
            error.textContent = message;
            error.hidden = !message;
        }
    }

    // rules: { fieldName: validatorFunction }
    function attach(form, rules, onValid) {
        var names = Object.keys(rules);

        // Passwords keep their spaces; everything else is trimmed.
        function read(input) {
            return input.type === "password" ? input.value : input.value.trim();
        }

        function check(name) {
            var input = form.elements[name];
            var message = rules[name](read(input), form);
            showError(input, message);
            return !message;
        }

        names.forEach(function (name) {
            var input = form.elements[name];
            input.addEventListener("blur", function () {
                if (read(input) !== "" || input.getAttribute("aria-invalid") === "true") { check(name); }
            });
            input.addEventListener("input", function () {
                if (input.getAttribute("aria-invalid") === "true") { check(name); }
            });
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var firstInvalid = null;
            names.forEach(function (name) {
                if (!check(name) && !firstInvalid) { firstInvalid = form.elements[name]; }
            });
            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }
            var values = {};
            names.forEach(function (name) { values[name] = read(form.elements[name]); });
            onValid(values);
        });
    }

    window.FormKit = { validators: validators, attach: attach, normalizePhone: normalizePhone };
})();
