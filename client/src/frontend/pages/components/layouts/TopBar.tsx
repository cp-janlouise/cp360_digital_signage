import React from 'react';
import { useClock } from '../../hooks/useClock';
import { useWeather } from '../../hooks/useWeather';
import { useSafetyCounter } from '../../hooks/useSafetyCounter';
import '/src/frontend/styles/topbar.css';
import logo from '/src/frontend/images/cp_logo.png';
export const TopBar: React.FC = () => {
  const { time, date } = useClock();
  const { temp, emoji, text } = useWeather();
  const { days, accidentDate, safetyLevel, updateAccidentDate, resetAccidentDate } =
    useSafetyCounter();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAccidentDate(e.target.value);
  };

  return (
    <header className="top-bar">
      {/* LEFT: LOGO */}
      <div className="logo">
        <img src={logo} alt="CP360 Logo" />
      </div>

      {/* CENTER: SAFETY COUNTER */}
      <section className="safety-header" aria-label="Safety Counter">
        <div className="safety-chip">
          <div className="safety-chip-top">
            <div className="safety-chip-title">SITE SAFETY</div>
            <div className="safety-chip-sub">Number of days since last accident</div>
          </div>

          <div className={`safety-chip-days safety-level-${safetyLevel}`}>
            <div className="days-display">{String(days).padStart(2, '0')}</div>
            <div className="days-label">DAYS</div>
          </div>

          <div className="safety-controls">
            <input
              type="date"
              value={accidentDate}
              onChange={handleDateChange}
              className="date-input"
              title="Set the last accident date"
            />
            <button className="reset-btn" onClick={resetAccidentDate}>
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT: WEATHER + CLOCK */}
      <div className="right-stack">
        <div className="loc-weather">
          <div className="location">📍 <span>CEBU CITY</span></div>
          <div className="weather">
            <span>{emoji}</span> <span>{temp}°C</span>
          </div>
          <div id="condition">{text}</div>
        </div>

        <div id="clock">
          <div id="time">{time}</div>
          <div id="date">{date}</div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;