# Pricing Parity Calculator

Next.js app that calculates country-by-country parity pricing from a U.S. base price.

## Features

- User enters a base price in USD (treated as the United States price).
- Shows pricing table for all available countries.
- Includes:
  - Country
  - Currency code
  - Parity multiplier
  - Derived price in USD
  - Derived price in local currency
- Applies charm pricing: derived values are rounded up to end with `.99`.

## Data Sources

- Country metadata (name, currency, region): `https://restcountries.com`
- USD exchange rates: `https://open.er-api.com`

## How It Works

1. Load all countries and their primary currency.
2. Assign a parity multiplier by region (U.S. is always `1.00`).
3. Compute derived USD price from the base U.S. price.
4. Convert to local currency.
5. Round derived prices up to `.99`.

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Project Structure

- `app/page.tsx` main calculator UI and pricing logic
- `app/globals.css` page styling
- `app/layout.tsx` app shell and metadata
