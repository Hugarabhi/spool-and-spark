/* Spool & Spark: application logic (vanilla ES2017+, no frameworks).
   Loaded after js/data.js. Each page sets <body data-page="..."> to choose
   which renderers run. */
(function () {
  "use strict";

  var C = window.STORE_CONFIG;
  var PRODUCTS = window.PRODUCTS || [];
  var CATEGORIES = window.CATEGORIES || [];
  var CART_KEY = "spoolspark.cart.v1";
  var MAX_QTY = 99;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[+\d\s()-]{7,20}$/;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = new Intl.NumberFormat(C.locale || "en-IN", {
    style: "currency", currency: C.currency || "INR", maximumFractionDigits: 0
  });

  /* ---------- DOM helpers (all user-visible text goes through textContent) ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function append(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(parent, c); }); return; }
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  function h(tag, attrs) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  }

  // Static, developer-controlled SVG paths only (never user content).
  function icon(path) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", "22");
    s.setAttribute("height", "22");
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "1.8");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", path);
    s.appendChild(p);
    return s;
  }
  var ICON_SEARCH = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.3-4.3";
  var ICON_BAG = "M6 7h12l-1 13H7L6 7Zm3 0V5a3 3 0 0 1 6 0v2";

  /* ---------- Catalogue helpers ---------- */
  function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0] || null; }
  function bySlug(slug) { return PRODUCTS.filter(function (p) { return p.slug === slug; })[0] || null; }
  function catName(slug) {
    var c = CATEGORIES.filter(function (x) { return x.slug === slug; })[0];
    return c ? c.name : "";
  }
  function isPriced(p) { return typeof p.price === "number" && isFinite(p.price) && p.price >= 0; }
  function priceLabel(p) { return isPriced(p) ? money.format(p.price) : "Price on request"; }
  function productUrl(p) { return "product.html?slug=" + encodeURIComponent(p.slug); }
  function haystack(p) {
    return [p.name, p.shortDescription, p.description, catName(p.category), (p.tags || []).join(" ")]
      .join(" ").toLowerCase();
  }

  /* ---------- WhatsApp and mail links ---------- */
  function waConfigured() {
    var n = String(C.whatsappNumber || "");
    return n.length > 0 && !/REPLACE/i.test(n) && /^\d{8,15}$/.test(n.replace(/\D/g, "")) && n.replace(/\D/g, "") === n;
  }
  function waUrl(message) {
    if (!waConfigured()) return null;
    return "https://wa.me/" + C.whatsappNumber + "?" + new URLSearchParams({ text: message }).toString();
  }
  function mailUrl(subject, body) {
    if (!C.contactEmail || /REPLACE/i.test(C.contactEmail)) return null;
    return "mailto:" + C.contactEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  /* Build a readable enquiry. lines: [{name, qty, priced, unit}] */
  function buildEnquiry(lines) {
    var out = ["Hello Spool & Spark,", "", "I would like to enquire about the following products:", ""];
    lines.forEach(function (l, i) {
      var tail = l.priced ? " (" + money.format(l.unit * l.qty) + ")" : " (quote requested)";
      out.push((i + 1) + ". " + l.name + " - Quantity: " + l.qty + tail);
    });
    var pricedLines = lines.filter(function (l) { return l.priced; });
    if (pricedLines.length) {
      var sum = pricedLines.reduce(function (s, l) { return s + l.unit * l.qty; }, 0);
      var hasQuote = lines.some(function (l) { return !l.priced; });
      out.push("");
      out.push("Subtotal of priced items: " + money.format(sum) + (hasQuote ? " (excludes items needing a quote)" : ""));
    }
    out.push("");
    out.push("Please confirm availability, pricing where applicable, delivery details, and the next steps.");
    out.push("");
    out.push("Thank you.");
    return out.join("\n");
  }

  /* ---------- Cart (localStorage; only product id and quantity are stored) ---------- */
  function sanitizeCart(raw) {
    if (!Array.isArray(raw)) return [];
    var seen = {};
    var out = [];
    raw.forEach(function (i) {
      if (!i || typeof i.id !== "string" || !byId(i.id) || seen[i.id]) return;
      var q = Number(i.qty);
      if (!Number.isInteger(q) || q < 1 || q > MAX_QTY) return;
      seen[i.id] = true;
      out.push({ id: i.id, qty: q });
    });
    return out;
  }
  function loadCart() {
    try { return sanitizeCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); }
    catch (e) { return []; }
  }
  var cart = loadCart();
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable: cart still works for this visit */ }
  }
  function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function cartLines() {
    return cart.map(function (i) { return { item: i, p: byId(i.id) }; }).filter(function (x) { return x.p; });
  }
  function notifyCart() {
    saveCart();
    updateBadges();
    window.dispatchEvent(new CustomEvent("cart:changed"));
  }
  function addToCart(id, qty) {
    var found = cart.filter(function (i) { return i.id === id; })[0];
    if (found) found.qty = Math.min(MAX_QTY, found.qty + qty);
    else cart.push({ id: id, qty: Math.min(MAX_QTY, qty) });
    notifyCart();
  }
  function setQty(id, qty) {
    var found = cart.filter(function (i) { return i.id === id; })[0];
    if (!found) return;
    found.qty = Math.max(1, Math.min(MAX_QTY, qty));
    notifyCart();
  }
  function removeFromCart(id) {
    var idx = -1;
    cart.forEach(function (i, n) { if (i.id === id) idx = n; });
    if (idx < 0) return null;
    var removed = cart.splice(idx, 1)[0];
    notifyCart();
    return removed;
  }
  function updateBadges() {
    var n = cartCount();
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
    });
    $$("[data-cart-link]").forEach(function (a) {
      a.setAttribute("aria-label", "Enquiry list, " + n + (n === 1 ? " item" : " items"));
    });
  }

  /* ---------- Toasts (announced through the aria-live region) ---------- */
  function toast(message, opts) {
    opts = opts || {};
    var region = $("#toast-region");
    if (!region) return;
    var t = h("div", { class: "toast" },
      h("span", { text: message }),
      opts.actionLabel ? h("button", {
        class: "toast-action", type: "button", text: opts.actionLabel,
        onclick: function () { if (opts.onAction) opts.onAction(); t.remove(); }
      }) : null,
      h("button", {
        class: "toast-close", type: "button", "aria-label": "Dismiss notification", text: "×",
        onclick: function () { t.remove(); }
      })
    );
    region.appendChild(t);
    setTimeout(function () { t.remove(); }, opts.actionLabel ? 8000 : 4000);
  }

  /* ---------- Header, navigation, footer ---------- */
  function setDropdown(btn, list, open) {
    btn.setAttribute("aria-expanded", String(open));
    list.hidden = !open;
  }

  function renderHeader() {
    var mount = $("#site-header");
    if (!mount) return;
    var here = location.pathname.split("/").pop() || "index.html";

    function navLink(href, label) {
      var isCurrent = href.split("#")[0] === here;
      return h("a", { class: "nav-link", href: href, "aria-current": isCurrent ? "page" : null, text: label });
    }

    var catId = "cat-menu";
    var catBtn = h("button", { class: "nav-link", type: "button", "aria-expanded": "false", "aria-controls": catId, text: "Categories ▾" });
    var catList = h("ul", { id: catId, class: "dropdown", hidden: true },
      CATEGORIES.map(function (c) {
        var href = c.slug === "diwali-collection"
          ? "product.html?collection=diwali"
          : "shop.html?cat=" + encodeURIComponent(c.slug);
        return h("li", null, h("a", { href: href, text: c.name }));
      }));
    catBtn.addEventListener("click", function () {
      setDropdown(catBtn, catList, catBtn.getAttribute("aria-expanded") !== "true");
    });

    var navId = "primary-nav";
    var nav = h("nav", { id: navId, class: "primary-nav", "aria-label": "Main" },
      h("ul", { class: "nav-list" },
        h("li", null, navLink("shop.html", "Shop All")),
        h("li", { class: "has-dropdown" }, catBtn, catList),
        h("li", null, navLink("custom-printing.html", "Custom Printing")),
        h("li", null, navLink("index.html#how-it-works", "How It Works")),
        h("li", null, navLink("index.html#about", "About")),
        h("li", null, navLink("faq.html", "FAQs")),
        h("li", null, navLink("contact.html", "Contact"))
      ));

    var menuBtn = h("button", {
      class: "menu-toggle", type: "button", "aria-expanded": "false",
      "aria-controls": navId, "aria-label": "Open menu"
    }, h("span", { class: "bars", "aria-hidden": "true" }));

    function setMenu(open) {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    }
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    var searchBtn = h("button", {
      class: "icon-btn", type: "button", "aria-label": "Search products", "aria-haspopup": "dialog",
      onclick: openSearch
    }, icon(ICON_SEARCH));

    var cartLink = h("a", { class: "icon-btn", href: "cart.html", "data-cart-link": "", "aria-label": "Enquiry list" },
      icon(ICON_BAG),
      h("span", { class: "badge", "data-cart-count": "", hidden: true, text: "0" }));

    var header = h("header", { class: "site-header" },
      h("div", { class: "container header-inner" },
        h("a", { class: "wordmark", href: "index.html", "aria-label": C.brandName + " home" },
          h("img", { class: "brand-logo", src: "assets/images/logo.png", alt: "", width: "48", height: "48" }),
          h("span", { class: "wordmark-divider", "aria-hidden": "true" }),
          h("span", { class: "wordmark-name", text: C.brandName })),
        nav,
        h("div", { class: "header-actions" }, searchBtn, cartLink, menuBtn)));

    if (C.showAnnouncement && C.announcement) {
      mount.appendChild(h("div", { class: "announcement", text: C.announcement }));
    }
    mount.appendChild(header);

    window.addEventListener("scroll", function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (catBtn.getAttribute("aria-expanded") === "true") {
        setDropdown(catBtn, catList, false);
        catBtn.focus();
      }
      if (menuBtn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuBtn.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (catBtn.getAttribute("aria-expanded") === "true" && !catBtn.parentNode.contains(e.target)) {
        setDropdown(catBtn, catList, false);
      }
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", function (ev) {
      if (ev.matches) setMenu(false);
    });
  }

  function renderFooter() {
    var mount = $("#site-footer");
    if (!mount) return;
    var shopLinks = [["shop.html", "Shop All"]].concat(CATEGORIES.map(function (c) {
      var href = c.slug === "diwali-collection"
        ? "product.html?collection=diwali"
        : "shop.html?cat=" + encodeURIComponent(c.slug);
      return [href, c.name];
    })).concat([["custom-printing.html", "Custom 3D Printing"]]);

    mount.appendChild(h("footer", { class: "site-footer" },
      h("div", { class: "container footer-grid" },
        h("div", null,
          h("a", { class: "wordmark wordmark--light footer-brand", href: "index.html", "aria-label": C.brandName + " home" },
            h("img", { class: "brand-logo", src: "assets/images/logo.png", alt: "", width: "48", height: "48" }),
            h("span", { class: "wordmark-divider", "aria-hidden": "true" }),
            h("span", { class: "wordmark-name", text: C.brandName })),
          h("p", { text: C.tagline + " Custom 3D prints made in India." })),
        h("nav", { "aria-label": "Shop links" },
          h("h2", { text: "Shop" }),
          h("ul", null, shopLinks.map(function (l) { return h("li", null, h("a", { href: l[0], text: l[1] })); }))),
        h("nav", { "aria-label": "Company links" },
          h("h2", { text: "Help" }),
          h("ul", null,
            h("li", null, h("a", { href: "index.html#about", text: "About" })),
            h("li", null, h("a", { href: "faq.html", text: "FAQs" })),
            h("li", null, h("a", { href: "contact.html", text: "Contact" })))),
        h("div", null,
          h("h2", { text: "Get in touch" }),
          h("ul", null,
            h("li", null, h("a", { href: "#", "data-wa-link": "", "data-wa-text": "Hello Spool & Spark!", text: "WhatsApp us" })),
            C.contactEmail ? h("li", null, h("a", { href: "mailto:" + C.contactEmail, text: C.contactEmail })) : null,
            C.instagramUrl ? h("li", null, h("a", { href: C.instagramUrl, target: "_blank", rel: "noopener", text: "Instagram" })) : null,
            h("li", { class: "muted", text: C.location })))),
      h("p", { class: "container footer-copy", text: "© " + new Date().getFullYear() + " " + C.brandName })
    ));
  }

  /* Wire WhatsApp / mail links once config is known. Disabled cleanly if unset. */
  function wireContactLinks() {
    $$("[data-wa-link]").forEach(function (a) {
      var url = waUrl(a.getAttribute("data-wa-text") || "Hello Spool & Spark!");
      if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
      else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.classList.add("is-disabled"); a.title = "WhatsApp is not configured yet."; }
    });
    $$("[data-mail-link]").forEach(function (a) {
      var url = mailUrl("Enquiry", "Hello Spool & Spark,\n\n");
      if (url) { a.href = url; }
      else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.classList.add("is-disabled"); a.title = "No email address is configured yet."; }
    });
  }

  /* ---------- Search dialog ---------- */
  var searchDialog = null;
  function buildSearch() {
    searchDialog = h("dialog", { class: "search-dialog", id: "search-dialog", "aria-labelledby": "search-title" });
    var input = h("input", { type: "search", id: "search-input", placeholder: "Search keychains, idols, toys…", "aria-label": "Search products", autocomplete: "off" });
    var list = h("ul", { class: "search-results", id: "search-results" });
    var empty = h("p", { class: "muted", hidden: true, text: "No products match that search. Try another word or browse the shop." });
    var form = h("form", {
      class: "search-form", role: "search",
      onsubmit: function (e) {
        e.preventDefault();
        var first = list.querySelector("a");
        if (first) location.href = first.getAttribute("href");
      }
    }, input, h("button", { class: "btn btn--primary", type: "submit", text: "Search" }));

    function render() {
      var q = input.value.trim().toLowerCase();
      list.replaceChildren();
      if (!q) { empty.hidden = true; return; }
      var matches = PRODUCTS.filter(function (p) { return haystack(p).indexOf(q) > -1; });
      matches.slice(0, 8).forEach(function (p) {
        list.appendChild(h("li", null, h("a", { href: productUrl(p) },
          h("strong", { text: p.name }),
          h("span", { class: "muted", text: " · " + catName(p.category) }))));
      });
      empty.hidden = matches.length > 0;
    }
    input.addEventListener("input", render);

    searchDialog.append(
      h("div", { class: "search-head" },
        h("h2", { id: "search-title", text: "Search products" }),
        h("button", { class: "icon-btn", type: "button", "aria-label": "Close search", text: "×", onclick: function () { searchDialog.close(); } })),
      form, list, empty);
    searchDialog.addEventListener("close", function () { document.body.classList.remove("menu-open"); });
    document.body.appendChild(searchDialog);
  }
  function openSearch() {
    if (!searchDialog || typeof searchDialog.showModal !== "function") { location.href = "shop.html"; return; }
    document.body.classList.add("menu-open");
    searchDialog.showModal();
    var input = $("#search-input");
    if (input) { input.value = ""; input.focus(); }
  }

  /* ---------- Product cards ---------- */
  function productImg(p, src, alt) {
    var img = h("img", {
      src: src || p.image, alt: alt || p.alt || p.name,
      loading: "lazy", decoding: "async",
      class: p.category === "diwali-collection" ? "product-img--contain" : null
    });
    img.addEventListener("error", function () {
      img.replaceWith(h("div", { class: "img-fallback", role: "img", "aria-label": alt || p.alt || p.name }, p.name));
    });
    return img;
  }

  function productCard(p) {
    var priced = isPriced(p);
    var diwaliCard = p.category === "diwali-collection";
    return h("article", { class: "product-card" + (diwaliCard ? " product-card--diwali" : ""), "data-reveal": "" },
      h("a", { class: "card-media", href: productUrl(p), tabindex: "-1" }, productImg(p)),
      h("div", { class: "card-body" },
        p.featured ? h("span", { class: "tag-featured", text: "Featured" }) : null,
        h("p", { class: "eyebrow", style: "margin:0", text: catName(p.category) }),
        h("h3", { class: "card-title" }, h("a", { href: productUrl(p), text: p.name })),
        p.shortDescription ? h("p", { class: "card-description", text: p.shortDescription }) : null,
        h("p", { class: priced ? "price" : "price price--quote", text: priceLabel(p) }),
        h("div", { class: "card-actions" },
          h("a", { class: "btn btn--dark", href: productUrl(p), text: "View details" }),
          h("button", {
            class: "btn btn--ghost", type: "button", style: "color:var(--color-ink)",
            "data-action": "quick-add", "data-id": p.id,
            "aria-label": (priced ? "Add " : "Add to enquiry list: ") + p.name,
            text: priced ? "Add to cart" : "Add to enquiry"
          }))));
  }

  /* ---------- Home page ---------- */
  function renderHome() {
    var catGrid = $("#category-grid");
    if (catGrid) {
      CATEGORIES.forEach(function (c) {
        var items = PRODUCTS.filter(function (p) { return p.category === c.slug; });
        var sample = items[0];
        var categoryUrl = c.slug === "diwali-collection"
          ? "product.html?collection=diwali"
          : "shop.html?cat=" + encodeURIComponent(c.slug);
        catGrid.appendChild(h("a", { class: "cat-card", href: categoryUrl, "data-reveal": "" },
          h("div", { class: "cat-media" }, sample ? productImg(sample) : null),
          h("div", { class: "cat-body" },
            h("h3", { text: c.name }),
            h("p", { text: c.description }),
            h("p", { class: "cat-count", text: items.length + (items.length === 1 ? " product" : " products") }))));
      });
    }
    var featuredGrid = $("#featured-grid");
    if (featuredGrid) {
      PRODUCTS.filter(function (p) { return p.featured; }).slice(0, 6).forEach(function (p) {
        featuredGrid.appendChild(productCard(p));
      });
    }
  }

  function initReviewsCarousel() {
    var viewport = $(".reviews-grid");
    var toggle = $(".reviews-toggle");
    if (!viewport || !toggle) return;

    if (reducedMotion) {
      viewport.classList.add("reviews-grid--static");
      toggle.hidden = true;
      return;
    }

    var cards = Array.prototype.slice.call(viewport.children);
    if (cards.length < 2) {
      toggle.hidden = true;
      return;
    }

    var track = h("div", { class: "reviews-track" });
    var group = h("div", { class: "reviews-group" }, cards);
    var duplicate = group.cloneNode(true);
    duplicate.classList.add("reviews-group--duplicate");
    duplicate.setAttribute("aria-hidden", "true");
    track.append(group, duplicate);
    viewport.replaceChildren(track);

    toggle.addEventListener("click", function () {
      var paused = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.textContent = paused ? "Resume reviews" : "Pause reviews";
      viewport.classList.toggle("is-paused", paused);
    });
  }

  /* ---------- Shop page ---------- */
  function comparator(sort) {
    return function (a, b) {
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "price-asc" || sort === "price-desc") {
        var pa = isPriced(a), pb = isPriced(b);
        if (pa !== pb) return pa ? -1 : 1;          // priced items first; price-on-request at the end
        if (!pa) return a.name.localeCompare(b.name);
        return sort === "price-asc" ? a.price - b.price : b.price - a.price;
      }
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;  // featured
      return a.name.localeCompare(b.name);
    };
  }

  function renderShop() {
    var grid = $("#product-grid");
    if (!grid) return;
    var qEl = $("#q"), catEl = $("#cat"), sortEl = $("#sort");
    var countEl = $("#result-count"), empty = $("#empty-state"), emptyText = $("#empty-text");
    var clearBtn = $("#clear-filters");
    var params = new URLSearchParams(location.search);

    CATEGORIES.forEach(function (c) { catEl.appendChild(h("option", { value: c.slug, text: c.name })); });
    qEl.value = params.get("q") || "";
    catEl.value = CATEGORIES.some(function (c) { return c.slug === params.get("cat"); }) ? params.get("cat") : "";
    var validSorts = ["featured", "name-asc", "name-desc", "price-asc", "price-desc"];
    sortEl.value = validSorts.indexOf(params.get("sort")) > -1 ? params.get("sort") : "featured";

    function apply() {
      var q = qEl.value.trim().toLowerCase();
      var cat = catEl.value;
      var sort = sortEl.value;
      var list = PRODUCTS.filter(function (p) {
        return (!cat || p.category === cat) && (!q || haystack(p).indexOf(q) > -1);
      }).sort(comparator(sort));

      grid.replaceChildren();
      list.forEach(function (p) { grid.appendChild(productCard(p)); });

      countEl.textContent = "Showing " + list.length + " of " + PRODUCTS.length + " products";
      empty.hidden = list.length > 0;
      if (list.length === 0) {
        emptyText.textContent = q
          ? "No products match \u201C" + qEl.value.trim() + "\u201D" + (cat ? " in " + catName(cat) : "") + "."
          : "There are no products in this category yet.";
      }

      var params2 = new URLSearchParams();
      if (q) params2.set("q", qEl.value.trim());
      if (cat) params2.set("cat", cat);
      if (sort !== "featured") params2.set("sort", sort);
      var qs = params2.toString();
      history.replaceState(null, "", "shop.html" + (qs ? "?" + qs : ""));

      var pageTitle = cat ? catName(cat) : "Shop All";
      document.title = pageTitle + " · " + C.brandName;
      var heading = $("#shop-heading");
      if (heading) heading.textContent = pageTitle;
      setReveal(grid);
    }

    function clearAll() {
      qEl.value = ""; catEl.value = ""; sortEl.value = "featured";
      apply();
      qEl.focus();
    }

    qEl.addEventListener("input", apply);
    catEl.addEventListener("change", apply);
    sortEl.addEventListener("change", apply);
    clearBtn.addEventListener("click", clearAll);
    $("#shop-form").addEventListener("submit", function (e) { e.preventDefault(); apply(); });
    apply();
  }

  /* ---------- Product detail page ---------- */
  function renderDiwaliCollection(root) {
    var category = CATEGORIES.filter(function (c) { return c.slug === "diwali-collection"; })[0];
    var products = PRODUCTS.filter(function (p) { return p.category === "diwali-collection"; });
    document.title = "Diwali Collection · " + C.brandName;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Explore festive 3D-printed diyas, lotus lights, tea light holders, mandala decor and lanterns from Spool & Spark.");
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Diwali Collection · " + C.brandName);
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", "Browse festive 3D-printed diyas, lotus lights, tea light holders, mandala decor and lanterns from " + C.brandName + ".");

    root.replaceChildren(
      h("div", { class: "container collection-page" },
        h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" },
          h("ol", null,
            h("li", null, h("a", { href: "index.html", text: "Home" })),
            h("li", null, h("a", { href: "shop.html", text: "Shop" })),
            h("li", { "aria-current": "page", text: category ? category.name : "Diwali Collection" }))),
        h("header", { class: "collection-heading" },
          h("p", { class: "eyebrow", text: "A festive edit" }),
          h("h1", { text: category ? category.name : "Diwali Collection" }),
          h("p", { class: "lead", text: "Bring a little extra glow to your celebrations with lotus lights, diyas, tea light holders, a mandala and a patterned lantern. Prices and options are confirmed when you enquire." }),
          h("a", { class: "btn btn--dark", href: "shop.html?cat=diwali-collection", text: "View in the shop" })),
        h("section", { class: "collection-products", "aria-labelledby": "collection-products-title" },
          h("h2", { id: "collection-products-title", class: "sr-only", text: "Diwali collection products" }),
          h("div", { class: "product-grid" }, products.map(productCard)))));
    setReveal(root);
  }

  function renderProduct() {
    var root = $("#product-root");
    if (!root) return;
    var params = new URLSearchParams(location.search);
    if (params.get("collection") === "diwali") {
      renderDiwaliCollection(root);
      return;
    }
    var slug = params.get("slug");
    var p = slug ? bySlug(slug) : null;

    if (!p) {
      document.title = "Product not found · " + C.brandName;
      root.replaceChildren(h("div", { class: "container narrow", style: "padding:4rem 0" },
        h("h1", { text: "Product not found" }),
        h("p", { class: "lead", text: "This product may have moved or is no longer listed." }),
        h("a", { class: "btn btn--primary", href: "shop.html", text: "Browse the shop" })));
      return;
    }

    document.title = p.name + " · " + C.brandName;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", p.shortDescription);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", p.name + " · " + C.brandName);
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", p.shortDescription);

    var images = (p.gallery && p.gallery.length) ? p.gallery : [p.image];
    var current = 0;
    var priced = isPriced(p);

    var mainBtn = h("button", { class: "gallery-main", type: "button", "aria-label": "Open image viewer for " + p.name });
    var thumbsWrap = h("div", { class: "thumbs" });
    var qtyInput = h("input", { type: "number", id: "pdp-qty", min: "1", max: String(MAX_QTY), value: "1", "aria-label": "Quantity", inputmode: "numeric" });

    function showImage(idx) {
      current = (idx + images.length) % images.length;
      mainBtn.replaceChildren(productImg(p, images[current], p.alt || p.name));
      $$(".thumb", thumbsWrap).forEach(function (t, n) { t.setAttribute("aria-pressed", String(n === current)); });
      if (lb.open) renderLightbox();
    }

    images.forEach(function (src, n) {
      thumbsWrap.appendChild(h("button", {
        class: "thumb", type: "button", "aria-label": "Show image " + (n + 1) + " of " + images.length,
        "aria-pressed": n === 0 ? "true" : "false",
        onclick: function () { showImage(n); }
      }, h("img", { src: src, alt: "", loading: "lazy" })));
    });
    if (images.length < 2) thumbsWrap.hidden = true;

    /* Lightbox: image, controls and counter all live inside one positioned box */
    var lbImgSlot = h("div", { class: "lb-slot" });
    var lbCount = h("span", { class: "lb-count", "aria-live": "polite" });
    var lbInner = h("div", { class: "lightbox-inner" },
      lbImgSlot,
      h("button", { class: "lb-close", type: "button", "aria-label": "Close image viewer", text: "×", onclick: function () { lb.close(); } }),
      h("button", { class: "lb-btn lb-prev", type: "button", "aria-label": "Previous image", text: "‹", onclick: function () { showImage(current - 1); } }),
      h("button", { class: "lb-btn lb-next", type: "button", "aria-label": "Next image", text: "›", onclick: function () { showImage(current + 1); } }),
      lbCount);
    var lb = h("dialog", { class: "lightbox", "aria-label": "Product image viewer" }, lbInner);
    function renderLightbox() {
      lbImgSlot.replaceChildren(productImg(p, images[current], p.alt || p.name));
      lbCount.textContent = (current + 1) + " / " + images.length;
      lb.querySelector(".lb-prev").hidden = images.length < 2;
      lb.querySelector(".lb-next").hidden = images.length < 2;
    }
    mainBtn.addEventListener("click", function () {
      renderLightbox();
      lb.showModal();
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    document.body.appendChild(lb);

    function readQty() {
      var n = parseInt(qtyInput.value, 10);
      if (!Number.isInteger(n) || n < 1) n = 1;
      if (n > MAX_QTY) n = MAX_QTY;
      qtyInput.value = String(n);
      return n;
    }
    var qtyBtns = [
      h("button", { type: "button", "aria-label": "Decrease quantity", text: "−", onclick: function () { qtyInput.value = String(Math.max(1, readQty() - 1)); } }),
      qtyInput,
      h("button", { type: "button", "aria-label": "Increase quantity", text: "+", onclick: function () { qtyInput.value = String(Math.min(MAX_QTY, readQty() + 1)); } })
    ];

    var waBtn = h("button", {
      class: "btn btn--whatsapp", type: "button",
      onclick: function () {
        var url = waUrl(buildEnquiry([{ name: p.name, qty: readQty(), priced: priced, unit: p.price }]));
        if (!url) { toast("WhatsApp is not configured yet. Please use the contact page."); return; }
        window.open(url, "_blank", "noopener");
      }
    }, "Enquire on WhatsApp");

    var actionBtn = h("button", {
      class: "btn btn--primary", type: "button",
      "data-action": "pdp-add", text: priced ? "Add to cart" : "Add to enquiry list"
    });
    actionBtn.addEventListener("click", function () {
      var qty = readQty();
      addToCart(p.id, qty);
      toast(qty + " × " + p.name + " added.", { actionLabel: "View list", onAction: function () { location.href = "cart.html"; } });
    });

    var related = PRODUCTS.filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 4);

    root.replaceChildren(
      h("div", { class: "container" },
        h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" },
          h("ol", null,
            h("li", null, h("a", { href: "index.html", text: "Home" })),
            h("li", null, h("a", { href: "shop.html", text: "Shop" })),
            h("li", null, h("a", { href: "shop.html?cat=" + encodeURIComponent(p.category), text: catName(p.category) })),
            h("li", { "aria-current": "page", text: p.name }))),
        h("div", { class: "pdp" },
          h("div", null, mainBtn, thumbsWrap),
          h("div", { class: "pdp-info" },
            h("p", { class: "eyebrow", text: catName(p.category) }),
            h("h1", { text: p.name }),
            h("p", { class: priced ? "price" : "price price--quote", style: "font-size:1.25rem", text: priceLabel(p) }),
            !priced ? h("p", { class: "notice", text: "Price on request. We quote after reviewing your choice and quantity." }) : null,
            h("p", { text: p.description }),
            (p.material || p.dimensions || p.customizationAvailable) ? h("dl", null,
              p.material ? h("dt", { text: "Material" }) : null,
              p.material ? h("dd", { text: p.material }) : null,
              p.dimensions ? h("dt", { text: "Dimensions" }) : null,
              p.dimensions ? h("dd", { text: p.dimensions }) : null,
              p.customizationAvailable ? h("dt", { text: "Customisation" }) : null,
              p.customizationAvailable ? h("dd", { text: "Available on request. Tell us your details." }) : null
            ) : null,
            h("div", { class: "qty-row" },
              h("span", { class: "sr-only", id: "qty-label", text: "Quantity" }),
              h("div", { class: "qty", role: "group", "aria-labelledby": "qty-label" }, qtyBtns)),
            h("div", { class: "pdp-actions" }, actionBtn, waBtn),
            h("p", { class: "notice", style: "margin-top:1rem", text: "Delivery and shipping details are confirmed when you contact us." }),
            !waConfigured() ? h("p", { class: "status status--warn", role: "status", text: "WhatsApp is not configured yet. Set the number in js/data.js." }) : null)),
        related.length ? h("section", { class: "related", "aria-labelledby": "related-h" },
          h("h2", { id: "related-h", class: "h-small", style: "font-size:1.5rem", text: "More from " + catName(p.category) }),
          h("div", { class: "product-grid" }, related.map(productCard))) : null));

    /* Initialise gallery state after the DOM exists */
    showImage(0);
    setReveal(root);
  }

  /* ---------- Enquiry list / cart page ---------- */
  function renderCartPage() {
    var root = $("#cart-root");
    if (!root) return;
    var lines = cartLines();
    root.replaceChildren();

    if (!lines.length) {
      document.title = "Enquiry list · " + C.brandName;
      root.appendChild(h("div", { class: "empty-state" },
        h("h2", { class: "h-small", text: "Your enquiry list is empty" }),
        h("p", { class: "muted", text: "Add products you are interested in, then send the list to us on WhatsApp." }),
        h("a", { class: "btn btn--primary", href: "shop.html", text: "Browse the shop" })));
      return;
    }

    var list = h("ul", { class: "cart-list" });
    lines.forEach(function (x) {
      var p = x.p, qty = x.item.qty, pr = isPriced(p);
      list.appendChild(h("li", { class: "cart-line" },
        h("a", { class: "cart-thumb", href: productUrl(p), tabindex: "-1" }, productImg(p)),
        h("div", { class: "cart-info" },
          h("h2", { class: "h-small" }, h("a", { href: productUrl(p), text: p.name })),
          h("p", { class: "muted", style: "margin:0", text: catName(p.category) }),
          h("p", { class: "muted", style: "margin:0", text: pr ? "Unit price: " + money.format(p.price) : "Price on request" }),
          h("div", { class: "qty", role: "group", "aria-label": "Quantity for " + p.name },
            h("button", { type: "button", "data-action": "dec", "data-id": p.id, "aria-label": "Decrease quantity of " + p.name, text: "−" }),
            h("span", { style: "min-width:44px;text-align:center;font-weight:600", "aria-live": "off", text: String(qty) }),
            h("button", { type: "button", "data-action": "inc", "data-id": p.id, "aria-label": "Increase quantity of " + p.name, text: "+" })),
          h("button", { class: "link-btn", type: "button", "data-action": "remove", "data-id": p.id, text: "Remove" })),
        h("p", { class: "line-total", text: pr ? money.format(p.price * qty) : "Quote on request" })));
    });

    var pricedLines = lines.filter(function (x) { return isPriced(x.p); });
    var quoteLines = lines.filter(function (x) { return !isPriced(x.p); });
    var totalQty = cartCount();
    var subtotal = pricedLines.reduce(function (s, x) { return s + x.p.price * x.item.qty; }, 0);

    var waLines = lines.map(function (x) {
      return { name: x.p.name, qty: x.item.qty, priced: isPriced(x.p), unit: x.p.price };
    });
    var url = waUrl(buildEnquiry(waLines));

    var summaryDl = h("dl", null,
      h("dt", { text: "Items" }), h("dd", { text: String(totalQty) }),
      h("dt", { text: "Products needing a quote" }), h("dd", { text: String(quoteLines.reduce(function (s, x) { return s + x.item.qty; }, 0)) }),
      pricedLines.length ? h("dt", { text: "Subtotal (priced items)" }) : null,
      pricedLines.length ? h("dd", { text: money.format(subtotal) }) : null,
      !pricedLines.length ? h("dt", { class: "total-row", text: "Total" }) : null,
      !pricedLines.length ? h("dd", { class: "total-row", text: "Quote on request" }) : null);

    var summary = h("aside", { class: "summary", "aria-labelledby": "summary-h" },
      h("h2", { id: "summary-h", class: "h-small", text: "Summary" }),
      summaryDl,
      h("p", { class: "notice", text: "Totals are not final. Taxes, shipping and delivery are confirmed by our team before any payment." }),
      h("div", { class: "summary-actions" },
        url
          ? h("a", { class: "btn btn--whatsapp btn--block", href: url, target: "_blank", rel: "noopener", text: "Send enquiry on WhatsApp" })
          : h("button", { class: "btn btn--whatsapp btn--block", type: "button", disabled: true, text: "Send enquiry on WhatsApp" }),
        !url ? h("p", { class: "status status--warn", role: "status", style: "margin:0", text: "WhatsApp is not configured yet. Set the number in js/data.js." }) : null,
        h("p", { class: "notice", style: "margin:0", text: "WhatsApp opens with your message ready. Nothing is sent until you press Send there." }),
        h("a", { class: "link-btn", href: "shop.html", text: "Continue shopping" }),
        h("button", { class: "link-btn", type: "button", "data-action": "clear", text: "Clear list" })));

    root.appendChild(h("div", { class: "cart-layout" },
      h("div", null, h("p", { class: "muted", text: totalQty + (totalQty === 1 ? " item" : " items") + " in your list" }), list),
      summary));
    document.title = "Enquiry list · " + C.brandName;
    setReveal(root);
  }

  function wireCartActions() {
    var root = $("#cart-root");
    if (!root) return;
    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn || !root.contains(btn)) return;
      var action = btn.getAttribute("data-action");
      var id = btn.getAttribute("data-id");
      var item = cart.filter(function (i) { return i.id === id; })[0];

      if (action === "inc" && item) setQty(id, item.qty + 1);
      else if (action === "dec" && item) setQty(id, item.qty - 1);
      else if (action === "remove") {
        var removed = removeFromCart(id);
        if (removed) {
          var p = byId(removed.id);
          toast((p ? p.name : "Item") + " removed.", { actionLabel: "Undo", onAction: function () { addToCart(removed.id, removed.qty); } });
        }
      } else if (action === "clear") {
        if (!cart.length) return;
        if (!window.confirm("Clear everything from your enquiry list?")) return;
        var snapshot = cart.slice();
        cart = [];
        notifyCart();
        toast("List cleared.", { actionLabel: "Undo", onAction: function () { cart = snapshot; notifyCart(); } });
      }
    });
  }

  /* Header and product cards use quick-add */
  function wireQuickAdd() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action='quick-add']");
      if (!btn) return;
      var p = byId(btn.getAttribute("data-id"));
      if (!p) return;
      addToCart(p.id, 1);
      toast(p.name + (isPriced(p) ? " added to cart." : " added to your enquiry list."), {
        actionLabel: "View list", onAction: function () { location.href = "cart.html"; }
      });
    });
  }

  /* ---------- Forms ---------- */
  function setupForm(form, rules, onValid) {
    var summary = form.querySelector("[data-summary]");
    form.setAttribute("novalidate", "");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.busy === "1") return;

      var errors = [];
      rules.forEach(function (r) {
        var el = form.elements[r.name];
        if (!el) return;
        var val = el.type === "checkbox" ? el.checked : String(el.value || "").trim();
        var msg = r.check(val);
        var errEl = document.getElementById(r.name + "-error");
        if (msg) {
          errors.push({ name: r.name, msg: msg });
          el.setAttribute("aria-invalid", "true");
          if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
        } else {
          el.removeAttribute("aria-invalid");
          if (errEl) { errEl.textContent = ""; errEl.hidden = true; }
        }
      });

      if (summary) {
        summary.replaceChildren();
        if (errors.length) {
          summary.appendChild(h("h2", { text: "Please fix " + errors.length + (errors.length === 1 ? " issue" : " issues") + " before continuing:" }));
          summary.appendChild(h("ul", null, errors.map(function (er) {
            return h("li", null, h("a", { href: "#" + er.name, text: er.msg }));
          })));
          summary.hidden = false;
          summary.focus();
        } else {
          summary.hidden = true;
        }
      }
      if (errors.length) return;

      form.dataset.busy = "1";
      var buttons = $$("button[type=submit]", form);
      buttons.forEach(function (b) { b.disabled = true; });
      try {
        onValid(form, e.submitter);
      } finally {
        setTimeout(function () {
          form.dataset.busy = "0";
          buttons.forEach(function (b) { b.disabled = false; });
        }, 1500);
      }
    });
  }

  function showStatus(el, kind, text) {
    if (!el) return;
    el.className = "status" + (kind === "warn" ? " status--warn" : kind === "error" ? " status--error" : "");
    el.textContent = text;
    el.hidden = false;
  }

  var requiredText = function (label, min) {
    return function (v) {
      if (!v) return label + " is required.";
      if (min && v.length < min) return label + " must be at least " + min + " characters.";
      return "";
    };
  };
  var emailRule = function (v) {
    if (!v) return "Email address is required.";
    if (!EMAIL_RE.test(v)) return "Enter a valid email address, such as name@example.com.";
    return "";
  };
  var optionalPhone = function (v) { return (v && !PHONE_RE.test(v)) ? "Enter a valid phone number, or leave this blank." : ""; };
  var optionalUrl = function (v) { return (v && !/^https?:\/\/\S+$/i.test(v)) ? "Enter a full link starting with https://, or leave this blank." : ""; };
  var optionalQty = function (v) {
    if (!v) return "";
    var n = Number(v);
    return (Number.isInteger(n) && n > 0) ? "" : "Quantity must be a whole number of 1 or more.";
  };

  function setupCustomForm() {
    var form = $("#custom-form");
    if (!form) return;
    var status = $("#custom-status");
    var mail = $("#custom-mail");
    if (mail) {
      var url = mailUrl("Custom 3D printing request", "Hello Spool & Spark,\n\nI would like a quotation for a custom 3D print. Details are below.\n");
      if (url) { mail.href = url; mail.hidden = false; }
    }

    setupForm(form, [
      { name: "name", check: requiredText("Full name", 2) },
      { name: "email", check: emailRule },
      { name: "phone", check: optionalPhone },
      { name: "project", check: requiredText("Project name") },
      { name: "description", check: requiredText("Description", 20) },
      { name: "quantity", check: optionalQty },
      { name: "reference", check: optionalUrl },
      { name: "confirm", check: function (v) { return v ? "" : "Please confirm that your details are accurate."; } }
    ], function (f) {
      var val = function (n) { return String(f.elements[n].value || "").trim() || "Not provided"; };
      var msg = [
        "Hello Spool & Spark,", "",
        "I would like a quotation for a custom 3D print:", "",
        "Name: " + val("name"), "Email: " + val("email"), "Phone/WhatsApp: " + val("phone"),
        "Project: " + val("project"), "Category: " + val("category"),
        "Dimensions: " + val("dimensions"), "Material preference: " + val("material"),
        "Quantity: " + val("quantity"), "Budget range: " + val("budget"), "Deadline: " + val("deadline"),
        "Reference link: " + val("reference"), "", "Description:", String(f.elements.description.value || "").trim(), "",
        "Please confirm availability, pricing, delivery details and the next steps. Thank you."
      ].join("\n");
      var link = waUrl(msg);
      if (!link) {
        showStatus(status, "error", "WhatsApp is not configured yet, so this request cannot be opened there. Please use the email option below or contact us later.");
        return;
      }
      window.open(link, "_blank", "noopener");
      showStatus(status, "ok", "Your request is ready in WhatsApp. It has not been sent yet: press Send in WhatsApp to deliver it.");
      toast("Request ready in WhatsApp. Press Send there to deliver it.");
    });
  }

  function setupContactForm() {
    var form = $("#contact-form");
    if (!form) return;
    var status = $("#contact-status");
    setupForm(form, [
      { name: "name", check: requiredText("Name", 2) },
      { name: "email", check: emailRule },
      { name: "message", check: requiredText("Message", 10) }
    ], function (f, submitter) {
      var name = String(f.elements.name.value).trim();
      var email = String(f.elements.email.value).trim();
      var body = String(f.elements.message.value).trim();
      var channel = submitter && submitter.getAttribute("data-channel");

      if (channel === "email") {
        var mail = mailUrl("Enquiry from " + name, "Hello Spool & Spark,\n\n" + body + "\n\nFrom: " + name + " (" + email + ")");
        if (!mail) { showStatus(status, "error", "No email address is configured yet."); return; }
        window.location.href = mail;
        showStatus(status, "ok", "Your email app should open with the message ready. It is sent only when you press Send there.");
        return;
      }
      var link = waUrl("Hello Spool & Spark,\n\n" + body + "\n\nFrom: " + name + " (" + email + ")");
      if (!link) { showStatus(status, "error", "WhatsApp is not configured yet. Please use the email option."); return; }
      window.open(link, "_blank", "noopener");
      showStatus(status, "ok", "Your message is ready in WhatsApp. It has not been sent yet: press Send in WhatsApp to deliver it.");
    });
  }

  /* ---------- Reveal on scroll (once per element, respects reduced motion) ---------- */
  function setReveal(root) {
    var els = $$("[data-reveal]", root || document).filter(function (e) { return !e.classList.contains("is-visible"); });
    if (!els.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Hero helpers ---------- */
  function markMissingMedia() {
    $$("[data-fallback-parent]").forEach(function (wrap) {
      var img = wrap.querySelector("img");
      if (!img) return;
      if (img.complete && img.naturalWidth === 0) wrap.classList.add("is-missing");
      img.addEventListener("error", function () { wrap.classList.add("is-missing"); });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    document.documentElement.classList.add("js");
    if (!$("#toast-region")) {
      document.body.appendChild(h("div", { id: "toast-region", class: "toast-region", "aria-live": "polite", "aria-atomic": "false" }));
    }
    renderHeader();
    renderFooter();
    buildSearch();
    wireQuickAdd();
    wireCartActions();
    wireContactLinks();
    markMissingMedia();

    var page = document.body.getAttribute("data-page");
    if (page === "home") {
      renderHome();
      initReviewsCarousel();
    }
    if (page === "shop") renderShop();
    if (page === "product") renderProduct();
    if (page === "cart") renderCartPage();
    if (page === "custom") setupCustomForm();
    if (page === "contact") setupContactForm();

    updateBadges();
    setReveal(document);

    window.addEventListener("cart:changed", function () {
      updateBadges();
      if (page === "cart") renderCartPage();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
