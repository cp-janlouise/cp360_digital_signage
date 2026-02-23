import React, { useState, useEffect, useRef } from 'react';
import '/src/frontend/styles/ticker.css';

const messages = [
  'CX that pays dividends. Be the next-gen CX. Welcome to CP360!',
  'Your voices shape our future.',
  'Employee Satisfaction Survey now ongoing.',
  'Change makers start here.',
];

export const Ticker: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const innerRef = useRef<HTMLDivElement>(null);

  const currentMessage = messages[messageIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initTicker = () => {
      const inner = innerRef.current;
      if (!inner) return;

      // Wait for fonts to load
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          const seq = inner.querySelector('.ticker-seq');
          if (seq) {
            // Remove old clone if exists
            const oldClone = inner.querySelector('[data-clone="true"]');
            if (oldClone) oldClone.remove();

            // Clone the sequence
            const clone = seq.cloneNode(true) as HTMLElement;
            clone.setAttribute('data-clone', 'true');
            inner.appendChild(clone);

            // Measure and set animation
            const seqWidth = seq.getBoundingClientRect().width;
            const pxPerSecond = 110;
            const duration = seqWidth / pxPerSecond;

            inner.style.setProperty('--scroll-distance', `${seqWidth}px`);
            inner.style.setProperty('--scroll-duration', `${duration}s`);

            // Restart animation
            inner.style.animation = 'none';
            inner.offsetHeight; // force reflow
            inner.style.animation = '';
          }
        });
      }
    };

    initTicker();
  }, [currentMessage]);

  return (
    <footer className="ticker">
      <div className="ticker-track">
        <div className="ticker-inner" ref={innerRef}>
          <div className="ticker-seq">
            <span className="ticker-item">{currentMessage}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Ticker;
