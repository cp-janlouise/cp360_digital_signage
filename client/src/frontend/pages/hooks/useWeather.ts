import { useEffect, useMemo, useRef, useState } from "react";
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const LOCATION_KEY = import.meta.env.VITE_LOCATION_KEY;
const ACCU_BASE_URL = import.meta.env.VITE_ACCU_BASE_URL;

type WeatherVM = {
  title: "TODAY" | "TONIGHT";
  md: string; // M/D
  loc: string;

  icon: string; // emoji
  temp: string; // "30°"
  low: string; // "24°"

  phrase: string; // main phrase
  pop: string; // "42%"

  subIcon: string; // emoji
  subText: string; // "Dawn: A couple of thunderstorms"
};

type UseWeatherOptions = {
  /**
   * If provided, overrides the Accu config location key (e.g. "262768").
   */
  locationKey?: string;

  /**
   * Overrides display-only location label in UI (does not affect API).
   */
  displayLocation?: string;

  /**
   * Updates per day (24h / N). Example: 72 = every 20 minutes.
   */
  updatesPerDay?: number;

  /**
   * If set, this wins over updatesPerDay. (milliseconds)
   */
  refreshIntervalMs?: number;
};

const ACCU = {
  API_KEY: WEATHER_API_KEY,
  LOCATION_KEY: LOCATION_KEY,
  BASE_URL: ACCU_BASE_URL,
  LANGUAGE: "en",
  METRIC: true,
  UPDATES_PER_DAY: 72,
};

const DEFAULT_DISPLAY_LOCATION = "CEBU CITY";

/* =========================
   Helpers (ported from script.js)
   ========================= */

