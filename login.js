/* Login page */
(function () {
    "use strict";

    var form = document.getElementById("login-form");
    var alertBox = document.getElementById("auth-error");
    var registerLink = document.getElementById("register-link");
    var next = Auth.nextFromUrl("");

    // Already logged in: go straight on.
    if (Auth.currentUser()) {
        window.location.replace(next || "account.html");
        return;
    }

    // Keep the "next" page when switching to the register page.
    if (next && registerLink) { registerLink.href = "register.html?next=" + encodeURIComponent(next); }

    FormKit.attach(form, {
        email: FormKit.validators.email,
        password: FormKit.validators.loginPassword
    }, function (values) {
        var button = form.querySelector("button[type=submit]");
        button.disabled = true;
        alertBox.hidden = true;

        Auth.login(values.email, values.password).then(function (result) {
            if (!result.ok) {
                button.disabled = false;
                alertBox.textContent = result.error;
                alertBox.hidden = false;
                form.elements.password.focus();
                return;
            }
            Shop.flash("Welcome back, " + result.user.name.split(" ")[0] + ".");
            window.location.href = next || "index.html";
        });
    });
})();
