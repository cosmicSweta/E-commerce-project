/* Register page */
(function () {
    "use strict";

    var form = document.getElementById("register-form");
    var alertBox = document.getElementById("auth-error");
    var loginLink = document.getElementById("login-link");
    var next = Auth.nextFromUrl("");

    if (Auth.currentUser()) {
        window.location.replace(next || "account.html");
        return;
    }

    if (next && loginLink) { loginLink.href = "login.html?next=" + encodeURIComponent(next); }

    FormKit.attach(form, {
        name: FormKit.validators.name,
        email: FormKit.validators.email,
        password: FormKit.validators.password,
        confirm: FormKit.validators.confirm
    }, function (values) {
        var button = form.querySelector("button[type=submit]");
        button.disabled = true;
        alertBox.hidden = true;

        Auth.register(values.name, values.email, values.password).then(function (result) {
            if (!result.ok) {
                button.disabled = false;
                alertBox.textContent = result.error;
                alertBox.hidden = false;
                form.elements[result.field || "email"].focus();
                return;
            }
            Shop.flash("Welcome to E-Shop, " + result.user.name.split(" ")[0] + ". Your account is ready.");
            window.location.href = next || "index.html";
        });
    });
})();
