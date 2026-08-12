/**
 * Manufacturing company website — backend server
 * -----------------------------------------------
 * Serves the frontend (in /public) and exposes a small JSON API:
 *   GET  /api/products        -> list all products
 *   GET  /api/products/:id    -> one product by id
 *   POST /api/inquiries       -> save a customer inquiry
 *   GET  /api/inquiries       -> list saved inquiries (protected, see ADMIN_KEY)
 *
 * Product data lives in  data/products.json   (edit this to change your catalog)
 * Inquiries are saved to  data/inquiries.json  (created automatically)
 */

require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const { notify } = require("./notify");

const app = express();
const PORT = process.env.PORT || 3000;

// Set a key to read inquiries from the browser (optional). Change it before going live.
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me";

const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");

// Parse JSON request bodies and serve everything in /public as static files.
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- helpers ---------------------------------------------------------------

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- product routes --------------------------------------------------------

app.get("/api/products", (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found." });
  }
  res.json(product);
});

// --- inquiry routes --------------------------------------------------------

app.post("/api/inquiries", (req, res) => {
  const { name, email, company, phone, product, message } = req.body || {};

  // Basic validation — name, email and message are required.
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Please provide your name, email and a message." });
  }

  const inquiry = {
    id: Date.now().toString(),
    name: String(name).trim(),
    email: String(email).trim(),
    company: company ? String(company).trim() : "",
    phone: phone ? String(phone).trim() : "",
    product: product ? String(product).trim() : "",
    message: String(message).trim(),
    receivedAt: new Date().toISOString(),
  };

  const inquiries = readJson(INQUIRIES_FILE, []);
  inquiries.push(inquiry);
  writeJson(INQUIRIES_FILE, inquiries);

  // Notify the owner by email / WhatsApp (configured in .env). The enquiry is
  // already saved above, so we don't wait on this or fail the request if it errors.
  notify(inquiry);

  res.status(201).json({ ok: true, message: "Thanks — we'll be in touch soon." });
});

// Simple protected endpoint to review inquiries: /api/inquiries?key=YOUR_KEY
app.get("/api/inquiries", (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  res.json(readJson(INQUIRIES_FILE, []));
});

// --- start -----------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n  Manufacturing website running:  http://localhost:${PORT}\n`);
});
