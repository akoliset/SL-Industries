# SL Industries — full-stack website

A full-stack website for SL Industries (agricultural inputs), with a Node.js/Express
backend and a plain HTML/CSS/JS frontend.

## Pages
- **Home** (`index.html`) — hero, featured products, capabilities
- **About** (`about.html`) — company story, how you work
- **Products** (`products.html`) — catalogue, loaded from the backend
- **Product detail** (`product.html?id=...`) — full spec sheet + inquire button
- **Inquiry** (`inquiry.html`) — quote/contact form that saves to the backend

## Run it locally

You need [Node.js](https://nodejs.org) (version 18 or newer).

```bash
cd manufacturing-website
npm install      # installs Express
npm start        # starts the server
```

Then open **http://localhost:3000** in your browser.
(During development, `npm run dev` auto-restarts when you edit `server.js`.)

## Change the content

- **Products:** edit `data/products.json`. Each product needs an `id`
  (lowercase, no spaces), a `partNo`, `name`, `category`, `tagline`,
  `description`, a list of `specs`, and `applications`. Add or remove entries
  freely — the site updates automatically.
- **Company name, text, contact details:** edit the `.html` files in `public/`.
  The name "SL Industries" appears in the header/footer of each page.
- **Colours and fonts:** edit the variables at the top of `public/css/style.css`.

## Where inquiries go

Submitted inquiries are saved to `data/inquiries.json`. To review them in the
browser, set an admin key and visit:

```
http://localhost:3000/api/inquiries?key=YOUR_KEY
```

Set the key with an environment variable when starting the server:

```bash
ADMIN_KEY=mysecret npm start
```

### Emailing yourself each inquiry (optional)
Open `server.js` and find the `TODO` inside the `POST /api/inquiries` route.
Add [Nodemailer](https://nodemailer.com) or a service like Resend/SendGrid there
to send yourself an email whenever a new inquiry arrives.

## Deploying

This runs on any host that supports Node.js — Render, Railway, Fly.io, a VPS,
etc. Most just need `npm install` then `npm start`. Because inquiries are stored
in a local file, use a host with persistent storage, or switch to a database
(e.g. SQLite or Postgres) for production.

## Project structure

```
manufacturing-website/
├── server.js            # Express backend + API
├── package.json
├── data/
│   ├── products.json    # your product catalogue (edit this)
│   └── inquiries.json   # saved inquiries (auto-updated)
└── public/              # the frontend
    ├── index.html
    ├── about.html
    ├── products.html
    ├── product.html
    ├── inquiry.html
    ├── css/style.css
    └── js/main.js
```

## Get enquiry notifications (email + WhatsApp)

Every enquiry is always saved to `data/inquiries.json`, but you can also be
notified automatically. Open the `.env` file in the project and fill in the
values, then stop the server (Ctrl+C) and run `npm start` again.

### Email (via Gmail)
1. Sign in to the Google account for slindustries9@gmail.com.
2. Turn on 2-Step Verification (myaccount.google.com → Security) if it isn't already.
3. Go to myaccount.google.com/apppasswords and create an App Password
   (name it e.g. "SL website"). Google shows a 16-character password.
4. In `.env`, put that 16-character password as `GMAIL_APP_PASSWORD`
   (remove the spaces). Leave `GMAIL_USER` and `NOTIFY_EMAIL` as your address.

### WhatsApp (via CallMeBot — free)
1. Save the number +34 644 51 95 23 in your phone as a contact (e.g. "CallMeBot").
2. From your WhatsApp, send that contact the exact message: I allow callmebot to send me messages
3. You'll receive a reply containing your personal API key.
4. In `.env`, put your number (country code + number, digits only, e.g.
   919849086110) as `WHATSAPP_PHONE`, and the key as `WHATSAPP_APIKEY`.

Leave either section blank to turn that channel off. If a notification ever
fails, the reason is printed in the terminal, and the enquiry is still saved
to the file as a backup.

## Telegram alerts (reliable phone notifications)

Telegram is a dependable, free way to get an enquiry alert on your phone.

1. Install the Telegram app on your phone and create an account.
2. In Telegram, search for **@BotFather**, open the chat, and send `/newbot`.
   Follow the prompts (give it a name and a username ending in "bot").
   BotFather replies with a **bot token** — a long string like
   `123456789:AAExampleTokenxxxxxxxxxxxxxxxxxxxxxxx`.
3. Search for your new bot by its username, open it, and tap **Start** (or send
   any message). This is required so the bot is allowed to message you.
4. Search for **@userinfobot**, open it and tap Start — it replies with your
   numeric **chat id** (e.g. `123456789`).
5. In `.env`, set `TELEGRAM_BOT_TOKEN=` to the token from step 2, and
   `TELEGRAM_CHAT_ID=` to the number from step 4.
6. Save `.env`, stop the server (Ctrl+C) and run `npm start`. Submit a test
   enquiry — the alert should arrive in your Telegram chat within seconds.
