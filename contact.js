/* Contact page: validated message form (front-end demo, nothing is sent) */
(function () {
    "use strict";

    var form = document.getElementById("contact-form");
    var success = document.getElementById("contact-success");

    FormKit.attach(form, {
        name: FormKit.validators.name,
        email: FormKit.validators.email,
        message: FormKit.validators.message
    }, function (values) {
        success.textContent = "Thanks, " + values.name.split(" ")[0] + ". Your message has been received.";
        success.hidden = false;
        form.reset();
        success.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
})();
