import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_LOCATION_KEY = "262768";
const FALLBACK_BASE_URL = "https://dataservice.accuweather.com";

const WEATHER_API_KEY =
  import.meta.env.VITE_WEATHER_API_KEY ||
  "zpka_6c4985624ab34bcab16b588f46ec1ed5_72b42ee0";

// IMPORTANT: env vars can be present-but-wrong. We validate below.
const ENV_LOCATION_KEY = import.meta.env.VITE_LOCATION_KEY;
const ENV_ACCU_BASE_URL = import.meta.env.VITE_ACCU_BASE_URL;

type WeatherVM = {
  title: "TODAY" | "TONIGHT";
  md: string;
  loc: string;
  icon: string;
  temp: string;
  low: string;
  phrase: string;
  pop: string;
  subIcon: string;
  subText: string;
};

type UseWeatherOptions = {
  locationKey?: string;
  displayLocation?: string;
  updatesPerDay?: number;
  refreshIntervalMs?: number;
};

const ACCU = {
  API_KEY: WEATHER_API_KEY as string,
  LOCATION_KEY: String(ENV_LOCATION_KEY ?? FALLBACK_LOCATION_KEY),
  BASE_URL: String(ENV_ACCU_BASE_URL ?? FALLBACK_BASE_URL),
  LANGUAGE: "en",
  METRIC: true,
  UPDATES_PER_DAY: 72,
};

const DEFAULT_DISPLAY_LOCATION = "CEBU CITY";

/* ─── Helpers ─────────────────────────────────────────────── */

