import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  emoji: string;
  text: string;
}

const CEBU = { lat: 10.3157, lon: 123.8854 };

const weatherFromCode = (code: number, isDay: boolean): { text: string; emoji: string } => {
  const map: Record<number, { text: string; emoji: string }> = {
    0: { text: 'Clear sky', emoji: isDay ? '☀️' : '🌙' },
    1: { text: 'Mainly clear', emoji: isDay ? '🌤️' : '🌙☁️' },
    2: { text: 'Partly cloudy', emoji: '⛅' },
    3: { text: 'Overcast', emoji: '☁️' },
    45: { text: 'Fog', emoji: '🌫️' },
    48: { text: 'Rime fog', emoji: '🌫️' },
    51: { text: 'Light drizzle', emoji: '🌦️' },
    53: { text: 'Drizzle', emoji: '🌦️' },
    55: { text: 'Dense drizzle', emoji: '🌧️' },
    61: { text: 'Slight rain', emoji: '🌧️' },
    63: { text: 'Rain', emoji: '🌧️' },
    65: { text: 'Heavy rain', emoji: '⛈️' },
    80: { text: 'Rain showers', emoji: '🌦️' },
    81: { text: 'Heavy showers', emoji: '🌧️' },
    82: { text: 'Violent showers', emoji: '⛈️' },
    95: { text: 'Thunderstorm', emoji: '⛈️' },
    96: { text: 'Thunderstorm with hail', emoji: '⛈️🧊' },
    99: { text: 'Thunderstorm with heavy hail', emoji: '⛈️🧊' },
  };

  return map[code] ?? { text: 'Weather unavailable', emoji: '❔' };
};

export const useWeather = (): WeatherData => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 0,
    emoji: '☁️',
    text: 'Loading weather...',
  });

  useEffect(() => {
    const updateWeather = async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${CEBU.lat}` +
          `&longitude=${CEBU.lon}` +
          `&current=temperature_2m,weather_code,is_day` +
          `&timezone=Asia%2FManila`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

        const data = await res.json();
        const current = data.current;

        const temp = Math.round(current.temperature_2m);
        const code = current.weather_code;
        const isDay = current.is_day === 1;

        const { text, emoji } = weatherFromCode(code, isDay);

        setWeather({ temp, emoji, text });
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeather((prev) => ({
          ...prev,
          text: 'Weather offline',
        }));
      }
    };

    updateWeather();
    const interval = setInterval(updateWeather, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return weather;
};
