import { useState, useEffect } from 'react';

interface ClockState {
  time: string;
  date: string;
}

export const useClock = (): ClockState => {
  const [clock, setClock] = useState<ClockState>({
    time: '',
    date: '',
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const time = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const date = now.toLocaleDateString([], {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
      });

      setClock({ time, date });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return clock;
};
