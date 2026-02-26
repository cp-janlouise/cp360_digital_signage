import React from "react";
import { useClock } from "../../hooks/useClock";
import { useWeather } from "../../hooks/useWeather";

import "/src/frontend/styles/topbar.css";
import logo from "/src/frontend/images/cp_logo.png";

export const TopBar: React.FC = () => {
  const { time, date } = useClock();

  const { data } = useWeather({
    displayLocation: "CEBU CITY",
    updatesPerDay: 72,
  });


  const now = new Date();
  const hour = now.getHours();

  const computedTitle = hour < 12 ? "TODAY" : "TONIGHT";

  return (
    <header className="top-bar">
      <div className="logo">
        <img src={logo} alt="CP360 Logo" />
      </div>

      <div className="top-center">
        <div className="wx-strip wx-strip--top" aria-label="Weather strip">
          <div className="wx-left">
            <div className="wx-title">{computedTitle}</div>
            <div className="wx-date">{data.md}</div>
          </div>

          <div className="wx-icon" aria-hidden="true">
            {data.icon}
          </div>

          <div className="wx-temp">
            <span className="wx-temp-num">{data.temp}</span>
            <span className="wx-temp-lo">Lo</span>
            <span className="wx-temp-min">{data.low}</span>
          </div>

          <div className="wx-desc">
            <div className="wx-loc">{data.loc}</div>
            <div className="wx-phrase">{data.phrase}</div>

            <div className="wx-subphrase">
              <span className="wx-subicon" aria-hidden="true">
                {data.subIcon}
              </span>
              <span className="wx-subtext">{data.subText}</span>
            </div>
          </div>

          <div className="wx-rain" title="Probability of precipitation">
            <div className="rainChance">Chance of Rain:</div>
            <div>
              <span className="wx-drop" aria-hidden="true">
                ☔
              </span>
              <span className="wx-rain-num">{data.pop}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="clock-widget">
        <div className="clock-time">{time}</div>
        <div className="clock-date">{date}</div>
      </div>
    </header>
  );
};

export default TopBar;