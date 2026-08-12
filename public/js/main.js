/* Shared frontend behaviour for every page. */

// --- mobile nav toggle -----------------------------------------------------
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
}

// Mark the current page's nav link as active.
document.querySelectorAll(".nav-links a").forEach((a) => {
  const href = a.getAttribute("href");
  if (href && location.pathname.endsWith(href)) a.classList.add("active");
});

// --- helpers ---------------------------------------------------------------
function esc(str = "") {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return res.json();
}

// --- product card markup ---------------------------------------------------
function productCard(p) {
  return `
      <a class="product-card" href="product.html?id=${encodeURIComponent(p.id)}">
        <div class="card-head">
          <span>${esc(p.category)}</span>
          <span class="part-no">${esc(p.partNo)}</span>
        </div>
        <div class="card-body">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.tagline)}</p>
          <span class="card-link">View details &rarr;</span>
        </div>
      </a>`;
}

// --- render featured grid (home) ------------------------------------------
async function renderProductGrid(targetId, limit) {
  const el = document.getElementById(targetId);
  if (!el) return;
  try {
    let products = await getJSON("/api/products");
    if (limit) products = products.slice(0, limit);
    el.innerHTML = products.map(productCard).join("");
  } catch (err) {
    el.innerHTML = `<p class="loading">Couldn't load products. Is the server running?</p>`;
  }
}

// --- render products page with category filter ----------------------------
async function renderProductsPage() {
  const grid = document.getElementById("product-grid");
  const bar = document.getElementById("filter-bar");
  if (!grid || !bar) return;
  try {
    const products = await getJSON("/api/products");
    // Preserve first-seen order of categories
    const categories = [];
    products.forEach((p) => {
      if (!categories.includes(p.category)) categories.push(p.category);
    });

    const draw = (cat) => {
      const list = cat === "All" ? products : products.filter((p) => p.category === cat);
      grid.innerHTML = list.map(productCard).join("");
      bar.querySelectorAll(".filter-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.cat === cat)
      );
    };

    const btn = (cat, count) =>
      `<button class="filter-btn" data-cat="${esc(cat)}">${esc(cat)}<span class="count">${count}</span></button>`;

    bar.innerHTML =
      btn("All", products.length) +
      categories
        .map((c) => btn(c, products.filter((p) => p.category === c).length))
        .join("");

    bar.querySelectorAll(".filter-btn").forEach((b) =>
      b.addEventListener("click", () => draw(b.dataset.cat))
    );

    draw("All");
  } catch (err) {
    grid.innerHTML = `<p class="loading">Couldn't load products. Is the server running?</p>`;
  }
}

// --- render single product (product.html) ---------------------------------
async function renderProductDetail() {
  const el = document.getElementById("product-detail");
  if (!el) return;
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    el.innerHTML = `<p class="loading">No product selected. <a href="products.html">Back to products</a>.</p>`;
    return;
  }
  try {
    const p = await getJSON("/api/products/" + encodeURIComponent(id));
    document.title = `${p.name} — SL Industries`;
    el.innerHTML = `
      <div class="detail-top">
        <div class="detail-meta">
          <p class="eyebrow">${esc(p.category)} / ${esc(p.partNo)}</p>
          <h1>${esc(p.name)}</h1>
          <p class="tagline">${esc(p.tagline)}</p>
          <p class="detail-desc">${esc(p.description)}</p>
          <div class="tags">
            ${(p.applications || []).map((a) => `<span class="tag">${esc(a)}</span>`).join("")}
          </div>
        </div>
        <div class="spec-sheet">
          <div class="spec-head"><span>Composition &amp; details</span><span>${esc(p.partNo)}</span></div>
          ${(p.specs || [])
            .map(
              (s) => `<div class="spec-row"><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span></div>`
            )
            .join("")}
        </div>
      </div>
      <div class="detail-cta">
        <div>
          <h2>Need this made to your spec?</h2>
          <p>Ask us about pricing, pack sizes, dosage or availability for your crop.</p>
        </div>
        <a class="btn btn--signal" href="inquiry.html?product=${encodeURIComponent(p.name)}">Inquire about ${esc(p.name)}</a>
      </div>`;
  } catch (err) {
    el.innerHTML = `<p class="loading">Product not found. <a href="products.html">Back to products</a>.</p>`;
  }
}

// --- populate the inquiry form's product dropdown --------------------------
async function populateProductSelect() {
  const select = document.getElementById("product-select");
  if (!select) return;
  try {
    const products = await getJSON("/api/products");
    const preset = new URLSearchParams(location.search).get("product");
    products.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = `${p.name} (${p.partNo})`;
      if (preset && preset === p.name) opt.selected = true;
      select.appendChild(opt);
    });
  } catch { /* leave the default option in place */ }
}

// --- handle inquiry form submission ---------------------------------------
function wireInquiryForm() {
  const form = document.getElementById("inquiry-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      status.textContent = data.message || "Thanks — we'll be in touch soon.";
      status.classList.add("ok");
      form.reset();
    } catch (err) {
      status.textContent = err.message || "Sorry, we couldn't send that. Please try again.";
      status.classList.add("err");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send inquiry";
    }
  });
}

// --- run on load -----------------------------------------------------------
renderProductGrid("featured-grid", 3);
renderProductsPage();
renderProductDetail();
populateProductSelect();
wireInquiryForm();
