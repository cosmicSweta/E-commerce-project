# E-Shop

A responsive e-commerce demo store built with plain HTML, CSS and JavaScript. No frameworks, no build step.

**Live demo:** https://cosmicsweta.github.io/Final-Project/

## Features

- Product catalogue with search, category filters and sorting (price, name). Filters are kept in the page URL, so a filtered view can be shared.
- Quick-view dialog with product details.
- Shopping cart saved in `localStorage` with quantity controls, undo on remove, and a free-shipping progress bar (free over ₹500, otherwise ₹49).
- Checkout form with inline validation (name, Indian mobile number, email, address, 6-digit PIN code) and an order confirmation screen.
- Register and log in. Checkout needs an account; the cart is kept while you sign up. Passwords are salted and hashed (PBKDF2) and never stored as plain text. The account page shows your details and your order history.
- Contact form with validation and a short FAQ.
- Mobile-first responsive layout with a collapsible menu.
- Accessibility: skip link, labelled form fields, visible keyboard focus, `aria-live` updates, reduced-motion support.

## Tech

HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript (ES5-style modules), `localStorage`.

## Project structure

```
index.html        Home page (categories + featured products)
products.html     Product listing with search, filters and sorting
cart.html         Cart with quantities and order summary
checkout.html     Validated checkout form + order confirmation (login required)
login.html  register.html  account.html   Demo accounts and order history
contact.html      Contact form + FAQ
style.css         All styles
data.js           Product data
common.js         Shared cart logic, toasts, menu, quick-view dialog
home.js  products.js  cart.js  checkout.js  contact.js  forms.js
auth.js           Demo accounts (register, log in, session)
login.js  register.js  account.js
images/           Product photos and banners (800x800 product images)
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

then visit http://localhost:8000.

## Notes

This is a demo store. There is no server, so accounts and orders are saved only in the visitor's own browser (localStorage). No payment is taken and the contact form does not send email. For real accounts you would add a backend such as Firebase, Supabase or Node.js.
