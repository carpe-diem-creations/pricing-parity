"use client";

import { useEffect, useMemo, useState } from "react";

type CountryPricing = {
  country: string;
  currency: string;
  parityMultiplier: number;
  countryCode: string;
};

type RestCountry = {
  name?: { common?: string };
  currencies?: Record<string, { name?: string; symbol?: string }>;
  region?: string;
  cca2?: string;
};

type ExchangeRatesResponse = {
  rates?: Record<string, number>;
};

const REGION_MULTIPLIERS: Record<string, number> = {
  Africa: 0.5,
  Americas: 0.75,
  Asia: 0.7,
  Europe: 1,
  Oceania: 0.95
};

function getMultiplierFromRegion(region: string | undefined) {
  if (!region) return 0.8;
  return REGION_MULTIPLIERS[region] ?? 0.8;
}

function roundUpToPoint99(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const whole = Math.floor(value);
  const candidate = whole + 0.99;
  if (candidate >= value) return Number(candidate.toFixed(2));
  return Number((whole + 1.99).toFixed(2));
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default function Page() {
  const [baseAmount, setBaseAmount] = useState("99");
  const [countries, setCountries] = useState<CountryPricing[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const parsedBaseAmount = Number(baseAmount);
  const safeBaseAmount =
    Number.isFinite(parsedBaseAmount) && parsedBaseAmount > 0 ? parsedBaseAmount : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const [countriesResponse, ratesResponse] = await Promise.all([
          fetch("https://restcountries.com/v3.1/all?fields=name,currencies,region,cca2"),
          fetch("https://open.er-api.com/v6/latest/USD")
        ]);

        if (!countriesResponse.ok) {
          throw new Error("Failed loading country list");
        }
        if (!ratesResponse.ok) {
          throw new Error("Failed loading exchange rates");
        }

        const countriesData = (await countriesResponse.json()) as RestCountry[];
        const ratesData = (await ratesResponse.json()) as ExchangeRatesResponse;

        const parsedCountries = countriesData
          .map((entry) => {
            const country = entry.name?.common;
            const currency = entry.currencies ? Object.keys(entry.currencies)[0] : undefined;
            const countryCode = entry.cca2;
            if (!country || !currency || !countryCode) return null;

            const parityMultiplier =
              countryCode === "US" ? 1 : getMultiplierFromRegion(entry.region);

            return {
              country,
              currency,
              countryCode,
              parityMultiplier
            };
          })
          .filter((entry): entry is CountryPricing => Boolean(entry))
          .sort((a, b) => a.country.localeCompare(b.country));

        setCountries(parsedCountries);
        setExchangeRates({ USD: 1, ...(ratesData.rates ?? {}) });
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load countries and rates."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const rows = useMemo(() => {
    return countries.map((entry) => {
      const usdToLocal = exchangeRates[entry.currency] ?? 1;
      const parityUsd = roundUpToPoint99(safeBaseAmount * entry.parityMultiplier);
      const localCurrencyPrice = roundUpToPoint99(parityUsd * usdToLocal);
      return {
        ...entry,
        usdToLocal,
        parityUsd,
        localCurrencyPrice
      };
    });
  }, [countries, exchangeRates, safeBaseAmount]);

  return (
    <main className="page">
      <section className="card">
        <h1>Pricing Parity Calculator</h1>
        <p className="subtext">
          Enter your base US price and view parity-adjusted pricing by country.
        </p>

        <label className="inputLabel" htmlFor="base-amount">
          Base price (USD)
        </label>
        <input
          id="base-amount"
          type="number"
          min="0"
          step="0.01"
          value={baseAmount}
          onChange={(event) => setBaseAmount(event.target.value)}
          placeholder="Enter USD amount"
          className="input"
        />

        <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Currency</th>
                <th>Parity Multiplier</th>
                <th>Price (USD)</th>
                <th>Price (Local Currency)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5}>Loading all countries and exchange rates...</td>
                </tr>
              )}
              {!isLoading && loadError && (
                <tr>
                  <td colSpan={5}>{loadError}</td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.country}>
                  <td>{row.country}</td>
                  <td>{row.currency}</td>
                  <td>{row.parityMultiplier.toFixed(2)}x</td>
                  <td>{usdFormatter.format(row.parityUsd)}</td>
                  <td>{formatCurrency(row.localCurrencyPrice, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