function formatMD(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toInt(n: unknown) {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Extract Probability of Precipitation (PoP) from Accu daily forecast.
 * Prefers PrecipitationProbability, falls back to RainProbability.
 */
function getPopPercent(daily: any, useNight: boolean) {
  const segment = useNight ? daily?.Night : daily?.Day;
  const raw = segment?.PrecipitationProbability ?? segment?.RainProbability ?? null;

  if (!Number.isFinite(raw)) return null;
  return clamp(Math.round(raw), 0, 100);
}

/**
 * Time-aware label for the sub-detail row.
 */
function getTimeLabel(now = new Date(), current: any = null) {
  const h = now.getHours();
  const isDay = current?.IsDayTime === true;

  if (isDay) {
    if (h >= 5 && h <= 8) return "Morning";
    if (h >= 9 && h <= 11) return "Late morning";
    if (h >= 12 && h <= 16) return "Afternoon";
    if (h >= 17 && h <= 18) return "Evening";
    return "Day";
  }

  if (h === 0) return "Midnight";
  if (h >= 1 && h <= 2) return "Late night";
  if (h >= 3 && h <= 5) return "Dawn";
  if (h >= 6 && h <= 11) return "Morning";
  if (h >= 12 && h <= 16) return "Afternoon";
  if (h >= 17 && h <= 18) return "Dusk";
  if (h >= 19 && h <= 23) return "Night";

  return "Now";
}

/* --- Icon mapping (emoji, AccuWeather-like) --- */
function iconToEmoji(weatherIconNumber: unknown, isNight: boolean) {
  const n = Number(weatherIconNumber);

  if ([15, 16, 17, 41, 42].includes(n)) return "⛈️";
  if ([12, 13, 14, 18, 39, 40].includes(n)) return "🌧️";
  if ((n >= 19 && n <= 29) || n === 43 || n === 44) return "❄️";
  if (n === 11) return "🌫️";
  if (n === 7 || n === 8) return "☁️";
  if (n >= 3 && n <= 6) return isNight ? "🌙☁️" : "⛅";
  if (n === 1 || n === 2) return isNight ? "🌙" : "☀️";
  if (n >= 33 && n <= 38) return "🌙";

  return isNight ? "🌙" : "⛅";
}

function canUseAccu(apiKey: string, locationKey: string) {
  return apiKey.trim().length > 0 && locationKey.trim().length > 0;
}

async function fetchAccuWeatherBundle(args: {
  apiKey: string;
  locationKey: string;
  language: string;
  metric: boolean;
  baseUrl: string;
}) {
  const { apiKey, locationKey, language, metric, baseUrl } = args;

  if (!canUseAccu(apiKey, locationKey)) {
    throw new Error("Missing AccuWeather API key or location key.");
  }

  const key = encodeURIComponent(apiKey.trim());
  const locKey = encodeURIComponent(locationKey.trim());
  const lang = encodeURIComponent(language || "en");
  const metricStr = metric ? "true" : "false";

  const currentUrl =
    `${baseUrl}/currentconditions/v1/${locKey}` + `?apikey=${key}&language=${lang}&details=true`;

  const dailyUrl =
    `${baseUrl}/forecasts/v1/daily/1day/${locKey}` +
    `?apikey=${key}&language=${lang}&details=true&metric=${metricStr}`;

  const [curRes, dayRes] = await Promise.all([fetch(currentUrl), fetch(dailyUrl)]);
  if (!curRes.ok) throw new Error(`AccuWeather currentconditions failed: ${curRes.status}`);
  if (!dayRes.ok) throw new Error(`AccuWeather daily forecast failed: ${dayRes.status}`);

  const curJson = await curRes.json();
  const dayJson = await dayRes.json();

  const current = Array.isArray(curJson) ? curJson[0] : null;
  const daily = Array.isArray(dayJson?.DailyForecasts) ? dayJson.DailyForecasts[0] : null;

  return { current, daily };
}

function computeIntervalMs(opts?: UseWeatherOptions) {
  // If user explicitly sets refreshIntervalMs, take it.
  if (typeof opts?.refreshIntervalMs === "number" && opts.refreshIntervalMs > 0) {
    // Clamp to something sane for signage (avoid accidental 5ms DoS 😄)
    return clamp(opts.refreshIntervalMs, 60_000, 6 * 60 * 60 * 1000);
  }

  const upd =
    typeof opts?.updatesPerDay === "number" && opts.updatesPerDay > 0
      ? opts.updatesPerDay
      : ACCU.UPDATES_PER_DAY;

  // Correct formula: 24 hours / updatesPerDay
  const ms = (24 * 60 * 60 * 1000) / upd;

  // Clamp to avoid hammering API or being too stale
  return clamp(ms, 5 * 60_000, 6 * 60 * 60 * 1000);
}

/* =========================
   Hook
   ========================= */

export function useWeather(options?: UseWeatherOptions) {
  const [data, setData] = useState<WeatherVM>(() => ({
    title: "TODAY",
    md: "--/--",
    loc: options?.displayLocation ?? DEFAULT_DISPLAY_LOCATION,
    icon: "⛅",
    temp: "--°",
    low: "--°",
    phrase: "Loading forecast...",
    pop: "--%",
    subIcon: "🌙",
    subText: "Now: --",
  }));

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const intervalMs = useMemo(() => computeIntervalMs(options), [options?.refreshIntervalMs, options?.updatesPerDay]);

  const isMounted = useRef(true);

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const locationKey = options?.locationKey ?? ACCU.LOCATION_KEY;
      const displayLocation = options?.displayLocation ?? DEFAULT_DISPLAY_LOCATION;

      const { current, daily } = await fetchAccuWeatherBundle({
        apiKey: ACCU.API_KEY,
        locationKey,
        language: ACCU.LANGUAGE,
        metric: ACCU.METRIC,
        baseUrl: ACCU.BASE_URL,
      });

      const useNightNow = current?.IsDayTime === false;
      const pop = getPopPercent(daily, useNightNow);

      const currentTemp = toInt(current?.Temperature?.Metric?.Value);
      const minT = toInt(daily?.Temperature?.Minimum?.Value);

      const dayPhrase =
        daily?.Day?.IconPhrase ||
        daily?.Day?.ShortPhrase ||
        daily?.Day?.LongPhrase ||
        "Forecast unavailable";

      // Sub-detail: show the “other half” (day vs night), and label by time bucket.
      const subPhrase = useNightNow
        ? daily?.Day?.IconPhrase || daily?.Day?.ShortPhrase || daily?.Day?.LongPhrase
        : daily?.Night?.IconPhrase || daily?.Night?.ShortPhrase || daily?.Night?.LongPhrase;

      const subIconNum = useNightNow ? daily?.Day?.Icon : daily?.Night?.Icon;
      const subIcon = iconToEmoji(subIconNum, !useNightNow);

      const label = getTimeLabel(new Date(), current);

      const next: WeatherVM = {
        title: useNightNow ? "TONIGHT" : "TODAY",
        md: formatMD(new Date()),
        loc: displayLocation,
        icon: iconToEmoji(current?.WeatherIcon, useNightNow),
        temp: currentTemp !== null ? `${currentTemp}°` : "--°",
        low: minT !== null ? `${minT}°` : "--°",
        phrase: dayPhrase,
        pop: pop !== null ? `${pop}%` : "--%",
        subIcon,
        subText: `${label}: ${subPhrase || "Forecast unavailable"}`,
      };

      if (isMounted.current) {
        setData(next);
        setIsLoading(false);
      }
    } catch (e: any) {
      if (isMounted.current) {
        setIsLoading(false);
        setError(e?.message || "Weather offline");
        setData((prev) => ({
          ...prev,
          phrase: "Weather offline",
          pop: "--%",
          subIcon: "🌙",
          subText: "Now: --",
        }));
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    refresh();

    const t = window.setInterval(() => refresh(), intervalMs);

    return () => {
      isMounted.current = false;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, options?.locationKey, options?.displayLocation]);

  return { data, isLoading, error, refresh, intervalMs };
}