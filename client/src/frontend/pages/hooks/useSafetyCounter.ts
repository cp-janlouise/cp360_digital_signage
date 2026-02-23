import { useState, useEffect } from 'react';

interface SafetyState {
  days: number;
  accidentDate: string;
  safetyLevel: 'critical' | 'warning' | 'safe';
}

const ACCIDENT_DATE_KEY = 'cp360_accident_date';
const DEFAULT_ACCIDENT_DATE = '2025-09-30';

export const useSafetyCounter = (): SafetyState & {
  updateAccidentDate: (date: string) => void;
  resetAccidentDate: () => void;
} => {
  const [state, setState] = useState<SafetyState>({
    days: 0,
    accidentDate: DEFAULT_ACCIDENT_DATE,
    safetyLevel: 'safe',
  });

  const calculateDaysSince = (dateStr: string): { days: number; safetyLevel: 'critical' | 'warning' | 'safe' } => {
    try {
      const accidentDate = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const timeDiff = today.getTime() - accidentDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      const days = Math.max(0, daysDiff);
      let safetyLevel: 'critical' | 'warning' | 'safe' = 'safe';

      if (days < 7) safetyLevel = 'critical';
      else if (days < 30) safetyLevel = 'warning';

      return { days, safetyLevel };
    } catch (error) {
      console.error('Error calculating days since accident:', error);
      return { days: 0, safetyLevel: 'safe' };
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(ACCIDENT_DATE_KEY);
    const dateStr = stored || DEFAULT_ACCIDENT_DATE;

    if (!stored) {
      localStorage.setItem(ACCIDENT_DATE_KEY, DEFAULT_ACCIDENT_DATE);
    }

    const { days, safetyLevel } = calculateDaysSince(dateStr);
    setState((prev) => ({
      ...prev,
      days,
      accidentDate: dateStr,
      safetyLevel,
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(ACCIDENT_DATE_KEY) || DEFAULT_ACCIDENT_DATE;
      const { days, safetyLevel } = calculateDaysSince(stored);
      setState((prev) => ({
        ...prev,
        days,
        accidentDate: stored,
        safetyLevel,
      }));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const updateAccidentDate = (date: string) => {
    localStorage.setItem(ACCIDENT_DATE_KEY, date);
    const { days, safetyLevel } = calculateDaysSince(date);
    setState((prev) => ({
      ...prev,
      days,
      accidentDate: date,
      safetyLevel,
    }));
  };

  const resetAccidentDate = () => {
    localStorage.removeItem(ACCIDENT_DATE_KEY);
    localStorage.setItem(ACCIDENT_DATE_KEY, DEFAULT_ACCIDENT_DATE);
    const { days, safetyLevel } = calculateDaysSince(DEFAULT_ACCIDENT_DATE);
    setState((prev) => ({
      ...prev,
      days,
      accidentDate: DEFAULT_ACCIDENT_DATE,
      safetyLevel,
    }));
  };

  return {
    ...state,
    updateAccidentDate,
    resetAccidentDate,
  };
};
