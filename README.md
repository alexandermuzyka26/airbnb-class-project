# DC Airbnb Price Finder

**Live site:** https://alexandermuzyka26.github.io/airbnb-class-project/

Helps Washington, DC homeowners decide what nightly rate to charge on Airbnb. Pick a
neighborhood, rental type, bedroom count, interior finish (1–10) and amenities; the app
recommends a nightly rate and an estimated annual revenue from comparable listings, and
shows the price distribution, amenity premiums, a neighborhood map and the license mix.

It is a fully static site (React + TypeScript + Vite + Tailwind, Recharts, Leaflet with
OpenStreetMap tiles). There is no backend, login, or API key. All data is CSV files in
`public/data/`, which the browser loads with PapaParse.

## Data source

[Inside Airbnb](https://insideairbnb.com/get-the-data/), Washington, DC snapshot of
**June 17, 2025**, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The app uses aggregated
derivatives of that snapshot:

| File | Contents |
| --- | --- |
| `public/data/dc_rates.csv` | Price percentiles (p10–p90) and median booked nights per neighborhood × listing type, plus an `All DC` fallback |
| `public/data/dc_amenity_effects.csv` | Estimated price premium per amenity and whether it has enough listings to be reliable |
| `public/data/dc_neighborhoods.csv` | Per-neighborhood summary: listing counts, map centers, license shares |
| `public/data/dc_listings.csv` | Per-listing rows used for the histogram and map pins |
| `public/data/DC_Airbnb_Pricing_Data.csv` | Combined listing-level source table (not loaded by the app; kept for reference) |

Prices are posted asking prices, excluding cleaning fees and taxes.

## Pricing model (summary)

1. Comparable set: `neighborhood|listing type` from `dc_rates.csv`, falling back to
   `All DC|listing type` if the neighborhood has fewer than 5 comparable listings.
2. Finish level → percentile: `10 + (finish − 1) × 80/9`, then linear interpolation between
   the bracketing p10/p25/median/p75/p90 prices.
3. Add the premiums of the reliable amenities you checked, capped at ±20%. Amenities without
   enough listings to estimate a premium (currently hot tub) are not offered.
4. Optional bathroom adjustment (entire homes, 1–4+ BR): the median `price_index` (listing
   price ÷ its neighborhood × bedroom comp median) of listings with that bedroom and bathroom
   count, minus 1, capped at ±20%. It is computed in the browser from `dc_listings.csv`. Only
   bathroom counts with ≥20 listings are offered. Studios (all 1 bath) and private rooms
   (bathroom counts are mostly shared baths) get no bathroom input.
5. Rate = base × (1 + amenities) × (1 + bathrooms), rounded to the nearest $5.
   Annual revenue = nightly rate × median booked nights.

Sample case (Capitol Hill, Lincoln Park / Entire home / 2 BR / finish 7 / in-unit washer +
dedicated workspace, bathrooms "Not sure"): 63.3rd percentile → $248.47 base × 1.043 → **$260/night**, × 186
nights → **$48,360/year**.

## Run locally

Requires Node.js 20.19+ (Node 22 LTS recommended).

```bash
npm install
npm run dev            # http://localhost:3000/airbnb-class-project/
npm run build          # production build into dist/
npm run preview        # serve dist/ at http://localhost:4173/airbnb-class-project/
npm run lint           # TypeScript type check
```

## Deploying / redeploying

Deployment is automatic. `.github/workflows/deploy.yml` runs on every push to `main`. It
runs `npm ci` and `npm run build`, then publishes `dist/` to GitHub Pages.

- **Redeploy after a change:** commit and `git push origin main`.
- **Redeploy without a change:** GitHub → *Actions* → *Deploy to GitHub Pages* →
  *Run workflow* (or `gh workflow run deploy.yml`).
- **One-time setup:** the repo's *Settings → Pages → Source* must be set to
  **GitHub Actions**.
- **Updating data:** replace the CSVs in `public/data/` (same file names and columns) and push.

### About the base path

GitHub Pages serves this project from the `/airbnb-class-project/` subpath, so every asset
URL needs that prefix. The workflow reads the subpath from `actions/configure-pages` and passes
it to Vite as `BASE_PATH`, which keeps the deploy correct if the repo is renamed or moved to
a custom domain. Locally, `vite.config.ts` defaults to `/airbnb-class-project/`. In code, load
static files via `` `${import.meta.env.BASE_URL}data/...` ``, never an absolute `/data/...` path.
