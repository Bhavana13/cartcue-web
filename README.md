# cartcue-web

Omnivo demo storefront plus the CartCue AI dashboard (React 19, Vite, Tailwind 4).

- `#store`: catalog, bag, wishlist offers from the Nova agent, checkout, and buttons that simulate abandonment triggers.
- `#dashboard`: executive metrics, the checkout sessions table, Nova diagnostics, and recovery emails.

## Backend URL

All API calls go to `VITE_API_URL`:

- `.env.production` points production builds at the `cartcue-service` Cloud Run URL.
- When it is unset (e.g. `npm run dev`), the app uses `http://127.0.0.1:8000`, so run the backend locally with
  `uvicorn src.api.main:app --port 8000`.

## Scripts

```bash
npm ci
npm run dev      # local dev server
npm run lint
npm run build    # outputs dist/, deployed to Firebase Hosting by .github/workflows
```