function formatMD(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toInt(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * AccuWeather location keys are typically numeric strings (often 6+ digits).
 * If your env var is accidentally "26276" (5 digits) or blank-ish, we treat it as invalid.
 */
function normalizeLocationKey(raw: unknown, fallback: string) {
  const s = String(raw ?? "").trim();
  if (!s) return fallback;

  // Accept numeric strings length >= 6 (covers your known-good "262768")
  const isNumeric = /^[0-9]+$/.test(s);
  if (isNumeric && s.length >= 6) return s;

  // If someone uses a non-numeric key in the future, allow it only if it’s “long enough”
  if (!isNumeric && s.length >= 6) return s;

  return fallback;
}

function normalizeBaseUrl(raw: unknown, fallback: string) {
  const s = String(raw ?? "").trim();
  if (!s || s === "undefined") return fallback;
  return s.replace(/\/+$/, "");
}

function getPopPercent(daily: any, useNight: boolean): number | null {
  const segment = useNight ? daily?.Night : daily?.Day;
  const raw = segment?.PrecipitationProbability ?? segment?.RainProbability ?? null;
  if (!Number.isFinite(raw)) return null;
  return clamp(Math.round(raw), 0, 100);
}

function getTimeLabel(now = new Date(), current: any = null): string {
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

function iconToEmoji(weatherIconNumber: unknown, isNight: boolean): string {
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

function canUseAccu(apiKey: string, locationKey: string, baseUrl: string): boolean {
  return (
    typeof apiKey === "string" &&
    apiKey.trim().length > 0 &&
    typeof locationKey === "string" &&
    locationKey.trim().length > 0 &&
    typeof baseUrl === "string" &&
    baseUrl.trim().length > 0 &&
    baseUrl !== "undefined"
  );
}

function pickTemp(current: any, metric: boolean): number | null {
  const node = metric ? current?.Temperature?.Metric : current?.Temperature?.Imperial;
  return toInt(node?.Value);
}

async function fetchAccuWeatherBundle(args: {
  apiKey: string;
  locationKey: string;
  language: string;
  metric: boolean;
  baseUrl: string;
}) {
  const { apiKey, locationKey, language, metric, baseUrl } = args;

  if (!canUseAccu(apiKey, locationKey, baseUrl)) {
    const missing = [
      !apiKey || apiKey === "undefined" ? "VITE_WEATHER_API_KEY" : null,
      !locationKey || locationKey === "undefined" ? "VITE_LOCATION_KEY" : null,
      !baseUrl || baseUrl === "undefined" ? "VITE_ACCU_BASE_URL" : null,
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Missing env var(s): ${missing}`);
  }

  const key = encodeURIComponent(apiKey.trim());
  const locKey = encodeURIComponent(locationKey.trim());
  const lang = encodeURIComponent(language || "en");
  const metricStr = metric ? "true" : "false";

  const currentUrl = `${baseUrl}/currentconditions/v1/${locKey}?apikey=${key}&language=${lang}&details=true`;
  const dailyUrl = `${baseUrl}/forecasts/v1/daily/1day/${locKey}?apikey=${key}&language=${lang}&details=true&metric=${metricStr}`;

  const [curRes, dayRes] = await Promise.all([
    fetch(currentUrl, { cache: "no-store" }),
    fetch(dailyUrl, { cache: "no-store" }),
  ]);

  const curJson = await curRes.json().catch(() => null);
  const dayJson = await dayRes.json().catch(() => null);

  if (!curRes.ok) {
    const msg = curJson?.Message ?? curJson?.message ?? curRes.statusText;
    throw new Error(`Current conditions ${curRes.status}: ${msg}`);
  }
  if (!dayRes.ok) {
    const msg = dayJson?.Message ?? dayJson?.message ?? dayRes.statusText;
    throw new Error(`Daily forecast ${dayRes.status}: ${msg}`);
  }

  const current = Array.isArray(curJson) ? curJson[0] ?? null : null;
  const daily = Array.isArray(dayJson?.DailyForecasts) ? dayJson.DailyForecasts[0] ?? null : null;

  if (!current) throw new Error("Current conditions response was empty.");
  if (!daily) throw new Error("Daily forecast response was empty.");

  return { current, daily };
}

function computeIntervalMs(opts?: UseWeatherOptions): number {
  if (typeof opts?.refreshIntervalMs === "number" && opts.refreshIntervalMs > 0) {
    return clamp(opts.refreshIntervalMs, 60_000, 6 * 60 * 60 * 1000);
  }
  const upd =
    typeof opts?.updatesPerDay === "number" && opts.updatesPerDay > 0
      ? opts.updatesPerDay
      : ACCU.UPDATES_PER_DAY;

  return clamp((24 * 60 * 60 * 1000) / upd, 5 * 60_000, 6 * 60 * 60 * 1000);
}

/* ─── Hook ────────────────────────────────────────────────── */

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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalMs = useMemo(
    () => computeIntervalMs(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options?.refreshIntervalMs, options?.updatesPerDay]
  );

  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    const baseUrl = normalizeBaseUrl(ACCU.BASE_URL, FALLBACK_BASE_URL);

    // Prefer explicit option, otherwise env, otherwise fallback known-good
    const resolvedLocationKey = normalizeLocationKey(
      options?.locationKey ?? ACCU.LOCATION_KEY,
      FALLBACK_LOCATION_KEY
    );

    const displayLocation = options?.displayLocation ?? DEFAULT_DISPLAY_LOCATION;

    try {
      setIsLoading(true);
      setError(null);

      const { current, daily } = await fetchAccuWeatherBundle({
        apiKey: ACCU.API_KEY,
        locationKey: resolvedLocationKey,
        language: ACCU.LANGUAGE,
        metric: ACCU.METRIC,
        baseUrl,
      });

      const useNightNow = current?.IsDayTime === false;
      const pop = getPopPercent(daily, useNightNow);

      const currentTemp = pickTemp(current, ACCU.METRIC);
      const minT = toInt(daily?.Temperature?.Minimum?.Value);

      const dayPhrase =
        daily?.Day?.IconPhrase ||
        daily?.Day?.ShortPhrase ||
        daily?.Day?.LongPhrase ||
        "Forecast unavailable";

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
      const message: string = e?.message || "Weather offline";
      console.error("[useWeather] fetch failed:", message);

      if (isMounted.current) {
        setIsLoading(false);
        setError(message);
        setData((prev) => ({
          ...prev,
          phrase: message,
          temp: "--°",
          low: "--°",
          pop: "--%",
          subIcon: "⚠️",
          subText: message,
        }));
      }
    }
  }, [options?.locationKey, options?.displayLocation]);

  useEffect(() => {
    isMounted.current = true;
    refresh();

    const t = window.setInterval(refresh, intervalMs);

    return () => {
      isMounted.current = false;
      window.clearInterval(t);
    };
  }, [refresh, intervalMs]);

  return { data, isLoading, error, refresh, intervalMs };
}