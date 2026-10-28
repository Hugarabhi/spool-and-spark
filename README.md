# Spool & Spark: static storefront

A plain HTML, CSS and vanilla JavaScript website for Spool & Spark. No framework, no build step.

## Pages
index.html (home, incl. How It Works and About sections), shop.html (catalogue with search,
category filter, sort), product.html?collection=diwali (Diwali collection),
product.html?slug=... (details, gallery, lightbox), cart.html (enquiry list),
custom-printing.html (custom request form), faq.html, contact.html, 404.html.

## Run locally
Open index.html in a browser, or from this folder run:
    python3 -m http.server 8000
then visit http://localhost:8000

## Configure before launch
Edit js/data.js only:
1. STORE_CONFIG.whatsappNumber: country code + number, digits only (no "+", spaces or dashes).
   The current value came from the live reference site. Verify it.
2. STORE_CONFIG.contactEmail and instagramUrl: verify.
3. PRODUCTS: replace placeholder descriptions, add material and dimensions (leave null to hide rows),
   and add real products. Prices stay null ("Price on request") unless you have verified prices.
4. CATEGORIES: names and descriptions.
5. Images: see assets/images/README.md.
6. Replace the placeholder announcement text in STORE_CONFIG.announcement, or set showAnnouncement to false.

## Deploy
GitHub Pages: push the folder contents to a repository and enable Pages from the branch root.
All links and asset paths are relative, so project subpaths (username.github.io/repo/) work.
Other static hosts (Netlify, Cloudflare Pages) also work with the folder as the site root.
Routes are real .html files, so direct links such as /shop.html work on every host.

## How the cart and checkout work
- The enquiry list is saved in localStorage (only product id and quantity, validated on load).
- Every product currently has a price on request, so the list is a quotation request, not a payment cart.
  Totals appear only for products with a numeric price, and the summary says totals are not final.
- "Send enquiry on WhatsApp" opens wa.me with a pre-filled message. The customer presses Send.
  Nothing is sent automatically, and the list is not cleared on click.
- Custom request and contact forms work the same way: they prepare a WhatsApp message or an email draft.
  No server receives customer data, and the site never claims a message was delivered.

## Known limitations
- No backend: orders, custom request uploads and contact messages are not stored centrally.
  Adding real submission needs a server, form service or WhatsApp Business API.
- No file uploads. Customers share a link to their model or reference images.
- Product and collection images are in assets/images. Missing images show labelled placeholders.
- Product descriptions, materials and dimensions are placeholders to be replaced.
- Quick-view is not implemented. The product page and Add buttons cover the same needs.
- Price filter and availability filter are not shown because no comparable numeric prices or stock data exist.
- Search is a dialog that matches names, descriptions, categories and tags. It does not search the full site.
- No sitemap.xml or robots.txt yet. Add them once the production domain is known.
- Canonical URLs are not set because the deployment URL is not yet known.
- Testing: the JavaScript passes syntax checks and all DOM hooks were checked against the pages.
  Interactive behaviour (drawer, dialogs, cart flows, WhatsApp links, reduced motion) still needs a browser pass.
