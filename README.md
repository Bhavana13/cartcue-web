# cartcue-web

Frontend for **CartCue**, built for the Google AI Builder Cup (Retail & Commerce track).

CartCue gives online stores an AI agent, **Nova**, that finds out *why* a shopper abandoned checkout, recovers the sale with an offer that fixes that exact reason, and tracks what was won back. This app contains both sides of the demo:
- **Omnivo**, a sample store where shoppers browse, hesitate and check out
- the **CartCue AI Dashboard**, where a merchant sees abandoned sessions, Nova's diagnosis and recoveries

| | |
|---|---|
| Live app | https://cartcue-ai-builder-cup.web.app |
| Backend repo (API + Nova agent) | https://github.com/Bhavana13/cartcue-service |
| API docs | https://cartcue-service-299645583553.us-central1.run.app/docs |

## What you can do

### Omnivo store (`#store`)
- **Demo guide.** The store opens with a short guide explaining that Omnivo is a test store for CartCue, three steps to try, and a **▶ Start the demo** button that adds a dress with Express delivery. It can be hidden and brought back with "ℹ️ How this demo works".
- **Browse and build a bag.** Pick a shipping method (Standard free, Express Rs. 150, Same-Day Priority Rs. 350) and a payment gateway (PhonePe, GooglePay, Paytm), and see a price breakdown.
- **Nova bell offers.** When the shopper closes the bag without paying, or the mouse heads for the tab bar, Nova analyses the bag in the background (also after ~8 seconds of browsing with items in a closed bag; never while the bag is open):
  - the 🔔 bell pulses while it works
  - a toast appears when the offer is ready
  - the offer matches the diagnosed cause: free delivery when the shipping fee is the problem, otherwise 10% off
  - **Apply offer** updates the bag; **Dismiss** saves the bag as an abandoned session so the merchant can diagnose and recover it later
- **Wishlist offer.** Moving an item to the wishlist triggers a Nova offer (a discount, or free Priority delivery for higher-priced items).
- **Place an order.** Orders that used a Nova offer are recorded as AI recoveries.
- **Demo panel: simulate why a shopper abandons.** Three buttons create abandoned sessions with realistic checkout telemetry:
  - Shipping Fee Shock: fee shown at review
  - Payment Gateway Timeout: declined payment with an error code
  - Forced Account Wall: slow sign-up step

### CartCue AI Dashboard (`#dashboard`)
- **Executive metrics:** abandoned sessions, recovery rate, revenue at risk, AI-recovered orders and revenue.
- **Sessions table:** newest first, with search, a status filter and pagination. Badges show 🤖 AI Recovered and 🔕 Offer dismissed.
- **Analyze:** Nova's diagnostic report with root cause, confidence, a Gemini-written explanation and the evidence it used.
- **🚀 Recover:** sends a recovery email whose offer matches the diagnosed cause.

## Try it (2 minutes)

**Path 1: diagnose and recover**
1. Add any item to the bag.
2. In the dashed demo panel, click **Simulate: Payment Gateway Timeout**.
3. On the dashboard, click **Analyze** on the new session. Expect `PAYMENT_FRICTION` at 96%, with evidence.
4. Click **🚀 Recover**. The offer is a payment retry, with no discount.

**Path 2: Nova bell recovery**
1. Click **▶ Start the demo** in the guide, or add the **SFOTY A-Line Midi Dress** and choose **Express Delivery (Rs. 150)** yourself.
2. Close the bag (✕) without paying. The toast appears a few seconds later; click **View offer** → **Apply offer**. Shipping becomes FREE.
3. Place the order. On the dashboard, it shows **🤖 AI Recovered**.
4. Or click **Dismiss** in step 2 instead. The bag appears on the dashboard as an abandoned session (🔕) to Analyze and Recover.

## Run locally

Requires Node.js 20.19+ (Vite 8). Start the backend first (see the `cartcue-service` README); it listens on `http://127.0.0.1:8000`.

```bash
npm ci
npm run dev        # http://localhost:5173
npm run lint
npm run build      # production build in dist/
```

### Backend URL

All API calls go to `VITE_API_URL`:
- **Production builds** read it from `.env.production`, which points at the Cloud Run service.
- **`npm run dev`** has no `VITE_API_URL` set, so it falls back to `http://127.0.0.1:8000`. Local testing never writes to production data.

## Deployment

Firebase Hosting, via GitHub Actions:
- **Merge to `main`** (`firebase-hosting-merge.yml`): `npm ci` → lint → build → deploy to the live channel.
- **Pull requests** (`firebase-hosting-pull-request.yml`): the same checks, plus a preview channel.

A `Dockerfile` (Node 22 build + nginx) is also included for container hosting.

## Project structure

```
src/
  App.jsx      Store, Nova bell, bag drawer, demo panel and dashboard (hash routes #store / #dashboard)
  main.jsx     React entry point
  index.css    Tailwind import
public/        Logo and icons
.env.production
.github/workflows/
```

## Tech stack

React 19 · Vite 8 · Tailwind CSS 4 · Firebase Hosting · GitHub Actions. The backend runs on Cloud Run, with Firestore and Gemini 2.5 Flash on Vertex AI.
